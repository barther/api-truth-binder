// ATW = "Around The World" (third-shift weekly desk map). Do NOT rename or redefine.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ATWPolicy {
  variant: 'third_shift_weekly_map'
  days: {
    Mon: number | null
    Tue: number | null
    Wed: number | null
    Thu: number | null
    Fri: number | null
    Sat: number | null
    Sun: number | null
  }
}

interface PlanRow {
  date: string
  desk_id: number
  trick_instance_id: number
  starts_at: string
  ends_at: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

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
    const pathParts = url.pathname.split('/').filter(p => p)
    
    console.log('ATW function called:', req.method, url.pathname)

    if (req.method === 'GET') {
      if (pathParts.length === 1) {
        // GET /atw → list all ATW jobs
        const { data: atwJobs, error } = await supabaseClient
          .from('atw_jobs')
          .select('*')
          .order('label')

        if (error) {
          console.error('Error fetching ATW jobs:', error)
          throw error
        }

        return new Response(JSON.stringify(atwJobs), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } 
      
      if (pathParts.length === 3 && pathParts[2] === 'plan') {
        // GET /atw/:id/plan?start=YYYY-MM-DD&end=YYYY-MM-DD
        const atwJobId = parseInt(pathParts[1])
        const start = url.searchParams.get('start')
        const end = url.searchParams.get('end')

        if (!start || !end) {
          return new Response(
            JSON.stringify({ error: 'start and end query parameters are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get ATW job
        const { data: atwJob, error: atwError } = await supabaseClient
          .from('atw_jobs')
          .select('*')
          .eq('id', atwJobId)
          .eq('is_active', true)
          .single()

        if (atwError || !atwJob) {
          console.error('ATW job not found:', atwError)
          return new Response(
            JSON.stringify({ error: 'ATW job not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const policy = atwJob.policy as ATWPolicy
        const plan: PlanRow[] = []

        // Generate date range
        const startDate = new Date(start + 'T00:00:00Z')
        const endDate = new Date(end + 'T23:59:59Z')
        
        for (let date = new Date(startDate); date <= endDate; date.setUTCDate(date.getUTCDate() + 1)) {
          const weekday = WEEKDAYS[date.getUTCDay()] as keyof ATWPolicy['days']
          const deskId = policy.days[weekday]
          
          if (deskId === null) {
            continue // Skip days with no desk assignment
          }

          // Find third-shift trick for this desk
          const { data: tricks, error: tricksError } = await supabaseClient
            .from('tricks')
            .select('*')
            .eq('desk_id', deskId)
            .eq('is_active', true)

          if (tricksError || !tricks?.length) {
            console.warn(`No tricks found for desk ${deskId}`)
            continue
          }

          // Find third-shift trick using canonical resolution order
          let thirdShiftTrick = null
          
          // 1. Prefer overnight tricks (shift_end <= shift_start)
          const overnightTricks = tricks.filter(t => t.shift_end <= t.shift_start)
          if (overnightTricks.length > 0) {
            thirdShiftTrick = overnightTricks.sort((a, b) => a.id - b.id)[0]
          } else {
            // 2. Look for tricks with "3rd" in name (case-insensitive)
            const namedThirdShift = tricks.filter(t => t.name.toLowerCase().includes('3rd'))
            if (namedThirdShift.length > 0) {
              thirdShiftTrick = namedThirdShift.sort((a, b) => a.id - b.id)[0]
            } else {
              // 3. Fallback to lowest ID
              thirdShiftTrick = tricks.sort((a, b) => a.id - b.id)[0]
            }
          }

          if (!thirdShiftTrick) {
            console.warn(`No third-shift trick found for desk ${deskId}`)
            continue
          }

          // Find trick instances for this date
          const dateStr = date.toISOString().split('T')[0]
          const { data: instances, error: instancesError } = await supabaseClient
            .from('trick_instances')
            .select('*')
            .eq('trick_id', thirdShiftTrick.id)
            .gte('starts_at', dateStr + 'T00:00:00Z')
            .lt('starts_at', dateStr + 'T23:59:59Z')

          if (instancesError) {
            console.error('Error fetching trick instances:', instancesError)
            continue
          }

          // Add all instances for this date to the plan
          for (const instance of instances || []) {
            plan.push({
              date: dateStr,
              desk_id: deskId,
              trick_instance_id: instance.id,
              starts_at: instance.starts_at,
              ends_at: instance.ends_at
            })
          }
        }

        return new Response(JSON.stringify({ plan }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } 
    
    if (req.method === 'POST') {
      // POST /atw → create new ATW job
      const body = await req.json()
      const { label, is_active = true, policy } = body

      if (!label || !policy) {
        return new Response(
          JSON.stringify({ error: 'label and policy are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: atwJob, error } = await supabaseClient
        .from('atw_jobs')
        .insert({ label, is_active, policy })
        .select()
        .single()

      if (error) {
        console.error('Error creating ATW job:', error)
        throw error
      }

      return new Response(JSON.stringify(atwJob), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (req.method === 'PATCH') {
      // PATCH /atw/:id → update ATW job
      const atwJobId = parseInt(pathParts[1])
      const body = await req.json()
      const { label, is_active, policy } = body

      const updateData: any = {}
      if (label !== undefined) updateData.label = label
      if (is_active !== undefined) updateData.is_active = is_active
      if (policy !== undefined) updateData.policy = policy

      const { data: atwJob, error } = await supabaseClient
        .from('atw_jobs')
        .update(updateData)
        .eq('id', atwJobId)
        .select()
        .single()

      if (error) {
        console.error('Error updating ATW job:', error)
        throw error
      }

      return new Response(JSON.stringify(atwJob), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ATW function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})