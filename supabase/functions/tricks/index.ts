import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function supabaseServer() {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

function err(code: string, message: string, status = 400, details: any = {}) {
  return new Response(JSON.stringify({ error: { code, message, details } }), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders }
  })
}

function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders }
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = supabaseServer()
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    if (req.method === 'GET') {
      const desk_id = url.searchParams.get('desk_id')
      
      let query = supabase
        .from('tricks')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (desk_id) {
        query = query.eq('desk_id', parseInt(desk_id))
      }

      const { data, error } = await query
      if (error) return err('QueryFailed', error.message, 400)
      return ok(data)
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabase
        .from('tricks')
        .insert(body)
        .select()
        .single()
      
      if (error) return err('InsertFailed', error.message, 400)
      return ok(data, 201)
    }

    if (req.method === 'PATCH' && pathSegments.length === 2) {
      const id = parseInt(pathSegments[1])
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('tricks')
        .update(body)
        .eq('id', id)
        .select()
        .single()
      
      if (error) return err('UpdateFailed', error.message, 400)
      return ok(data)
    }

    // Build calendar for trick instances
    if (req.method === 'POST' && pathSegments.includes('build')) {
      const body = await req.json()
      const { error } = await supabase.rpc('build_trick_instances', { 
        p_desk_id: body.desk_id, 
        p_start: body.start, 
        p_end: body.end 
      })
      
      if (error) return err('BuildFailed', error.message, 400)
      return ok({ success: true })
    }

    return err('NotFound', 'Unsupported route', 404)
  } catch (error) {
    return err('ServerError', error.message, 500)
  }
})