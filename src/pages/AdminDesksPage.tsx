import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Desk {
  id: number
  code: string
  name: string
  territory: string | null
  is_active: boolean
}

interface Trick {
  id: number
  desk_id: number
  name: string
  shift_start: string
  shift_end: string
  days_mask: string
  timezone: string
  is_active: boolean
}

export default function AdminDesksPage() {
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null)
  const [tricks, setTricks] = useState<Trick[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewDeskDialogOpen, setIsNewDeskDialogOpen] = useState(false)
  const [isNewTrickDialogOpen, setIsNewTrickDialogOpen] = useState(false)
  const [editingTrick, setEditingTrick] = useState<Trick | null>(null)
  const { toast } = useToast()

  // Form states
  const [deskForm, setDeskForm] = useState({
    code: "",
    name: "",
    territory: "",
    is_active: true
  })

  const [trickForm, setTrickForm] = useState({
    name: "",
    shift_start: "",
    shift_end: "",
    days_mask: "1111100", // Mon-Fri default
    timezone: "America/New_York",
    is_active: true
  })

  useEffect(() => {
    loadDesks()
  }, [])

  useEffect(() => {
    if (selectedDesk) {
      loadTricks(selectedDesk.id)
    }
  }, [selectedDesk])

  const loadDesks = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.functions.invoke('desks', { method: 'GET' })
      if (data) {
        setDesks(data)
        if (data.length > 0 && !selectedDesk) {
          setSelectedDesk(data[0])
        }
      }
    } catch (error) {
      console.error('Error loading desks:', error)
      toast({
        title: "Error",
        description: "Failed to load desks",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTricks = async (deskId: number) => {
    try {
      const { data } = await supabase.functions.invoke('desks', {
        method: 'GET',
        body: { action: 'get_tricks', desk_id: deskId }
      })
      if (data) setTricks(data)
    } catch (error) {
      console.error('Error loading tricks:', error)
      toast({
        title: "Error",
        description: "Failed to load tricks",
        variant: "destructive"
      })
    }
  }

  const createDesk = async () => {
    try {
      const { data } = await supabase.functions.invoke('desks', {
        method: 'POST',
        body: deskForm
      })
      if (data) {
        setDesks(prev => [...prev, data])
        setSelectedDesk(data)
        setIsNewDeskDialogOpen(false)
        setDeskForm({ code: "", name: "", territory: "", is_active: true })
        toast({ title: "Success", description: "Desk created successfully" })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create desk",
        variant: "destructive"
      })
    }
  }

  const updateDesk = async () => {
    if (!selectedDesk) return
    try {
      const { data } = await supabase.functions.invoke('desks', {
        method: 'PATCH',
        body: { ...deskForm, id: selectedDesk.id }
      })
      if (data) {
        setDesks(prev => prev.map(d => d.id === selectedDesk.id ? data : d))
        setSelectedDesk(data)
        toast({ title: "Success", description: "Desk updated successfully" })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update desk",
        variant: "destructive"
      })
    }
  }

  const createTrick = async () => {
    if (!selectedDesk) return
    try {
      const { data } = await supabase.functions.invoke('tricks', {
        method: 'POST',
        body: { ...trickForm, desk_id: selectedDesk.id }
      })
      if (data) {
        setTricks(prev => [...prev, data])
        setIsNewTrickDialogOpen(false)
        resetTrickForm()
        toast({ title: "Success", description: "Trick created successfully" })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create trick",
        variant: "destructive"
      })
    }
  }

  const updateTrick = async () => {
    if (!editingTrick) return
    try {
      const { data } = await supabase.functions.invoke('tricks', {
        method: 'PATCH',
        body: { ...trickForm, id: editingTrick.id }
      })
      if (data) {
        setTricks(prev => prev.map(t => t.id === editingTrick.id ? data : t))
        setEditingTrick(null)
        resetTrickForm()
        toast({ title: "Success", description: "Trick updated successfully" })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update trick",
        variant: "destructive"
      })
    }
  }

  const regenerateCalendar = async () => {
    if (!selectedDesk) return
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1) // Tomorrow
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30) // Next 30 days

      const { data } = await supabase.functions.invoke('calendar', {
        method: 'POST',
        body: {
          action: 'build',
          desk_id: selectedDesk.id,
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      })
      toast({ title: "Success", description: "Calendar regenerated successfully" })
    } catch (error: any) {
      if (error.message?.includes('423') || error.message?.includes('FrozenHistory')) {
        toast({
          title: "Error",
          description: "Cannot modify past calendar entries",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to regenerate calendar",
          variant: "destructive"
        })
      }
    }
  }

  const resetTrickForm = () => {
    setTrickForm({
      name: "",
      shift_start: "",
      shift_end: "",
      days_mask: "1111100",
      timezone: "America/New_York",
      is_active: true
    })
  }

  const formatDaysMask = (mask: string) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.filter((_, i) => mask[i] === '1').join(', ')
  }

  const updateDaysMask = (dayIndex: number, checked: boolean) => {
    const maskArray = trickForm.days_mask.split('')
    maskArray[dayIndex] = checked ? '1' : '0'
    setTrickForm(prev => ({ ...prev, days_mask: maskArray.join('') }))
  }

  if (loading) {
    return <div className="p-6">Loading desks...</div>
  }

  if (desks.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-franklin font-semibold mb-4">NO DESKS CONFIGURED</h2>
            <p className="text-muted-foreground mb-6">Get started by creating your first desk</p>
            <Dialog open={isNewDeskDialogOpen} onOpenChange={setIsNewDeskDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  NEW DESK
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>CREATE NEW DESK</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="code">CODE</Label>
                    <Input
                      id="code"
                      value={deskForm.code}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">NAME</Label>
                    <Input
                      id="name"
                      value={deskForm.name}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="territory">TERRITORY</Label>
                    <Input
                      id="territory"
                      value={deskForm.territory}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, territory: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="active">ACTIVE</Label>
                    <Switch
                      id="active"
                      checked={deskForm.is_active}
                      onCheckedChange={(checked) => setDeskForm(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                  <Button onClick={createDesk}>CREATE DESK</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Desks List */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-franklin">DESKS</CardTitle>
                <Dialog open={isNewDeskDialogOpen} onOpenChange={setIsNewDeskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      NEW
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>CREATE NEW DESK</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="code">CODE</Label>
                        <Input
                          id="code"
                          value={deskForm.code}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, code: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">NAME</Label>
                        <Input
                          id="name"
                          value={deskForm.name}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="territory">TERRITORY</Label>
                        <Input
                          id="territory"
                          value={deskForm.territory}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, territory: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="active">ACTIVE</Label>
                        <Switch
                          id="active"
                          checked={deskForm.is_active}
                          onCheckedChange={(checked) => setDeskForm(prev => ({ ...prev, is_active: checked }))}
                        />
                      </div>
                      <Button onClick={createDesk}>CREATE DESK</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {desks.map(desk => (
                <div
                  key={desk.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDesk?.id === desk.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-light hover:bg-surface'
                  }`}
                  onClick={() => setSelectedDesk(desk)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{desk.code}</div>
                      <div className="text-sm opacity-80">{desk.name}</div>
                      {desk.territory && (
                        <div className="text-xs opacity-60">{desk.territory}</div>
                      )}
                    </div>
                    <Badge variant={desk.is_active ? "default" : "secondary"}>
                      {desk.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Desk Details */}
        <div className="col-span-8">
          {selectedDesk && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-franklin">
                  {selectedDesk.code} - {selectedDesk.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">DETAILS</TabsTrigger>
                    <TabsTrigger value="tricks">TRICKS</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="edit-code">CODE</Label>
                        <Input
                          id="edit-code"
                          value={deskForm.code || selectedDesk.code}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, code: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-name">NAME</Label>
                        <Input
                          id="edit-name"
                          value={deskForm.name || selectedDesk.name}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-territory">TERRITORY</Label>
                        <Input
                          id="edit-territory"
                          value={deskForm.territory || selectedDesk.territory || ""}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, territory: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="edit-active">ACTIVE</Label>
                        <Switch
                          id="edit-active"
                          checked={deskForm.is_active ?? selectedDesk.is_active}
                          onCheckedChange={(checked) => setDeskForm(prev => ({ ...prev, is_active: checked }))}
                        />
                      </div>
                      <Button onClick={updateDesk}>SAVE CHANGES</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="tricks" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">TRICKS</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={regenerateCalendar}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            REGENERATE CALENDAR
                          </Button>
                          <Dialog open={isNewTrickDialogOpen} onOpenChange={setIsNewTrickDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="flex items-center gap-1">
                                <Plus className="h-3 w-3" />
                                ADD TRICK
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>CREATE NEW TRICK</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4">
                                <div>
                                  <Label htmlFor="trick-name">NAME</Label>
                                  <Input
                                    id="trick-name"
                                    value={trickForm.name}
                                    onChange={(e) => setTrickForm(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="shift-start">START TIME</Label>
                                    <Input
                                      id="shift-start"
                                      type="time"
                                      value={trickForm.shift_start}
                                      onChange={(e) => setTrickForm(prev => ({ ...prev, shift_start: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="shift-end">END TIME</Label>
                                    <Input
                                      id="shift-end"
                                      type="time"
                                      value={trickForm.shift_end}
                                      onChange={(e) => setTrickForm(prev => ({ ...prev, shift_end: e.target.value }))}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>DAYS</Label>
                                  <div className="grid grid-cols-7 gap-1 mt-1">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                      <div key={day} className="flex items-center space-x-1">
                                        <Checkbox
                                          id={`day-${i}`}
                                          checked={trickForm.days_mask[i] === '1'}
                                          onCheckedChange={(checked) => updateDaysMask(i, !!checked)}
                                        />
                                        <Label htmlFor={`day-${i}`} className="text-xs">{day}</Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="timezone">TIMEZONE</Label>
                                  <Select value={trickForm.timezone} onValueChange={(value) => setTrickForm(prev => ({ ...prev, timezone: value }))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="America/New_York">Eastern</SelectItem>
                                      <SelectItem value="America/Chicago">Central</SelectItem>
                                      <SelectItem value="America/Denver">Mountain</SelectItem>
                                      <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor="trick-active">ACTIVE</Label>
                                  <Switch
                                    id="trick-active"
                                    checked={trickForm.is_active}
                                    onCheckedChange={(checked) => setTrickForm(prev => ({ ...prev, is_active: checked }))}
                                  />
                                </div>
                                <Button onClick={createTrick}>CREATE TRICK</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>NAME</TableHead>
                            <TableHead>START</TableHead>
                            <TableHead>END</TableHead>
                            <TableHead>DAYS</TableHead>
                            <TableHead>TIMEZONE</TableHead>
                            <TableHead>STATUS</TableHead>
                            <TableHead>ACTIONS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tricks.map(trick => (
                            <TableRow key={trick.id}>
                              <TableCell className="font-medium">{trick.name}</TableCell>
                              <TableCell>{trick.shift_start}</TableCell>
                              <TableCell>{trick.shift_end}</TableCell>
                              <TableCell>{formatDaysMask(trick.days_mask)}</TableCell>
                              <TableCell>{trick.timezone}</TableCell>
                              <TableCell>
                                <Badge variant={trick.is_active ? "default" : "secondary"}>
                                  {trick.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTrick(trick)
                                    setTrickForm({
                                      name: trick.name,
                                      shift_start: trick.shift_start,
                                      shift_end: trick.shift_end,
                                      days_mask: trick.days_mask,
                                      timezone: trick.timezone,
                                      is_active: trick.is_active
                                    })
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Edit Trick Dialog */}
                      <Dialog open={!!editingTrick} onOpenChange={() => setEditingTrick(null)}>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>EDIT TRICK</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4">
                            <div>
                              <Label htmlFor="edit-trick-name">NAME</Label>
                              <Input
                                id="edit-trick-name"
                                value={trickForm.name}
                                onChange={(e) => setTrickForm(prev => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="edit-shift-start">START TIME</Label>
                                <Input
                                  id="edit-shift-start"
                                  type="time"
                                  value={trickForm.shift_start}
                                  onChange={(e) => setTrickForm(prev => ({ ...prev, shift_start: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-shift-end">END TIME</Label>
                                <Input
                                  id="edit-shift-end"
                                  type="time"
                                  value={trickForm.shift_end}
                                  onChange={(e) => setTrickForm(prev => ({ ...prev, shift_end: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>DAYS</Label>
                              <div className="grid grid-cols-7 gap-1 mt-1">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                  <div key={day} className="flex items-center space-x-1">
                                    <Checkbox
                                      id={`edit-day-${i}`}
                                      checked={trickForm.days_mask[i] === '1'}
                                      onCheckedChange={(checked) => updateDaysMask(i, !!checked)}
                                    />
                                    <Label htmlFor={`edit-day-${i}`} className="text-xs">{day}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="edit-timezone">TIMEZONE</Label>
                              <Select value={trickForm.timezone} onValueChange={(value) => setTrickForm(prev => ({ ...prev, timezone: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="America/New_York">Eastern</SelectItem>
                                  <SelectItem value="America/Chicago">Central</SelectItem>
                                  <SelectItem value="America/Denver">Mountain</SelectItem>
                                  <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="edit-trick-active">ACTIVE</Label>
                              <Switch
                                id="edit-trick-active"
                                checked={trickForm.is_active}
                                onCheckedChange={(checked) => setTrickForm(prev => ({ ...prev, is_active: checked }))}
                              />
                            </div>
                            <Button onClick={updateTrick}>UPDATE TRICK</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}