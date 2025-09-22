import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Job {
  id: string;
  job_code: string;
  trick_id: string;
  desk_id: string;
  shift: string;
  work_days: number[];
}

interface Assignment {
  id: string;
  job_id: string;
  service_date: string;
  dispatcher_id: string;
  source: string;
  requires_trainer: boolean;
  notes?: string;
}

interface Ownership {
  dispatcher_id: string;
  start_date: string;
  end_date?: string;
  source: string;
}

interface Dispatcher {
  id: string;
  emp_id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface DerivedCell {
  kind: 'explicit' | 'implicitBase' | 'vacancy';
  source?: string;
  dispatcher?: Dispatcher;
  notes?: string;
  requires_trainer?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (req.method === 'GET' && pathParts[1] === 'date') {
      // GET /schedule/date/{date}?division={division}
      const serviceDate = pathParts[2];
      const division = url.searchParams.get('division');

      if (!serviceDate) {
        return new Response(JSON.stringify({ error: 'Service date required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get jobs for date using the database function
      const { data: jobsData, error: jobsError } = await supabaseClient
        .rpc('jobs_for_date', { p_date: serviceDate });

      if (jobsError) {
        console.error('Error fetching jobs for date:', jobsError);
        return new Response(JSON.stringify({ error: jobsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get desk and trick details
      const { data: jobDetails, error: detailsError } = await supabaseClient
        .from('jobs')
        .select(`
          id,
          job_code,
          trick_id,
          tricks!inner(
            id,
            shift,
            work_days,
            desk_id,
            desks!inner(
              id,
              code,
              name,
              division
            )
          )
        `)
        .in('id', jobsData.map((j: any) => j.job_id));

      if (detailsError) {
        console.error('Error fetching job details:', detailsError);
        return new Response(JSON.stringify({ error: detailsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Filter by division if specified
      const filteredJobs = division 
        ? jobDetails.filter((job: any) => job.tricks.desks.division === division)
        : jobDetails;

      // Get explicit assignments for these jobs on this date
      const { data: assignments, error: assignmentsError } = await supabaseClient
        .from('assignments')
        .select(`
          *,
          dispatchers(id, emp_id, first_name, last_name, status)
        `)
        .eq('service_date', serviceDate)
        .in('job_id', filteredJobs.map((j: any) => j.id));

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return new Response(JSON.stringify({ error: assignmentsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get active ownerships for these jobs on this date
      const ownershipPromises = filteredJobs.map(async (job: any) => {
        const { data: ownership, error } = await supabaseClient
          .rpc('active_job_owner_on', { 
            p_job_id: job.id, 
            p_date: serviceDate 
          });
        
        if (error) {
          console.error(`Error fetching ownership for job ${job.id}:`, error);
          return { job_id: job.id, ownership: null };
        }
        
        return { job_id: job.id, ownership: ownership?.[0] || null };
      });

      const ownerships = await Promise.all(ownershipPromises);

      // Get dispatcher details for owners
      const ownerIds = ownerships
        .filter(o => o.ownership?.dispatcher_id)
        .map(o => o.ownership.dispatcher_id);

      const { data: ownerDispatchers, error: ownersError } = await supabaseClient
        .from('dispatchers')
        .select('id, emp_id, first_name, last_name, status')
        .in('id', ownerIds);

      if (ownersError) {
        console.error('Error fetching owner dispatchers:', ownersError);
      }

      // Build derived schedule
      const schedule = filteredJobs.map((job: any) => {
        const explicit = assignments?.find((a: any) => a.job_id === job.id);
        const ownership = ownerships.find(o => o.job_id === job.id)?.ownership;
        const ownerDispatcher = ownership 
          ? ownerDispatchers?.find((d: any) => d.id === ownership.dispatcher_id)
          : null;

        let cell: DerivedCell;

        if (explicit) {
          // Explicit assignment exists
          cell = {
            kind: 'explicit',
            source: explicit.source,
            dispatcher: explicit.dispatchers,
            notes: explicit.notes,
            requires_trainer: explicit.requires_trainer
          };
        } else if (ownership && ownerDispatcher) {
          // Implicit BASE from ownership
          cell = {
            kind: 'implicitBase',
            source: 'BASE',
            dispatcher: ownerDispatcher
          };
        } else {
          // Vacancy
          cell = {
            kind: 'vacancy'
          };
        }

        return {
          job: {
            id: job.id,
            job_code: job.job_code,
            trick_id: job.trick_id,
            desk_id: job.tricks.desk_id,
            shift: job.tricks.shift,
            work_days: job.tricks.work_days,
            desk: job.tricks.desks
          },
          cell,
          service_date: serviceDate
        };
      });

      return new Response(JSON.stringify({ schedule }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST' && pathParts[1] === 'ownership') {
      // POST /schedule/ownership - Set job owner
      const { job_id, dispatcher_id, start_date, source = 'BID' } = await req.json();

      const { error } = await supabaseClient
        .rpc('set_job_owner', {
          p_job_id: job_id,
          p_dispatcher_id: dispatcher_id,
          p_start: start_date,
          p_source: source
        });

      if (error) {
        console.error('Error setting job owner:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST' && pathParts[1] === 'assignment') {
      // POST /schedule/assignment - Upsert assignment
      const { job_id, service_date, dispatcher_id, source, requires_trainer = false } = await req.json();

      const { data: assignmentId, error } = await supabaseClient
        .rpc('upsert_assignment', {
          p_job_id: job_id,
          p_date: service_date,
          p_dispatcher_id: dispatcher_id,
          p_source: source,
          p_requires_trainer: requires_trainer
        });

      if (error) {
        console.error('Error upserting assignment:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, id: assignmentId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE' && pathParts[1] === 'assignment') {
      // DELETE /schedule/assignment - Clear assignment
      const { job_id, service_date } = await req.json();

      const { error } = await supabaseClient
        .rpc('clear_assignment', {
          p_job_id: job_id,
          p_date: service_date
        });

      if (error) {
        console.error('Error clearing assignment:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});