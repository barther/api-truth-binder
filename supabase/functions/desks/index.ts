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
    
    // Handle different endpoints
    if (req.method === 'GET') {
      if (pathParts[3] === 'tricks' && pathParts[2]) {
        // GET /desks/:id/tricks
        const deskId = parseInt(pathParts[2])
        
        const { data: tricks, error } = await supabaseClient
          .from('tricks')
          .select('*')
          .eq('desk_id', deskId)
          .eq('is_active', true)
          .order('name')

        if (error) throw error

        return new Response(JSON.stringify(tricks), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else if (pathParts[3] === 'schedule' && pathParts[2]) {
        // GET /desks/:id/schedule?start=YYYY-MM-DD&end=YYYY-MM-DD
        const deskId = parseInt(pathParts[2])
        const start = url.searchParams.get('start')
        const end = url.searchParams.get('end')

        if (!start || !end) {
          return new Response(
            JSON.stringify({ error: 'start and end query parameters are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get trick instances with assignments for the desk and date range
        const { data: schedule, error } = await supabaseClient
          .from('trick_instances')
          .select(`
            *,
            tricks!inner (
              id,
              desk_id,
              name,
              shift_start,
              shift_end,
              timezone
            ),
            assignments (
              id,
              dispatcher_id,
              source,
              requires_trainer,
              trainer_id,
              created_at,
              deleted_at,
              dispatchers (
                id,
                badge,
                first_name,
                last_name,
                rank
              )
            )
          `)
          .eq('tricks.desk_id', deskId)
          .gte('starts_at', start + 'T00:00:00Z')
          .lte('starts_at', end + 'T23:59:59Z')
          .is('assignments.deleted_at', null)
          .order('starts_at')

        if (error) throw error

        return new Response(JSON.stringify(schedule), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        // GET /desks
        const { data: desks, error } = await supabaseClient
          .from('desks')
          .select('*')
          .eq('is_active', true)
          .order('code')

        if (error) throw error

        return new Response(JSON.stringify(desks), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (req.method === 'POST') {
      // Handle different POST actions
      const body = await req.json()
      
      if (body.action === 'schedule') {
        const { deskId, start, end } = body

        if (!deskId || !start || !end) {
          return new Response(
            JSON.stringify({ error: 'deskId, start and end are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get trick instances with assignments for the desk and date range
        const { data: schedule, error } = await supabaseClient
          .from('trick_instances')
          .select(`
            *,
            tricks!inner (
              id,
              desk_id,
              name,
              shift_start,
              shift_end,
              timezone
            ),
            assignments (
              id,
              dispatcher_id,
              source,
              requires_trainer,
              trainer_id,
              created_at,
              deleted_at,
              dispatchers (
                id,
                badge,
                first_name,
                last_name,
                rank
              )
            )
          `)
          .eq('tricks.desk_id', deskId)
          .gte('starts_at', start + 'T00:00:00Z')
          .lte('starts_at', end + 'T23:59:59Z')
          .is('assignments.deleted_at', null)
          .order('starts_at')

        if (error) throw error

        return new Response(JSON.stringify(schedule), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else if (body.action === 'get_tricks') {
        // GET tricks for a desk
        const { desk_id } = body
        
        const { data: tricks, error } = await supabaseClient
          .from('tricks')
          .select('*')
          .eq('desk_id', desk_id)
          .eq('is_active', true)
          .order('name')

        if (error) throw error

        return new Response(JSON.stringify(tricks), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        // POST /desks - create new desk
        const { code, name, territory, is_active = true } = body

        if (!code || !name) {
          return new Response(
            JSON.stringify({ error: 'code and name are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: desk, error } = await supabaseClient
          .from('desks')
          .insert({ code, name, territory, is_active })
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify(desk), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (req.method === 'PATCH') {
      // PATCH /desks/:id - update desk
      const deskId = parseInt(pathParts[2])
      const body = await req.json()
      const { code, name, territory, is_active } = body

      const updates: any = {}
      if (code !== undefined) updates.code = code
      if (name !== undefined) updates.name = name
      if (territory !== undefined) updates.territory = territory
      if (is_active !== undefined) updates.is_active = is_active

      const { data: desk, error } = await supabaseClient
        .from('desks')
        .update(updates)
        .eq('id', deskId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(desk), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in desks function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})