// ATW = "Around The World" (third-shift weekly desk map). Do NOT rename or redefine.
import React, { useState, useEffect } from "react"
import { Plus, Edit, Eye, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface Desk {
  id: number
  code: string
  name: string
  territory?: string
  is_active: boolean
}

interface ATWJob {
  id: number
  label: string
  policy: {
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
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PlanRow {
  date: string
  desk_id: number
  trick_instance_id: number
  starts_at: string
  ends_at: string
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export default function ATWPage() {
  const [atwJobs, setAtwJobs] = useState<ATWJob[]>([])
  const [desks, setDesks] = useState<Desk[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [editingJob, setEditingJob] = useState<ATWJob | null>(null)
  const [planData, setPlanData] = useState<PlanRow[]>([])
  const [planLoading, setPlanLoading] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    is_active: true,
    policy: {
      variant: 'third_shift_weekly_map' as const,
      days: {
        Mon: null as number | null,
        Tue: null as number | null,
        Wed: null as number | null,
        Thu: null as number | null,
        Fri: null as number | null,
        Sat: null as number | null,
        Sun: null as number | null,
      }
    }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch ATW jobs
      const { data: atwData, error: atwError } = await supabase.functions.invoke('atw')
      if (atwError) throw atwError

      // Fetch desks
      const { data: deskData, error: deskError } = await supabase.functions.invoke('desks')
      if (deskError) throw deskError

      setAtwJobs(atwData || [])
      setDesks(deskData?.filter((d: Desk) => d.is_active) || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load ATW jobs and desks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingJob(null)
    setFormData({
      label: '',
      is_active: true,
      policy: {
        variant: 'third_shift_weekly_map',
        days: {
          Mon: null,
          Tue: null,
          Wed: null,
          Thu: null,
          Fri: null,
          Sat: null,
          Sun: null,
        }
      }
    })
    setShowEditDialog(true)
  }

  const handleEdit = (job: ATWJob) => {
    setEditingJob(job)
    setFormData({
      label: job.label,
      is_active: job.is_active,
      policy: { ...job.policy }
    })
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    try {
      if (editingJob) {
        // Update existing job
        const { data, error } = await supabase.functions.invoke('atw', {
          method: 'PATCH',
          body: formData
        })
        if (error) throw error
      } else {
        // Create new job
        const { data, error } = await supabase.functions.invoke('atw', {
          method: 'POST',
          body: formData
        })
        if (error) throw error
      }

      toast({
        title: "Success",
        description: `ATW job ${editingJob ? 'updated' : 'created'} successfully`,
      })

      setShowEditDialog(false)
      fetchData()
    } catch (error) {
      console.error('Error saving ATW job:', error)
      toast({
        title: "Error",
        description: `Failed to ${editingJob ? 'update' : 'create'} ATW job`,
        variant: "destructive",
      })
    }
  }

  const handleViewPlan = async (job: ATWJob) => {
    setPlanLoading(true)
    setShowPlanDialog(true)
    
    try {
      // Get plan for next 2 weeks
      const start = new Date().toISOString().split('T')[0]
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { data, error } = await supabase.functions.invoke('atw', {
        method: 'GET',
        body: { path: `/${job.id}/plan?start=${start}&end=${end}` }
      })
      
      if (error) throw error
      setPlanData(data?.plan || [])
    } catch (error) {
      console.error('Error fetching plan:', error)
      toast({
        title: "Error",
        description: "Failed to load ATW plan",
        variant: "destructive",
      })
      setPlanData([])
    } finally {
      setPlanLoading(false)
    }
  }

  const getDeskName = (deskId: number | null) => {
    if (!deskId) return 'None'
    const desk = desks.find(d => d.id === deskId)
    return desk ? `${desk.code} - ${desk.name}` : `Desk ${deskId}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ATW Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Around The World - Third-shift relief positions with weekly desk rotation
          </p>
        </div>
        <Button onClick={handleCreateNew} className="btn-accent">
          <Plus className="h-4 w-4 mr-2" />
          New ATW Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ATW Job Management
            <Tooltip>
              <TooltipTrigger>
                <span className="text-sm text-muted-foreground">(Always third shift)</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>ATW jobs always target third-shift coverage only</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atwJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ATW jobs configured</p>
              <Button onClick={handleCreateNew} variant="outline" className="mt-4">
                Create First ATW Job
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weekly Map</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atwJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.label}</TableCell>
                    <TableCell>
                      <Badge variant={job.is_active ? "default" : "secondary"}>
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {WEEKDAYS.map(day => {
                          const deskId = job.policy.days[day]
                          return (
                            <div key={day} className="flex gap-2">
                              <span className="font-mono w-8">{day}:</span>
                              <span className={deskId ? "text-foreground" : "text-muted-foreground"}>
                                {getDeskName(deskId)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(job)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPlan(job)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? 'Edit ATW Job' : 'Create ATW Job'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="ATW Job Name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Label className="text-base font-semibold">Weekly Map</Label>
                <Badge variant="outline" className="text-xs">Always third shift</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {WEEKDAYS.map(day => (
                  <div key={day} className="flex items-center gap-2">
                    <Label className="font-mono w-12">{day}:</Label>
                    <Select
                      value={formData.policy.days[day]?.toString() || ""}
                      onValueChange={(value) => {
                        const deskId = value ? parseInt(value) : null
                        setFormData(prev => ({
                          ...prev,
                          policy: {
                            ...prev.policy,
                            days: {
                              ...prev.policy.days,
                              [day]: deskId
                            }
                          }
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {desks.map(desk => (
                          <SelectItem key={desk.id} value={desk.id.toString()}>
                            {desk.code} - {desk.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingJob ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ATW Plan Preview (Next 2 Weeks)</DialogTitle>
          </DialogHeader>
          
          {planLoading ? (
            <div className="py-8 text-center">Loading plan...</div>
          ) : planData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No scheduled coverage found for the next 2 weeks
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Desk</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planData.map((row, index) => {
                  const desk = desks.find(d => d.id === row.desk_id)
                  return (
                    <TableRow key={index}>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>{desk ? `${desk.code} - ${desk.name}` : `Desk ${row.desk_id}`}</TableCell>
                      <TableCell>{new Date(row.starts_at).toLocaleTimeString()}</TableCell>
                      <TableCell>{new Date(row.ends_at).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}