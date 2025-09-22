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

    if (req.method === 'POST') {
      const body = await req.json() // {desk_id, start, end}
      const { error } = await supabase.rpc('build_trick_instances', { 
        p_desk_id: body.desk_id, 
        p_start: body.start, 
        p_end: body.end 
      })
      
      if (error) return err('BuildFailed', error.message, 400)
      return ok({ success: true })
    }

    return err('MethodNotAllowed', 'Use POST', 405)
  } catch (error) {
    return err('ServerError', error.message, 500)
  }
})