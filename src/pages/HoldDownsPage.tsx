import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Clock, Calendar, User, AlertTriangle, Plus } from "lucide-react"
import { format, parseISO, addDays } from "date-fns"

interface HoldDown {
  id: number
  desk_id: number
  trick_id: number
  vacancy_reason: string
  starts_at: string
  projected_end: string
  actual_end?: string
  awarded_to?: number
  rule_blob?: any
  created_at: string
}

interface Desk {
  id: number
  code: string
  name: string
  territory: string
}

interface Trick {
  id: number
  desk_id: number
  name: string
  shift_start: string
  shift_end: string
}

interface Dispatcher {
  id: number
  badge: string
  first_name: string
  last_name: string
  rank: string
}

export function HoldDownsPage() {
  const [holdDowns, setHoldDowns] = useState<HoldDown[]>([])
  const [desks, setDesks] = useState<Desk[]>([])
  const [tricks, setTricks] = useState<Trick[]>([])
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedHoldDown, setSelectedHoldDown] = useState<HoldDown | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    desk_id: '',
    trick_id: '',
    vacancy_reason: 'VAC',
    starts_at: format(new Date(), 'yyyy-MM-dd'),
    projected_end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    awarded_to: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [holdDownsRes, desksRes, dispatchersRes] = await Promise.all([
        supabase.from('hold_downs').select('*').order('created_at', { ascending: false }),
        supabase.functions.invoke('desks'),
        supabase.functions.invoke('dispatchers', { body: { q: '' } })
      ])

      if (holdDownsRes.error) throw holdDownsRes.error
      if (desksRes.error) throw desksRes.error
      if (dispatchersRes.error) throw dispatchersRes.error

      setHoldDowns(holdDownsRes.data || [])
      setDesks(desksRes.data || [])
      setDispatchers(dispatchersRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load hold-downs data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTricksForDesk = async (deskId: number) => {
    try {
      const { data, error } = await supabase
        .from('tricks')
        .select('*')
        .eq('desk_id', deskId)
        .eq('is_active', true)

      if (error) throw error
      setTricks(data || [])
    } catch (error) {
      console.error('Error fetching tricks:', error)
    }
  }

  const handleDeskChange = (deskId: string) => {
    setFormData({ ...formData, desk_id: deskId, trick_id: '' })
    if (deskId) {
      fetchTricksForDesk(parseInt(deskId))
    } else {
      setTricks([])
    }
  }

  const handleCreateHoldDown = async () => {
    try {
      const { data, error } = await supabase
        .from('hold_downs')
        .insert({
          desk_id: parseInt(formData.desk_id),
          trick_id: parseInt(formData.trick_id),
          vacancy_reason: formData.vacancy_reason as any,
          starts_at: formData.starts_at + 'T00:00:00Z',
          projected_end: formData.projected_end + 'T23:59:59Z',
          awarded_to: formData.awarded_to ? parseInt(formData.awarded_to) : null
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Hold-down created successfully",
      })

      setShowCreateForm(false)
      setFormData({
        desk_id: '',
        trick_id: '',
        vacancy_reason: 'VAC',
        starts_at: format(new Date(), 'yyyy-MM-dd'),
        projected_end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        awarded_to: ''
      })
      await fetchData()
    } catch (error: any) {
      console.error('Error creating hold-down:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create hold-down",
        variant: "destructive",
      })
    }
  }

  const handleEndHoldDown = async (holdDownId: number) => {
    try {
      const { error } = await supabase
        .from('hold_downs')
        .update({ actual_end: new Date().toISOString() })
        .eq('id', holdDownId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Hold-down ended successfully",
      })

      await fetchData()
      setSelectedHoldDown(null)
    } catch (error: any) {
      console.error('Error ending hold-down:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to end hold-down",
        variant: "destructive",
      })
    }
  }

  const getHoldDownStatus = (holdDown: HoldDown) => {
    const now = new Date()
    const projectedEnd = new Date(holdDown.projected_end)
    
    if (holdDown.actual_end) {
      return { status: 'completed', label: 'Completed', variant: 'secondary' as const }
    } else if (projectedEnd < now) {
      return { status: 'overdue', label: 'Overdue', variant: 'destructive' as const }
    } else {
      return { status: 'active', label: 'Active', variant: 'default' as const }
    }
  }

  const getDeskName = (deskId: number) => {
    const desk = desks.find(d => d.id === deskId)
    return desk ? `${desk.code} - ${desk.name}` : 'Unknown'
  }

  const getTrickName = (trickId: number) => {
    const trick = tricks.find(t => t.id === trickId)
    return trick?.name || 'Unknown'
  }

  const getDispatcherName = (dispatcherId: number) => {
    const dispatcher = dispatchers.find(d => d.id === dispatcherId)
    return dispatcher ? `${dispatcher.first_name} ${dispatcher.last_name}` : 'Unassigned'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hold-downs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hold-Downs</h1>
          <p className="text-muted-foreground">
            Temporary assignments to cover extended vacancies
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Hold-Down
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Hold-Down</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="desk">Desk</Label>
                <Select value={formData.desk_id} onValueChange={handleDeskChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select desk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {desks.map((desk) => (
                      <SelectItem key={desk.id} value={desk.id.toString()}>
                        {desk.code} - {desk.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trick">Trick</Label>
                <Select 
                  value={formData.trick_id} 
                  onValueChange={(value) => setFormData({ ...formData, trick_id: value })}
                  disabled={!formData.desk_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trick..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tricks.map((trick) => (
                      <SelectItem key={trick.id} value={trick.id.toString()}>
                        {trick.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reason">Vacancy Reason</Label>
                <Select 
                  value={formData.vacancy_reason} 
                  onValueChange={(value) => setFormData({ ...formData, vacancy_reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VAC">Vacation</SelectItem>
                    <SelectItem value="FMLA">FMLA</SelectItem>
                    <SelectItem value="TRAINING">Training</SelectItem>
                    <SelectItem value="OOS">Out of Service</SelectItem>
                    <SelectItem value="UNKNOWN">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="starts">Start Date</Label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ends">Projected End</Label>
                <Input
                  type="date"
                  value={formData.projected_end}
                  onChange={(e) => setFormData({ ...formData, projected_end: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="awarded">Awarded To (Optional)</Label>
              <Select 
                value={formData.awarded_to} 
                onValueChange={(value) => setFormData({ ...formData, awarded_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dispatcher..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {dispatchers.map((dispatcher) => (
                    <SelectItem key={dispatcher.id} value={dispatcher.id.toString()}>
                      {dispatcher.first_name} {dispatcher.last_name} ({dispatcher.badge})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateHoldDown} disabled={!formData.desk_id || !formData.trick_id}>
                Create Hold-Down
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hold-Downs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Hold-Downs</h2>
          {holdDowns.filter(hd => !hd.actual_end).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active hold-downs</p>
              </CardContent>
            </Card>
          ) : (
            holdDowns.filter(hd => !hd.actual_end).map((holdDown) => {
              const status = getHoldDownStatus(holdDown)
              return (
                <Card
                  key={holdDown.id}
                  className={`cursor-pointer transition-colors ${
                    selectedHoldDown?.id === holdDown.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedHoldDown(holdDown)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{getDeskName(holdDown.desk_id)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getTrickName(holdDown.trick_id)}
                        </p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reason:</span>
                        <span>{holdDown.vacancy_reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span>{format(parseISO(holdDown.starts_at), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Projected End:</span>
                        <span>{format(parseISO(holdDown.projected_end), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Awarded To:</span>
                        <span>{holdDown.awarded_to ? getDispatcherName(holdDown.awarded_to) : 'Unassigned'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <div className="space-y-4">
          {selectedHoldDown ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Hold-Down Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Desk:</span>
                      <p className="font-medium">{getDeskName(selectedHoldDown.desk_id)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Trick:</span>
                      <p className="font-medium">{getTrickName(selectedHoldDown.trick_id)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Reason:</span>
                      <p className="font-medium">{selectedHoldDown.vacancy_reason}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Status:</span>
                      <Badge variant={getHoldDownStatus(selectedHoldDown).variant}>
                        {getHoldDownStatus(selectedHoldDown).label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Start Date:</span>
                      <p className="font-medium">
                        {format(parseISO(selectedHoldDown.starts_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Projected End:</span>
                      <p className="font-medium">
                        {format(parseISO(selectedHoldDown.projected_end), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-sm">Awarded To:</span>
                    <p className="font-medium">
                      {selectedHoldDown.awarded_to ? getDispatcherName(selectedHoldDown.awarded_to) : 'Unassigned'}
                    </p>
                  </div>

                  {!selectedHoldDown.actual_end && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleEndHoldDown(selectedHoldDown.id)}
                      className="w-full"
                    >
                      End Hold-Down
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a hold-down to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Completed Hold-Downs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Completed</CardTitle>
            </CardHeader>
            <CardContent>
              {holdDowns.filter(hd => hd.actual_end).slice(0, 5).length === 0 ? (
                <p className="text-muted-foreground text-sm">No completed hold-downs</p>
              ) : (
                <div className="space-y-2">
                  {holdDowns.filter(hd => hd.actual_end).slice(0, 5).map((holdDown) => (
                    <div key={holdDown.id} className="p-2 bg-muted rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {getDeskName(holdDown.desk_id)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(holdDown.actual_end!), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {holdDown.vacancy_reason} • {getTrickName(holdDown.trick_id)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}