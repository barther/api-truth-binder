import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, startOfWeek, addDays } from "date-fns"
import { AssignmentDialog } from "./AssignmentDialog"

interface Desk {
  id: number
  code: string
  name: string
  territory: string
  is_active: boolean
}

interface Trick {
  id: number
  desk_id: number
  name: string
  shift_start: string
  shift_end: string
  timezone: string
}

interface Dispatcher {
  id: number
  badge: string
  first_name: string
  last_name: string
  rank: string
}

interface Assignment {
  id: number
  dispatcher_id: number
  source: string
  requires_trainer: boolean
  dispatchers: Dispatcher
}

interface TrickInstance {
  id: number
  trick_id: number
  starts_at: string
  ends_at: string
  is_holiday: boolean
  tricks: Trick
  assignments: Assignment[]
}

export function DeskBoard() {
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null)
  const [schedule, setSchedule] = useState<TrickInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInstance, setSelectedInstance] = useState<TrickInstance | null>(null)
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const { toast } = useToast()

  // Get current week range
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
  const startDate = format(weekStart, 'yyyy-MM-dd')
  const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  // Generate week days for headers
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i)
    return {
      date: format(day, 'yyyy-MM-dd'),
      label: format(day, 'EEE MMM d'),
      isToday: format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    }
  })

  useEffect(() => {
    fetchDesks()
  }, [])

  useEffect(() => {
    if (selectedDesk) {
      fetchSchedule(selectedDesk.id)
    }
  }, [selectedDesk, startDate, endDate])

  const fetchDesks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('desks')
      if (error) throw error
      
      setDesks(data || [])
      if (data && data.length > 0) {
        setSelectedDesk(data[0])
      }
    } catch (error) {
      console.error('Error fetching desks:', error)
      toast({
        title: "Error",
        description: "Failed to load desks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedule = async (deskId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('desks', {
        body: null,
        method: 'GET'
      })
      
      if (error) throw error

      // Fetch schedule for the specific desk
      const { data: scheduleData, error: scheduleError } = await supabase.functions.invoke('desks', {
        body: { deskId, start: startDate, end: endDate }
      })
      
      if (scheduleError) throw scheduleError

      setSchedule(scheduleData || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive",
      })
    }
  }

  const handleCellClick = (instance: TrickInstance) => {
    setSelectedInstance(instance)
    setShowAssignmentDialog(true)
  }

  const handleAssignmentComplete = () => {
    setShowAssignmentDialog(false)
    setSelectedInstance(null)
    if (selectedDesk) {
      fetchSchedule(selectedDesk.id)
    }
  }

  const getAssignmentStatus = (instance: TrickInstance) => {
    if (!instance.assignments || instance.assignments.length === 0) {
      return { type: 'vacancy', label: 'VACANT', chip: 'vacancy' }
    }
    
    const assignment = instance.assignments[0]
    if (assignment.requires_trainer) {
      return { type: 'trainee', label: 'TRAINEE', chip: 'trainee' }
    }
    
    if (assignment.source === 'HOLD_DOWN') {
      return { type: 'hold-down', label: 'HOLD-DOWN', chip: 'hold-down' }
    }
    
    return { type: 'assigned', label: 'ASSIGNED', chip: 'assigned' }
  }

  const renderScheduleGrid = () => {
    if (!selectedDesk || !schedule.length) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {loading ? "Loading schedule..." : "No schedule data available"}
        </div>
      )
    }

    // Group trick instances by trick and day
    const groupedSchedule: { [key: string]: { [key: string]: TrickInstance } } = {}
    
    schedule.forEach(instance => {
      const trickName = instance.tricks.name
      const date = format(parseISO(instance.starts_at), 'yyyy-MM-dd')
      
      if (!groupedSchedule[trickName]) {
        groupedSchedule[trickName] = {}
      }
      groupedSchedule[trickName][date] = instance
    })

    const trickNames = Object.keys(groupedSchedule).sort()

    return (
      <div className="schedule-grid">
        {/* Header row */}
        <div className="schedule-header">Trick</div>
        {weekDays.map(day => (
          <div 
            key={day.date} 
            className={`schedule-header ${day.isToday ? 'bg-accent text-accent-foreground' : ''}`}
          >
            {day.label}
          </div>
        ))}

        {/* Schedule rows */}
        {trickNames.map(trickName => (
          <div key={trickName} className="contents">
            <div className="schedule-header bg-surface text-foreground">
              <div className="font-medium">{trickName}</div>
              <div className="text-xs text-muted-foreground">
                {groupedSchedule[trickName][weekDays[0]?.date]?.tricks.shift_start} - 
                {groupedSchedule[trickName][weekDays[0]?.date]?.tricks.shift_end}
              </div>
            </div>
            
            {weekDays.map(day => {
              const instance = groupedSchedule[trickName][day.date]
              if (!instance) {
                return <div key={day.date} className="schedule-cell bg-muted" />
              }

              const status = getAssignmentStatus(instance)
              const assignment = instance.assignments?.[0]

              return (
                <div 
                  key={`${trickName}-${day.date}`}
                  className="schedule-cell bg-card cursor-pointer hover:bg-card/80"
                  onClick={() => handleCellClick(instance)}
                >
                  {assignment ? (
                    <div className={`assignment-chip ${status.chip}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {assignment.dispatchers.badge}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-xs opacity-90">
                        {assignment.dispatchers.first_name} {assignment.dispatchers.last_name}
                      </div>
                    </div>
                  ) : (
                    <div className={`assignment-chip ${status.chip} text-center`}>
                      <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                      <div className="text-xs font-medium">{status.label}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dispatch schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Desk Board</h1>
          <p className="text-muted-foreground">
            Railroad dispatcher scheduling for week of {format(weekStart, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {startDate} to {endDate}
          </span>
        </div>
      </div>

      <Tabs value={selectedDesk?.code || ""} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          {desks.map((desk) => (
            <TabsTrigger
              key={desk.id}
              value={desk.code}
              onClick={() => setSelectedDesk(desk)}
              className="flex items-center space-x-2"
            >
              <Badge variant="outline">{desk.code}</Badge>
              <span>{desk.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {desks.map((desk) => (
          <TabsContent key={desk.id} value={desk.code} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{desk.name} Schedule</span>
                  <Badge variant="secondary">{desk.territory}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderScheduleGrid()}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {showAssignmentDialog && selectedInstance && (
        <AssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          trickInstance={selectedInstance}
          onComplete={handleAssignmentComplete}
        />
      )}
    </div>
  )
}