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

interface PlanEntry {
  date: string
  desk_id: number
  trick_instance_id: number
  starts_at: string
  ends_at: string
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
    console.log('ATW function called with path:', url.pathname, 'method:', req.method)

    if (req.method === 'GET') {
      if (pathParts[3] === 'plan' && pathParts[2]) {
        // GET /atw/:id/plan?start=YYYY-MM-DD&end=YYYY-MM-DD
        const atwJobId = parseInt(pathParts[2])
        const start = url.searchParams.get('start')
        const end = url.searchParams.get('end')

        if (!start || !end) {
          return new Response(
            JSON.stringify({ error: 'start and end query parameters are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get the ATW job policy
        const { data: atwJob, error: atwError } = await supabaseClient
          .from('atw_jobs')
          .select('*')
          .eq('id', atwJobId)
          .eq('is_active', true)
          .single()

        if (atwError || !atwJob) {
          return new Response(
            JSON.stringify({ error: 'ATW job not found or inactive' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const policy = atwJob.policy as ATWPolicy
        
        // Generate plan for date range
        const plan: PlanEntry[] = []
        const startDate = new Date(start + 'T00:00:00Z')
        const endDate = new Date(end + 'T23:59:59Z')
        
        for (let date = new Date(startDate); date <= endDate; date.setUTCDate(date.getUTCDate() + 1)) {
          const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const weekday = weekdays[date.getUTCDay()] as keyof ATWPolicy['days']
          const deskId = policy.days[weekday]
          
          if (deskId === null) continue // No work this day
          
          // Find third-shift trick for this desk
          const { data: tricks, error: tricksError } = await supabaseClient
            .from('tricks')
            .select('*')
            .eq('desk_id', deskId)
            .eq('is_active', true)
            .order('id')

          if (tricksError || !tricks?.length) continue

          // Find third-shift trick (overnight shift_end <= shift_start preferred, then name contains "3rd")
          let thirdShiftTrick = tricks.find(t => {
            // Parse time values
            const startTime = t.shift_start.split(':').map((n: string) => parseInt(n))
            const endTime = t.shift_end.split(':').map((n: string) => parseInt(n))
            const startMinutes = startTime[0] * 60 + startTime[1]
            const endMinutes = endTime[0] * 60 + endTime[1]
            return endMinutes <= startMinutes // Overnight shift
          })
          
          if (!thirdShiftTrick) {
            thirdShiftTrick = tricks.find(t => t.name.toLowerCase().includes('3rd'))
          }
          
          if (!thirdShiftTrick) continue

          // Find trick instance for this date
          const dateStr = date.toISOString().split('T')[0]
          const { data: instances, error: instancesError } = await supabaseClient
            .from('trick_instances')
            .select('*')
            .eq('trick_id', thirdShiftTrick.id)
            .gte('starts_at', dateStr + 'T00:00:00Z')
            .lte('starts_at', dateStr + 'T23:59:59Z')

          if (instancesError || !instances?.length) continue

          const instance = instances[0]
          plan.push({
            date: dateStr,
            desk_id: deskId,
            trick_instance_id: instance.id,
            starts_at: instance.starts_at,
            ends_at: instance.ends_at
          })
        }

        return new Response(JSON.stringify({ plan }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        // GET /atw - list all ATW jobs
        const { data: jobs, error } = await supabaseClient
          .from('atw_jobs')
          .select('*')
          .order('label')

        if (error) throw error

        return new Response(JSON.stringify(jobs), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (req.method === 'POST') {
      // POST /atw - create new ATW job
      const body = await req.json()
      const { label, is_active = true, policy } = body

      if (!label || !policy) {
        return new Response(
          JSON.stringify({ error: 'label and policy are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate policy structure
      if (policy.variant !== 'third_shift_weekly_map' || !policy.days) {
        return new Response(
          JSON.stringify({ error: 'Invalid policy structure' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: job, error } = await supabaseClient
        .from('atw_jobs')
        .insert({ label, is_active, policy })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(job), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (req.method === 'PATCH') {
      // PATCH /atw/:id - update ATW job
      const atwJobId = parseInt(pathParts[2])
      const body = await req.json()
      const { label, is_active, policy } = body

      const updates: any = {}
      if (label !== undefined) updates.label = label
      if (is_active !== undefined) updates.is_active = is_active
      if (policy !== undefined) {
        // Validate policy structure if provided
        if (policy.variant !== 'third_shift_weekly_map' || !policy.days) {
          return new Response(
            JSON.stringify({ error: 'Invalid policy structure' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        updates.policy = policy
      }

      const { data: job, error } = await supabaseClient
        .from('atw_jobs')
        .update(updates)
        .eq('id', atwJobId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(job), {
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