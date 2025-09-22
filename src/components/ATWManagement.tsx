// ATW = "Around The World" (third-shift weekly desk map). Do NOT rename or redefine.
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ATWJob {
  id: number
  label: string
  policy: {
    variant: 'third_shift_weekly_map'
    days: {
      Mon: string | null
      Tue: string | null
      Wed: string | null
      Thu: string | null
      Fri: string | null
      Sat: string | null
      Sun: string | null
    }
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Desk {
  desk_id: string
  desk_code: string
  desk_name: string
  is_active: boolean
}

export function ATWManagement() {
  const [atwJobs, setAtwJobs] = useState<ATWJob[]>([])
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedJob, setSelectedJob] = useState<ATWJob | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Form state
  const [label, setLabel] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [weeklyMap, setWeeklyMap] = useState<{[key: string]: string | null}>({
    Mon: null,
    Tue: null,
    Wed: null,
    Thu: null,
    Fri: null,
    Sat: null,
    Sun: null
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load ATW jobs
      const { data: atwData } = await supabase.functions.invoke('atw', {
        method: 'GET'
      })
      if (atwData) setAtwJobs(atwData)

      // Load desks
      const { data: deskData } = await supabase.functions.invoke('desks', {
        method: 'GET'
      })
      if (deskData) setDesks(deskData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load ATW data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setLabel("")
    setIsActive(true)
    setWeeklyMap({
      Mon: null,
      Tue: null,
      Wed: null,
      Thu: null,
      Fri: null,
      Sat: null,
      Sun: null
    })
    setSelectedJob(null)
  }

  const openEditDialog = (job: ATWJob) => {
    setSelectedJob(job)
    setLabel(job.label)
    setIsActive(job.is_active)
    setWeeklyMap(job.policy.days)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!label.trim()) {
      toast({
        title: "Validation Error",
        description: "Label is required",
        variant: "destructive"
      })
      return
    }

    try {
      const policy = {
        variant: 'third_shift_weekly_map' as const,
        days: weeklyMap
      }

      if (selectedJob) {
        // Update existing job
        const { data } = await supabase.functions.invoke('atw', {
          method: 'PATCH',
          body: { label, is_active: isActive, policy }
        })
        if (data) {
          setAtwJobs(prev => prev.map(job => job.id === selectedJob.id ? data : job))
          toast({
            title: "Success",
            description: "ATW job updated successfully"
          })
        }
      } else {
        // Create new job
        const { data } = await supabase.functions.invoke('atw', {
          method: 'POST',
          body: { label, is_active: isActive, policy }
        })
        if (data) {
          setAtwJobs(prev => [...prev, data])
          toast({
            title: "Success",
            description: "ATW job created successfully"
          })
        }
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving ATW job:', error)
      toast({
        title: "Error",
        description: "Failed to save ATW job",
        variant: "destructive"
      })
    }
  }

  const getDeskLabel = (deskId: string | null) => {
    if (!deskId) return "No Assignment"
    const desk = desks.find(d => d.desk_id === deskId)
    return desk ? `${desk.desk_code} - ${desk.desk_name}` : `Desk ${deskId}`
  }

  if (loading) {
    return <div className="p-6">Loading ATW jobs...</div>
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-franklin font-semibold">ATW Jobs</h2>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>ATW = "Around The World" - Third-shift relief positions with weekly desk rotation</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New ATW Job
          </Button>
        </div>

        <div className="grid gap-4">
          {atwJobs.map(job => (
            <Card key={job.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-franklin">{job.label}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.is_active ? "default" : "secondary"}>
                      {job.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(job)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    Always third shift • Weekly desk rotation map:
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-sm">
                    {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map(day => (
                      <div key={day} className="text-center">
                        <div className="font-medium text-xs text-muted-foreground mb-1">{day}</div>
                        <div className="text-xs p-1 rounded bg-surface-light">
                           {job.policy.days[day] ? (
                             <span className="text-foreground">
                               {desks.find(d => d.desk_id === job.policy.days[day])?.desk_code || `#${job.policy.days[day]}`}
                             </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {atwJobs.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No ATW jobs configured yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create an ATW job to set up third-shift relief coverage with weekly desk rotation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedJob ? 'Edit ATW Job' : 'Create ATW Job'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., Main ATW Relief"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Weekly Desk Rotation Map</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Always third shift • Select which desk to cover each day of the week
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map(day => (
                    <div key={day}>
                      <Label htmlFor={`desk-${day}`} className="text-sm font-medium">
                        {day === 'Mon' ? 'Monday' : 
                         day === 'Tue' ? 'Tuesday' :
                         day === 'Wed' ? 'Wednesday' :
                         day === 'Thu' ? 'Thursday' :
                         day === 'Fri' ? 'Friday' :
                         day === 'Sat' ? 'Saturday' : 'Sunday'}
                      </Label>
                       <Select
                         value={weeklyMap[day]?.toString() || ""}
                         onValueChange={(value) => {
                           setWeeklyMap(prev => ({
                             ...prev,
                             [day]: value === "none" ? null : value
                           }))
                         }}
                       >
                        <SelectTrigger>
                          <SelectValue placeholder="No assignment" />
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">No assignment</SelectItem>
                           {desks.filter(d => d.is_active).map(desk => (
                             <SelectItem key={desk.desk_id} value={desk.desk_id}>
                               {desk.desk_code} - {desk.desk_name}
                             </SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {selectedJob ? 'Update' : 'Create'} ATW Job
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}