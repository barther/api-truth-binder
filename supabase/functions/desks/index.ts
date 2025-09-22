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
    console.log('Desks function called with path:', url.pathname, 'method:', req.method)

    if (req.method === 'GET') {
      if (pathParts[3] === 'tricks' && pathParts[2]) {
        // GET /desks/:id/tricks
        const deskId = pathParts[2]
        
        const { data: tricks, error } = await supabaseClient
          .from('tricks')
          .select(`
            *,
            shifts (
              code,
              starts_at,
              ends_at
            )
          `)
          .eq('desk_id', deskId)
          .order('title')

        if (error) throw error

        return new Response(JSON.stringify(tricks), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        // GET /desks
        const { data: desks, error } = await supabaseClient
          .from('desks')
          .select(`
            *,
            divisions (
              code,
              name
            )
          `)
          .eq('is_active', true)
          .order('desk_code')

        if (error) throw error

        return new Response(JSON.stringify(desks), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (req.method === 'POST') {
      // POST /desks - create new desk
      const body = await req.json()
      const { desk_code, desk_name, division_id, is_active = true } = body

      if (!desk_code || !desk_name || !division_id) {
        return new Response(
          JSON.stringify({ error: 'desk_code, desk_name, and division_id are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: desk, error } = await supabaseClient
        .from('desks')
        .insert({ desk_code, desk_name, division_id, is_active })
        .select(`
          *,
          divisions (
            code,
            name
          )
        `)
        .single()

      if (error) throw error

      return new Response(JSON.stringify(desk), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (req.method === 'PATCH') {
      // PATCH /desks/:id - update desk
      const deskId = pathParts[2]
      const body = await req.json()
      const { desk_code, desk_name, division_id, is_active } = body

      const updates: any = {}
      if (desk_code !== undefined) updates.desk_code = desk_code
      if (desk_name !== undefined) updates.desk_name = desk_name
      if (division_id !== undefined) updates.division_id = division_id
      if (is_active !== undefined) updates.is_active = is_active

      const { data: desk, error } = await supabaseClient
        .from('desks')
        .update(updates)
        .eq('desk_id', deskId)
        .select(`
          *,
          divisions (
            code,
            name
          )
        `)
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