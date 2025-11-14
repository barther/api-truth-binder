import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CascadeStep {
  stepNumber: number
  vacancySlotId: number
  filledByEmployee: any
  sourceStep: string
  isDiversion: boolean
  divertedFromSlotId?: number
  createdVacancySlotId?: number
  resolved: boolean
  notes: string
}

interface CascadeResult {
  cascadeId: number
  rootVacancySlotId: number
  steps: CascadeStep[]
  resolved: boolean
  resolutionDepth: number
  finalStatus: 'RESOLVED' | 'PARTIAL' | 'FAILED' | 'MAX_DEPTH'
}

async function resolveCascade(
  supabaseClient: any,
  slotId: number,
  cascadeId: number | null = null,
  currentDepth: number = 1,
  maxDepth: number = 5
): Promise<CascadeResult> {

  // Check max depth to prevent infinite loops
  if (currentDepth > maxDepth) {
    return {
      cascadeId: cascadeId || 0,
      rootVacancySlotId: slotId,
      steps: [],
      resolved: false,
      resolutionDepth: currentDepth - 1,
      finalStatus: 'MAX_DEPTH'
    }
  }

  // Create cascade record if this is the root
  if (!cascadeId) {
    const { data: cascadeData, error: cascadeError } = await supabaseClient
      .from('coverage_cascades')
      .insert({
        root_vacancy_slot_id: slotId,
        resolution_depth: 0,
        resolved: false
      })
      .select()
      .single()

    if (cascadeError) {
      throw new Error(`Failed to create cascade: ${cascadeError.message}`)
    }
    cascadeId = cascadeData.id
  }

  const steps: CascadeStep[] = []

  // Get candidates for this vacancy
  const { data: candidates, error: candidatesError } = await supabaseClient
    .rpc('get_candidates_for_vacancy', { _slot_id: slotId })

  if (candidatesError) {
    throw new Error(`Failed to get candidates: ${candidatesError.message}`)
  }

  // Filter to eligible only
  const eligible = candidates?.filter((c: any) =>
    c.is_qualified && c.is_hos_ok && c.is_available
  ) || []

  if (eligible.length === 0) {
    // No one available - cascade fails at this level
    const step: CascadeStep = {
      stepNumber: currentDepth,
      vacancySlotId: slotId,
      filledByEmployee: null,
      sourceStep: 'NONE_AVAILABLE',
      isDiversion: false,
      resolved: false,
      notes: 'No eligible candidates found'
    }
    steps.push(step)

    // Record in database
    await supabaseClient.from('cascade_steps').insert({
      cascade_id: cascadeId,
      step_number: currentDepth,
      vacancy_slot_id: slotId,
      filled_by_employee_id: null,
      source_step: 'NONE_AVAILABLE',
      is_diversion: false,
      resolved: false,
      notes: 'No eligible candidates found'
    })

    return {
      cascadeId,
      rootVacancySlotId: slotId,
      steps,
      resolved: false,
      resolutionDepth: currentDepth,
      finalStatus: 'FAILED'
    }
  }

  // Take the first eligible candidate (already sorted by order of call)
  const best = eligible[0]

  // Record this step
  const step: CascadeStep = {
    stepNumber: currentDepth,
    vacancySlotId: slotId,
    filledByEmployee: {
      id: best.employee_id,
      emp_no: best.emp_no,
      name: `${best.first_name} ${best.last_name}`,
      seniority_rank: best.seniority_rank,
      step_name: best.step_name,
      pay_basis: best.pay_basis
    },
    sourceStep: best.step_name,
    isDiversion: best.is_diversion,
    divertedFromSlotId: best.currently_assigned_slot_id,
    resolved: !best.is_diversion, // If not a diversion, this step is fully resolved
    notes: `${best.step_name} - ${best.pay_basis}`
  }

  steps.push(step)

  // Record in database
  await supabaseClient.from('cascade_steps').insert({
    cascade_id: cascadeId,
    step_number: currentDepth,
    vacancy_slot_id: slotId,
    filled_by_employee_id: best.employee_id,
    source_step: best.step_name,
    is_diversion: best.is_diversion,
    diverted_from_slot_id: best.currently_assigned_slot_id,
    resolved: !best.is_diversion,
    notes: step.notes
  })

  // If this is a diversion, we need to fill their original job
  if (best.is_diversion && best.currently_assigned_slot_id) {
    step.createdVacancySlotId = best.currently_assigned_slot_id

    // Update the cascade step with the created vacancy
    await supabaseClient
      .from('cascade_steps')
      .update({ created_vacancy_slot_id: best.currently_assigned_slot_id })
      .eq('cascade_id', cascadeId)
      .eq('step_number', currentDepth)

    // Recursively resolve the backfill vacancy
    const backfillResult = await resolveCascade(
      supabaseClient,
      best.currently_assigned_slot_id,
      cascadeId,
      currentDepth + 1,
      maxDepth
    )

    // Add backfill steps to our steps
    steps.push(...backfillResult.steps)

    // Update resolution status of this step
    step.resolved = backfillResult.resolved
    await supabaseClient
      .from('cascade_steps')
      .update({ resolved: backfillResult.resolved })
      .eq('cascade_id', cascadeId)
      .eq('step_number', currentDepth)

    // Determine final status
    const allResolved = steps.every(s => s.resolved)
    const noneResolved = steps.every(s => !s.resolved)

    let finalStatus: 'RESOLVED' | 'PARTIAL' | 'FAILED' | 'MAX_DEPTH'
    if (backfillResult.finalStatus === 'MAX_DEPTH') {
      finalStatus = 'MAX_DEPTH'
    } else if (allResolved) {
      finalStatus = 'RESOLVED'
    } else if (noneResolved) {
      finalStatus = 'FAILED'
    } else {
      finalStatus = 'PARTIAL'
    }

    return {
      cascadeId,
      rootVacancySlotId: slotId,
      steps,
      resolved: allResolved,
      resolutionDepth: Math.max(currentDepth, backfillResult.resolutionDepth),
      finalStatus
    }
  }

  // No diversion - this cascade is resolved
  await supabaseClient
    .from('coverage_cascades')
    .update({
      resolved: true,
      resolution_depth: currentDepth,
      final_status: 'RESOLVED'
    })
    .eq('id', cascadeId)

  return {
    cascadeId,
    rootVacancySlotId: slotId,
    steps,
    resolved: true,
    resolutionDepth: currentDepth,
    finalStatus: 'RESOLVED'
  }
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

    const { slot_id, max_depth } = await req.json()

    if (!slot_id) {
      return new Response(
        JSON.stringify({ error: 'slot_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get max depth from config or use provided value
    const { data: configData } = await supabaseClient
      .from('config')
      .select('value')
      .eq('key', 'max_cascade_depth')
      .single()

    const maxCascadeDepth = max_depth || parseInt(configData?.value || '5')

    // Resolve the cascade
    const result = await resolveCascade(supabaseClient, slot_id, null, 1, maxCascadeDepth)

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
