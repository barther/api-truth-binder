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

    if (req.method === 'GET') {
      if (pathParts[2] && pathParts[2] !== '') {
        // GET /dispatchers/:id
        const dispatcherId = parseInt(pathParts[2])
        
        const { data: dispatcher, error } = await supabaseClient
          .from('dispatchers')
          .select(`
            *,
            qualifications (
              id,
              desk_id,
              qualified_on,
              trainer_id,
              notes,
              desks (
                id,
                code,
                name
              )
            ),
            seniority (
              rank,
              tie_breaker
            )
          `)
          .eq('id', dispatcherId)
          .eq('is_active', true)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            return new Response(
              JSON.stringify({ error: 'Dispatcher not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          throw error
        }

        return new Response(JSON.stringify(dispatcher), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        // GET /dispatchers?q=search or POST with body
        let query = url.searchParams.get('q') || ''
        
        // If it's a POST request, get query from body
        if (req.method === 'POST' || (req.method === 'GET' && req.body)) {
          try {
            const body = await req.json()
            query = body.q || query
          } catch (e) {
            // Ignore body parsing errors for GET requests
          }
        }
        
        let queryBuilder = supabaseClient
          .from('dispatchers')
          .select(`
            *,
            qualifications (
              id,
              desk_id,
              qualified_on,
              desks (
                id,
                code,
                name
              )
            ),
            seniority (
              rank,
              tie_breaker
            )
          `)
          .eq('is_active', true)
          .order('last_name')

        // Apply search filter if provided
        if (query.trim()) {
          queryBuilder = queryBuilder.or(
            `first_name.ilike.%${query}%,last_name.ilike.%${query}%,badge.ilike.%${query}%`
          )
        }

        const { data: dispatchers, error } = await queryBuilder

        if (error) throw error

        return new Response(JSON.stringify(dispatchers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (req.method === 'POST') {
      // Handle POST request for searching with body
      const { q = '' } = await req.json()
      
      let queryBuilder = supabaseClient
        .from('dispatchers')
        .select(`
          *,
          qualifications (
            id,
            desk_id,
            qualified_on,
            desks (
              id,
              code,
              name
            )
          ),
          seniority (
            rank,
            tie_breaker
          )
        `)
        .eq('is_active', true)
        .order('last_name')

      // Apply search filter if provided
      if (q.trim()) {
        queryBuilder = queryBuilder.or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,badge.ilike.%${q}%`
        )
      }

      const { data: dispatchers, error } = await queryBuilder

      if (error) throw error

      return new Response(JSON.stringify(dispatchers), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in dispatchers function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})