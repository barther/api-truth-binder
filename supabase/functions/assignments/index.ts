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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')

    if (req.method === 'POST') {
      // POST /assignments
      const {
        trick_instance_id,
        dispatcher_id,
        source = 'BASE',
        requires_trainer = false,
        trainer_id = null
      } = await req.json()

      // Validate required fields
      if (!trick_instance_id || !dispatcher_id) {
        return new Response(
          JSON.stringify({ error: 'trick_instance_id and dispatcher_id are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get trick instance details for validation
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
        .eq('id', trick_instance_id)
        .single()

      if (trickError || !trickInstance) {
        return new Response(
          JSON.stringify({ error: 'Invalid trick_instance_id' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if dispatcher is qualified for the desk
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

      // Check for existing active assignment on this trick instance
      const { data: existingAssignment, error: existingError } = await supabaseClient
        .from('assignments')
        .select('*')
        .eq('trick_instance_id', trick_instance_id)
        .is('deleted_at', null)
        .maybeSingle()

      if (existingError) throw existingError

      if (existingAssignment) {
        return new Response(
          JSON.stringify({ 
            error: 'Trick instance already has an active assignment',
            code: 'CONFLICT'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check for dispatcher conflicts (overlapping assignments)
      const { data: conflicts, error: conflictError } = await supabaseClient
        .from('assignments')
        .select('*')
        .eq('dispatcher_id', dispatcher_id)
        .is('deleted_at', null)
        .gte('ends_at', trickInstance.starts_at)
        .lte('starts_at', trickInstance.ends_at)

      if (conflictError) throw conflictError

      if (conflicts && conflicts.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Dispatcher has conflicting assignment',
            code: 'CONFLICT'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check for absences
      const { data: absences, error: absenceError } = await supabaseClient
        .from('absences')
        .select('*')
        .eq('dispatcher_id', dispatcher_id)
        .lte('starts_at', trickInstance.ends_at)
        .gte('ends_at', trickInstance.starts_at)

      if (absenceError) throw absenceError

      if (absences && absences.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Dispatcher is absent during this time',
            code: 'ABSENCE_OVERLAP'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate trainer requirements
      if (requires_trainer && !trainer_id) {
        return new Response(
          JSON.stringify({ 
            error: 'Trainee requires a trainer',
            code: 'TRAINEE_REQUIRES_TRAINER'
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create the assignment
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from('assignments')
        .insert({
          trick_instance_id,
          dispatcher_id,
          source,
          starts_at: trickInstance.starts_at,
          ends_at: trickInstance.ends_at,
          requires_trainer,
          trainer_id,
          created_by: dispatcher_id // For now, using the same dispatcher as creator
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

    } else if (req.method === 'DELETE') {
      // DELETE /assignments/:id
      const assignmentId = parseInt(pathParts[2])
      
      if (!assignmentId) {
        return new Response(
          JSON.stringify({ error: 'Assignment ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the assignment for audit log
      const { data: assignment, error: getError } = await supabaseClient
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .is('deleted_at', null)
        .single()

      if (getError || !assignment) {
        return new Response(
          JSON.stringify({ error: 'Assignment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Soft delete the assignment
      const { error: deleteError } = await supabaseClient
        .from('assignments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', assignmentId)

      if (deleteError) throw deleteError

      // Create audit log
      await supabaseClient
        .from('audit_logs')
        .insert({
          actor: assignment.dispatcher_id,
          action: 'DELETE',
          entity: 'assignments',
          entity_id: assignmentId,
          before_data: assignment,
          after_data: { ...assignment, deleted_at: new Date().toISOString() }
        })

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in assignments function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})