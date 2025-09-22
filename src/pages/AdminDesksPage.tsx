import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Division {
  division_id: string
  code: string
  name: string
}

interface Desk {
  desk_id: string
  desk_code: string
  desk_name: string
  division_id: string
  is_active: boolean
  divisions?: Division
}

interface Shift {
  shift_id: number
  code: string
  starts_at: string
  ends_at: string
}

interface Trick {
  trick_id: string
  desk_id: string
  shift_id: number
  title: string
  desks?: { desk_code: string; desk_name: string }
  shifts?: Shift
}

export default function AdminDesksPage() {
  const [desks, setDesks] = useState<Desk[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null)
  const [tricks, setTricks] = useState<Trick[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewDeskDialogOpen, setIsNewDeskDialogOpen] = useState(false)
  const [isNewTrickDialogOpen, setIsNewTrickDialogOpen] = useState(false)
  const [editingTrick, setEditingTrick] = useState<Trick | null>(null)
  const { toast } = useToast()

  // Form states
  const [deskForm, setDeskForm] = useState({
    desk_code: "",
    desk_name: "",
    division_id: "",
    is_active: true
  })

  const [trickForm, setTrickForm] = useState({
    title: "",
    shift_id: "",
    desk_id: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedDesk) {
      loadTricks(selectedDesk.desk_id)
    }
  }, [selectedDesk])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load divisions
      const { data: divisionsData } = await supabase.functions.invoke('divisions', { method: 'GET' })
      if (divisionsData) setDivisions(divisionsData)

      // Load shifts
      const { data: shiftsData } = await supabase.functions.invoke('shifts', { method: 'GET' })
      if (shiftsData) setShifts(shiftsData)
      
      // Load desks
      const { data: desksData } = await supabase.functions.invoke('desks', { method: 'GET' })
      if (desksData) {
        setDesks(desksData)
        if (desksData.length > 0 && !selectedDesk) {
          setSelectedDesk(desksData[0])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load desk data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTricks = async (deskId: string) => {
    try {
      const { data } = await supabase.functions.invoke('desks', {
        method: 'GET'
      })
      // Find tricks for this desk from the data
      const { data: tricksData } = await supabase.functions.invoke('tricks', {
        method: 'GET',
        body: { desk_id: deskId }
      })
      if (tricksData) setTricks(tricksData)
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
        setDeskForm({ desk_code: "", desk_name: "", division_id: "", is_active: true })
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
        body: { ...deskForm, desk_id: selectedDesk.desk_id }
      })
      if (data) {
        setDesks(prev => prev.map(d => d.desk_id === selectedDesk.desk_id ? data : d))
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
        body: { ...trickForm, desk_id: selectedDesk.desk_id }
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
        body: { ...trickForm, trick_id: editingTrick.trick_id }
      })
      if (data) {
        setTricks(prev => prev.map(t => t.trick_id === editingTrick.trick_id ? data : t))
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

  const resetTrickForm = () => {
    setTrickForm({
      title: "",
      shift_id: "",
      desk_id: ""
    })
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
                    <Label htmlFor="desk-code">DESK CODE</Label>
                    <Input
                      id="desk-code"
                      value={deskForm.desk_code}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, desk_code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="desk-name">DESK NAME</Label>
                    <Input
                      id="desk-name"
                      value={deskForm.desk_name}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, desk_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="division">DIVISION</Label>
                    <Select value={deskForm.division_id} onValueChange={(value) => setDeskForm(prev => ({ ...prev, division_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map(division => (
                          <SelectItem key={division.division_id} value={division.division_id}>
                            {division.code} - {division.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <Label htmlFor="desk-code">DESK CODE</Label>
                        <Input
                          id="desk-code"
                          value={deskForm.desk_code}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, desk_code: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="desk-name">DESK NAME</Label>
                        <Input
                          id="desk-name"
                          value={deskForm.desk_name}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, desk_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="division">DIVISION</Label>
                        <Select value={deskForm.division_id} onValueChange={(value) => setDeskForm(prev => ({ ...prev, division_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.map(division => (
                              <SelectItem key={division.division_id} value={division.division_id}>
                                {division.code} - {division.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  key={desk.desk_id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDesk?.desk_id === desk.desk_id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-light hover:bg-surface'
                  }`}
                  onClick={() => setSelectedDesk(desk)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{desk.desk_code}</div>
                      <div className="text-sm opacity-80">{desk.desk_name}</div>
                      <div className="text-xs opacity-60">{desk.divisions?.name}</div>
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
                  {selectedDesk.desk_code} - {selectedDesk.desk_name}
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
                        <Label htmlFor="edit-desk-code">DESK CODE</Label>
                        <Input
                          id="edit-desk-code"
                          value={deskForm.desk_code || selectedDesk.desk_code}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, desk_code: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-desk-name">DESK NAME</Label>
                        <Input
                          id="edit-desk-name"
                          value={deskForm.desk_name || selectedDesk.desk_name}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, desk_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-division">DIVISION</Label>
                        <Select 
                          value={deskForm.division_id || selectedDesk.division_id} 
                          onValueChange={(value) => setDeskForm(prev => ({ ...prev, division_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.map(division => (
                              <SelectItem key={division.division_id} value={division.division_id}>
                                {division.code} - {division.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                                <Label htmlFor="trick-title">TITLE</Label>
                                <Input
                                  id="trick-title"
                                  value={trickForm.title}
                                  onChange={(e) => setTrickForm(prev => ({ ...prev, title: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="shift">SHIFT</Label>
                                <Select value={trickForm.shift_id} onValueChange={(value) => setTrickForm(prev => ({ ...prev, shift_id: value }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select shift" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {shifts.map(shift => (
                                      <SelectItem key={shift.shift_id} value={shift.shift_id.toString()}>
                                        {shift.code} ({shift.starts_at} - {shift.ends_at})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={createTrick}>CREATE TRICK</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>TITLE</TableHead>
                            <TableHead>SHIFT</TableHead>
                            <TableHead>TIMES</TableHead>
                            <TableHead>ACTIONS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tricks.map(trick => (
                            <TableRow key={trick.trick_id}>
                              <TableCell className="font-medium">{trick.title}</TableCell>
                              <TableCell>{trick.shifts?.code}</TableCell>
                              <TableCell>{trick.shifts?.starts_at} - {trick.shifts?.ends_at}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTrick(trick)
                                    setTrickForm({
                                      title: trick.title,
                                      shift_id: trick.shift_id.toString(),
                                      desk_id: trick.desk_id
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
                              <Label htmlFor="edit-trick-title">TITLE</Label>
                              <Input
                                id="edit-trick-title"
                                value={trickForm.title}
                                onChange={(e) => setTrickForm(prev => ({ ...prev, title: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-shift">SHIFT</Label>
                              <Select value={trickForm.shift_id} onValueChange={(value) => setTrickForm(prev => ({ ...prev, shift_id: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {shifts.map(shift => (
                                    <SelectItem key={shift.shift_id} value={shift.shift_id.toString()}>
                                      {shift.code} ({shift.starts_at} - {shift.ends_at})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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