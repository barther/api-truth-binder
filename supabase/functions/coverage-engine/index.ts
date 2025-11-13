import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { slot_id } = await req.json()

    if (!slot_id) {
      return new Response(
        JSON.stringify({ error: 'slot_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get vacancy/slot details
    const { data: slot, error: slotError } = await supabaseClient
      .from('schedule_slots')
      .select(`
        *,
        desk_tricks!inner(
          *,
          desks!inner(
            *,
            divisions(*)
          ),
          shifts(*)
        )
      `)
      .eq('id', slot_id)
      .single()

    if (slotError || !slot) {
      return new Response(
        JSON.stringify({ error: 'Slot not found', detail: slotError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the get_candidates_for_vacancy function
    const { data: candidates, error: candidatesError } = await supabaseClient
      .rpc('get_candidates_for_vacancy', { _slot_id: slot_id })

    if (candidatesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get candidates', detail: candidatesError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter to only eligible candidates (qualified, HOS ok, available)
    const eligible = candidates?.filter((c: any) =>
      c.is_qualified && c.is_hos_ok && c.is_available
    ) || []

    // Calculate cost for each candidate
    const scoredCandidates = eligible.map((c: any) => {
      let cost = 0
      const ruleTrace = {
        band: c.band,
        checks: [
          { name: 'QUAL', ok: c.is_qualified },
          { name: 'HOS', ok: c.is_hos_ok, detail: `${c.rest_hours}h rest` },
          { name: 'AVAILABLE', ok: c.is_available }
        ],
        costBreakdown: {
          baseBand: c.band === 'INCUMBENT' ? 0 : c.band === 'HOLD_DOWN' ? 1 : c.band === 'RELIEF_LINE' ? 2 : c.band === 'ATW' ? 3 : 4,
          seniority: c.seniority_rank * 0.01, // Small weight for seniority within band
          total: 0
        }
      }

      // Base cost from band (lower is better)
      if (c.band === 'INCUMBENT') cost = 0
      else if (c.band === 'HOLD_DOWN') cost = 1
      else if (c.band === 'RELIEF_LINE') cost = 2
      else if (c.band === 'ATW') cost = 3
      else if (c.band === 'BOARD') cost = 4

      // Tiny seniority tiebreaker within same band
      cost += c.seniority_rank * 0.01

      ruleTrace.costBreakdown.total = cost

      return {
        ...c,
        cost,
        ruleTrace
      }
    })

    // Sort by cost (ascending), then seniority rank
    scoredCandidates.sort((a: any, b: any) => {
      if (a.cost !== b.cost) return a.cost - b.cost
      return a.seniority_rank - b.seniority_rank
    })

    const best = scoredCandidates[0] || null
    const alternatives = scoredCandidates.slice(1, 6) // Top 5 alternatives

    // Build response with explanation
    const explanation = best ?
      `${best.first_name} ${best.last_name} (Emp #${best.emp_no}) should be assigned via ${best.band}. Seniority rank: ${best.seniority_rank}. Rest hours: ${best.rest_hours}h.` :
      'No eligible candidates found. Check qualifications, HOS compliance, and availability.'

    const result = {
      slot: {
        id: slot.id,
        date: slot.local_date,
        trick: slot.desk_tricks.code,
        desk: slot.desk_tricks.desks.name,
        shift: slot.desk_tricks.shifts.name,
        division: slot.desk_tricks.desks.divisions.name
      },
      recommendation: best ? {
        employee_id: best.employee_id,
        emp_no: best.emp_no,
        name: `${best.first_name} ${best.last_name}`,
        seniority_rank: best.seniority_rank,
        source: best.source,
        band: best.band,
        cost: best.cost,
        rest_hours: best.rest_hours,
        rule_trace: best.ruleTrace
      } : null,
      alternatives: alternatives.map((a: any) => ({
        employee_id: a.employee_id,
        emp_no: a.emp_no,
        name: `${a.first_name} ${a.last_name}`,
        seniority_rank: a.seniority_rank,
        source: a.source,
        band: a.band,
        cost: a.cost,
        rest_hours: a.rest_hours
      })),
      explanation,
      all_candidates_count: candidates?.length || 0,
      eligible_count: eligible.length,
      ineligible_reasons: candidates?.filter((c: any) =>
        !c.is_qualified || !c.is_hos_ok || !c.is_available
      ).map((c: any) => ({
        emp_no: c.emp_no,
        name: `${c.first_name} ${c.last_name}`,
        reasons: [
          !c.is_qualified && 'Not qualified for this desk',
          !c.is_hos_ok && `Insufficient rest (${c.rest_hours}h < 15h)`,
          !c.is_available && 'Marked off or on leave'
        ].filter(Boolean)
      })) || []
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
