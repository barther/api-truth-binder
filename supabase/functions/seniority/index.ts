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
    console.log('Seniority function called with path:', url.pathname, 'method:', req.method)

    if (req.method === 'PUT') {
      // PUT /seniority/:dispatcher_id
      const dispatcherId = parseInt(pathParts[2])
      const body = await req.json()
      const { rank, tie_breaker = 0 } = body

      if (!rank) {
        return new Response(
          JSON.stringify({ error: 'rank is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: seniority, error } = await supabaseClient
        .from('seniority')
        .upsert({ 
          dispatcher_id: dispatcherId, 
          rank, 
          tie_breaker 
        }, { 
          onConflict: 'dispatcher_id' 
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(seniority), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in seniority function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})