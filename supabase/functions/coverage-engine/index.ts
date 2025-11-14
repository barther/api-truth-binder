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

    // Build enhanced rule trace for each candidate
    const scoredCandidates = eligible.map((c: any) => {
      const ruleTrace = {
        step: c.step_number,
        stepName: c.step_name,
        payBasis: c.pay_basis,
        isDiversion: c.is_diversion,
        checks: [
          { name: 'QUAL', ok: c.is_qualified },
          { name: 'HOS', ok: c.is_hos_ok, detail: `${c.rest_hours}h rest` },
          { name: 'AVAILABLE', ok: c.is_available }
        ],
        diversionDetails: c.is_diversion ? {
          currentlyAssignedSlotId: c.currently_assigned_slot_id,
          ebCanBackfill: c.eb_can_backfill
        } : null,
        onRestDay: c.on_rest_day
      }

      return {
        ...c,
        ruleTrace
      }
    })

    // Candidates are already sorted by order of call from SQL
    // No additional sorting needed

    const best = scoredCandidates[0] || null
    const alternatives = scoredCandidates.slice(1, 6) // Top 5 alternatives

    // Build response with explanation
    let explanation = ''
    if (best) {
      explanation = `${best.first_name} ${best.last_name} (Emp #${best.emp_no}) should be assigned. `
      explanation += `${best.step_name}. `
      explanation += `Seniority rank: ${best.seniority_rank}. `
      explanation += `Pay basis: ${best.pay_basis}. `

      if (best.is_diversion) {
        explanation += `This is a DIVERSION from their current assignment. `
        if (best.eb_can_backfill) {
          explanation += `EB is available to backfill their original job. `
        } else {
          explanation += `WARNING: No EB backfill available - creates cascading vacancy. `
        }
      }

      if (best.on_rest_day) {
        explanation += `Currently on rest day (offered as overtime). `
      }

      explanation += `Rest hours: ${best.rest_hours}h.`
    } else {
      explanation = 'No eligible candidates found. Check qualifications, HOS compliance, and availability.'
    }

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
        step_number: best.step_number,
        step_name: best.step_name,
        pay_basis: best.pay_basis,
        is_diversion: best.is_diversion,
        on_rest_day: best.on_rest_day,
        currently_assigned_slot_id: best.currently_assigned_slot_id,
        eb_can_backfill: best.eb_can_backfill,
        rest_hours: best.rest_hours,
        rule_trace: best.ruleTrace
      } : null,
      alternatives: alternatives.map((a: any) => ({
        employee_id: a.employee_id,
        emp_no: a.emp_no,
        name: `${a.first_name} ${a.last_name}`,
        seniority_rank: a.seniority_rank,
        source: a.source,
        step_number: a.step_number,
        step_name: a.step_name,
        pay_basis: a.pay_basis,
        is_diversion: a.is_diversion,
        on_rest_day: a.on_rest_day,
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
