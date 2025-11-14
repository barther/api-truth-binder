import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { slot_id, employee_id, source, notes } = await req.json()

    if (!slot_id || !employee_id || !source) {
      return new Response(
        JSON.stringify({ error: 'slot_id, employee_id, and source are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if slot already has a PRIMARY assignment
    const { data: existing } = await supabaseClient
      .from('assignments')
      .select('*')
      .eq('schedule_slot_id', slot_id)
      .eq('role', 'PRIMARY')
      .single()

    if (existing) {
      // Update existing assignment
      const { data, error } = await supabaseClient
        .from('assignments')
        .update({
          employee_id,
          source,
          notes,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to update assignment', detail: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, assignment: data, action: 'updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Create new assignment
      const { data, error } = await supabaseClient
        .from('assignments')
        .insert({
          schedule_slot_id: slot_id,
          employee_id,
          role: 'PRIMARY',
          source,
          notes
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create assignment', detail: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, assignment: data, action: 'created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
