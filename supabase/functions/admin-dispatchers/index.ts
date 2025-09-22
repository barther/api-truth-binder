import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (req.method === 'GET') {
      // GET /admin-dispatchers - List all dispatchers
      const { data: dispatchers, error } = await supabaseClient
        .from('dispatchers')
        .select('*')
        .order('seniority_date');

      if (error) {
        console.error('Error fetching dispatchers:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ dispatchers: dispatchers || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      // POST /admin-dispatchers - Create a new dispatcher
      const body = await req.json();
      let { emp_id, first_name, last_name, seniority_date, status = 'ACTIVE' } = body;

      // Ensure status is uppercase to match database constraint
      if (status && typeof status === 'string') {
        status = status.toUpperCase();
      }

      if (!emp_id || !first_name || !last_name || !seniority_date) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: emp_id, first_name, last_name, seniority_date' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate status
      if (!['ACTIVE', 'INACTIVE', 'ON_LEAVE'].includes(status)) {
        return new Response(JSON.stringify({ 
          error: 'Status must be one of: ACTIVE, INACTIVE, ON_LEAVE' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: dispatcher, error } = await supabaseClient
        .from('dispatchers')
        .insert([{
          emp_id,
          first_name,
          last_name,
          seniority_date,
          status
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating dispatcher:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ dispatcher }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'PATCH') {
      // PATCH /admin-dispatchers/{id} - Update a dispatcher
      const dispatcherId = pathParts[1];
      if (!dispatcherId) {
        return new Response(JSON.stringify({ error: 'Dispatcher ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();
      let { emp_id, first_name, last_name, seniority_date, status } = body;

      const updateData: any = {};
      if (emp_id !== undefined) updateData.emp_id = emp_id;
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (seniority_date !== undefined) updateData.seniority_date = seniority_date;
      if (status !== undefined) {
        // Ensure status is uppercase
        updateData.status = typeof status === 'string' ? status.toUpperCase() : status;
      }

      const { data: dispatcher, error } = await supabaseClient
        .from('dispatchers')
        .update(updateData)
        .eq('id', dispatcherId)
        .select()
        .single();

      if (error) {
        console.error('Error updating dispatcher:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ dispatcher }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE') {
      // DELETE /admin-dispatchers/{id} - Delete a dispatcher
      const dispatcherId = pathParts[1];
      if (!dispatcherId) {
        return new Response(JSON.stringify({ error: 'Dispatcher ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error } = await supabaseClient
        .from('dispatchers')
        .delete()
        .eq('id', dispatcherId);

      if (error) {
        console.error('Error deleting dispatcher:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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