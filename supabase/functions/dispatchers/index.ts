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
        // GET /dispatchers?q=search
        const query = url.searchParams.get('q') || ''
        
        let queryBuilder = supabaseClient
          .from('dispatchers')
          .select(`
            *,
            seniority (
              rank,
              tie_breaker
            )
          `)
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
      // POST /dispatchers - create new dispatcher
      const body = await req.json()
      const { first_name, last_name, badge, is_active = true } = body

      if (!first_name || !last_name || !badge) {
        return new Response(
          JSON.stringify({ error: 'first_name, last_name, and badge are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: dispatcher, error } = await supabaseClient
        .from('dispatchers')
        .insert({ first_name, last_name, badge, is_active })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(dispatcher), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (req.method === 'PATCH') {
      // PATCH /dispatchers/:id - update dispatcher
      const dispatcherId = parseInt(pathParts[2])
      const body = await req.json()
      const { first_name, last_name, badge, is_active } = body

      const updates: any = {}
      if (first_name !== undefined) updates.first_name = first_name
      if (last_name !== undefined) updates.last_name = last_name
      if (badge !== undefined) updates.badge = badge
      if (is_active !== undefined) updates.is_active = is_active

      const { data: dispatcher, error } = await supabaseClient
        .from('dispatchers')
        .update(updates)
        .eq('id', dispatcherId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(dispatcher), {
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