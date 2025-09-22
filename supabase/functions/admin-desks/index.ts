import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (req.method === 'GET') {
      // GET /admin-desks - List all desks with divisions
      const { data: desks, error } = await supabaseClient
        .from('desks')
        .select('*')
        .order('code');

      if (error) {
        console.error('Error fetching desks:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Also get divisions
      const { data: divisions, error: divisionsError } = await supabaseClient
        .from('divisions')
        .select('*')
        .order('code');

      if (divisionsError) {
        console.error('Error fetching divisions:', divisionsError);
      }

      return new Response(JSON.stringify({ 
        desks: desks || [], 
        divisions: divisions || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      // POST /admin-desks - Create a new desk
      const body = await req.json();
      const { code, name, division, is_active = true } = body;

      if (!code || !name || !division) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: code, name, division' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: desk, error } = await supabaseClient
        .from('desks')
        .insert([{
          code,
          name,
          division,
          is_active
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating desk:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ desk }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'PATCH') {
      // PATCH /admin-desks/{id} - Update a desk
      const deskId = pathParts[1];
      if (!deskId) {
        return new Response(JSON.stringify({ error: 'Desk ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();
      const { code, name, division, is_active } = body;

      const updateData: any = {};
      if (code !== undefined) updateData.code = code;
      if (name !== undefined) updateData.name = name;
      if (division !== undefined) updateData.division = division;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: desk, error } = await supabaseClient
        .from('desks')
        .update(updateData)
        .eq('id', deskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating desk:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ desk }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE') {
      // DELETE /admin-desks/{id} - Delete a desk
      const deskId = pathParts[1];
      if (!deskId) {
        return new Response(JSON.stringify({ error: 'Desk ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error } = await supabaseClient
        .from('desks')
        .delete()
        .eq('id', deskId);

      if (error) {
        console.error('Error deleting desk:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});