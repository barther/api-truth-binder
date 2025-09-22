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
    console.log('Qualifications function called with path:', url.pathname, 'method:', req.method)

    if (req.method === 'GET') {
      // GET /qualifications?dispatcher_id=123
      const dispatcherId = url.searchParams.get('dispatcher_id')
      
      if (!dispatcherId) {
        return new Response(
          JSON.stringify({ error: 'dispatcher_id query parameter is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: qualifications, error } = await supabaseClient
        .from('qualifications')
        .select(`
          *,
          desks (
            id,
            code,
            name
          ),
          trainers:dispatchers!qualifications_trainer_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('dispatcher_id', parseInt(dispatcherId))
        .eq('is_active', true)
        .order('qualified_on', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(qualifications), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (req.method === 'POST') {
      // POST /qualifications
      const body = await req.json()
      const { dispatcher_id, desk_id, qualified_on, trainer_id, notes } = body

      if (!dispatcher_id || !desk_id || !qualified_on) {
        return new Response(
          JSON.stringify({ error: 'dispatcher_id, desk_id, and qualified_on are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check for duplicate qualification
      const { data: existing } = await supabaseClient
        .from('qualifications')
        .select('id')
        .eq('dispatcher_id', dispatcher_id)
        .eq('desk_id', desk_id)
        .eq('is_active', true)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Dispatcher already qualified for this desk' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: qualification, error } = await supabaseClient
        .from('qualifications')
        .insert({ 
          dispatcher_id, 
          desk_id, 
          qualified_on, 
          trainer_id: trainer_id || null,
          notes: notes || null,
          is_active: true
        })
        .select(`
          *,
          desks (
            id,
            code,
            name
          ),
          trainers:dispatchers!qualifications_trainer_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .single()

      if (error) throw error

      return new Response(JSON.stringify(qualification), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (req.method === 'DELETE') {
      // DELETE /qualifications/:id
      const qualificationId = parseInt(pathParts[2])
      const body = await req.json()

      const { data: qualification, error } = await supabaseClient
        .from('qualifications')
        .update({ is_active: false })
        .eq('id', qualificationId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(qualification), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in qualifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})