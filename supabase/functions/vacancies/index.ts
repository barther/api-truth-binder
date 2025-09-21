import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')

    if (req.method === 'GET') {
      // GET /vacancies?start=YYYY-MM-DD&end=YYYY-MM-DD
      const start = url.searchParams.get('start')
      const end = url.searchParams.get('end')

      if (!start || !end) {
        return new Response(
          JSON.stringify({ error: 'start and end query parameters are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get all trick instances in the date range
      const { data: trickInstances, error: trickError } = await supabaseClient
        .from('trick_instances')
        .select(`
          *,
          tricks (
            id,
            desk_id,
            name,
            shift_start,
            shift_end,
            timezone,
            desks (
              id,
              code,
              name,
              territory
            )
          ),
          assignments!left (
            id,
            dispatcher_id,
            source,
            deleted_at
          )
        `)
        .gte('starts_at', start + 'T00:00:00Z')
        .lte('starts_at', end + 'T23:59:59Z')
        .order('starts_at')

      if (trickError) throw trickError

      // Filter to only include trick instances without active assignments (vacancies)
      const vacancies = trickInstances.filter(instance => {
        const activeAssignments = instance.assignments?.filter(
          (assignment: any) => assignment.deleted_at === null
        ) || []
        return activeAssignments.length === 0
      })

      // Remove the assignments field since we don't need it in the response
      const cleanVacancies = vacancies.map(vacancy => {
        const { assignments, ...cleanVacancy } = vacancy
        return cleanVacancy
      })

      return new Response(JSON.stringify(cleanVacancies), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (req.method === 'POST' && pathParts[2] && pathParts[3] === 'award') {
      // POST /vacancies/:id/award
      const trickInstanceId = parseInt(pathParts[2])
      const { dispatcher_id, source = 'HOLD_DOWN' } = await req.json()

      if (!dispatcher_id) {
        return new Response(
          JSON.stringify({ error: 'dispatcher_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get trick instance details
      const { data: trickInstance, error: trickError } = await supabaseClient
        .from('trick_instances')
        .select(`
          *,
          tricks (
            id,
            desk_id,
            name
          )
        `)
        .eq('id', trickInstanceId)
        .single()

      if (trickError || !trickInstance) {
        return new Response(
          JSON.stringify({ error: 'Invalid trick_instance_id' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if still vacant
      const { data: existingAssignment, error: existingError } = await supabaseClient
        .from('assignments')
        .select('*')
        .eq('trick_instance_id', trickInstanceId)
        .is('deleted_at', null)
        .maybeSingle()

      if (existingError) throw existingError

      if (existingAssignment) {
        return new Response(
          JSON.stringify({ 
            error: 'Vacancy no longer exists - already assigned',
            code: 'CONFLICT'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate dispatcher qualification
      const { data: qualification, error: qualError } = await supabaseClient
        .from('qualifications')
        .select('*')
        .eq('dispatcher_id', dispatcher_id)
        .eq('desk_id', trickInstance.tricks.desk_id)
        .eq('is_active', true)
        .maybeSingle()

      if (qualError) throw qualError

      if (!qualification) {
        return new Response(
          JSON.stringify({ 
            error: 'Dispatcher not qualified for this desk',
            code: 'UNQUALIFIED'
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create the assignment
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from('assignments')
        .insert({
          trick_instance_id: trickInstanceId,
          dispatcher_id,
          source,
          starts_at: trickInstance.starts_at,
          ends_at: trickInstance.ends_at,
          created_by: dispatcher_id
        })
        .select('*')
        .single()

      if (assignmentError) throw assignmentError

      // Create audit log
      await supabaseClient
        .from('audit_logs')
        .insert({
          actor: dispatcher_id,
          action: 'CREATE',
          entity: 'assignments',
          entity_id: assignment.id,
          after_data: assignment
        })

      return new Response(JSON.stringify(assignment), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in vacancies function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})