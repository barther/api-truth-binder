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
    console.log('Dispatchers function called with path:', url.pathname, 'method:', req.method)

    if (req.method === 'GET') {
      if (pathParts[2] && pathParts[2] !== '') {
        // GET /dispatchers/:id
        const dispatcherId = pathParts[2]
        
        const { data: dispatcher, error } = await supabaseClient
          .from('dispatchers')
          .select(`
            *,
            dispatcher_current_division!inner (
              division_id,
              divisions (
                code,
                name
              )
            )
          `)
          .eq('dispatcher_id', dispatcherId)
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
        // GET /dispatchers?q=search&division=GLF
        const query = url.searchParams.get('q') || ''
        const division = url.searchParams.get('division')
        
        let queryBuilder = supabaseClient
          .from('dispatchers')
          .select(`
            *,
            dispatcher_current_division (
              division_id,
              divisions (
                code,
                name
              )
            )
          `)
          .order('last_name')

        // Apply search filter if provided
        if (query.trim()) {
          queryBuilder = queryBuilder.or(
            `first_name.ilike.%${query}%,last_name.ilike.%${query}%,emp_id.ilike.%${query}%`
          )
        }

        const { data: dispatchers, error } = await queryBuilder

        if (error) throw error

        // Filter by division client-side if needed
        let filteredDispatchers = dispatchers
        if (division) {
          filteredDispatchers = dispatchers.filter(d => 
            d.dispatcher_current_division?.divisions?.code === division
          )
        }

        return new Response(JSON.stringify(filteredDispatchers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (req.method === 'POST') {
      // POST /dispatchers - create new dispatcher
      const body = await req.json()
      const { emp_id, first_name, last_name, seniority_date, status = 'active' } = body

      if (!emp_id || !first_name || !last_name || !seniority_date) {
        return new Response(
          JSON.stringify({ error: 'emp_id, first_name, last_name, and seniority_date are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: dispatcher, error } = await supabaseClient
        .from('dispatchers')
        .insert({ emp_id, first_name, last_name, seniority_date, status })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(dispatcher), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (req.method === 'PATCH') {
      // PATCH /dispatchers/:id - update dispatcher
      const dispatcherId = pathParts[2]
      const body = await req.json()
      const { emp_id, first_name, last_name, seniority_date, status } = body

      const updates: any = {}
      if (emp_id !== undefined) updates.emp_id = emp_id
      if (first_name !== undefined) updates.first_name = first_name
      if (last_name !== undefined) updates.last_name = last_name
      if (seniority_date !== undefined) updates.seniority_date = seniority_date
      if (status !== undefined) updates.status = status

      const { data: dispatcher, error } = await supabaseClient
        .from('dispatchers')
        .update(updates)
        .eq('dispatcher_id', dispatcherId)
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