import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Dispatcher {
  id: number
  first_name: string
  last_name: string
  badge: string
  rank: string | null
  is_active: boolean
}

interface Seniority {
  dispatcher_id: number
  rank: string
  tie_breaker: number
}

interface Qualification {
  id: number
  dispatcher_id: number
  desk_id: number
  qualified_on: string
  trainer_id: number | null
  notes: string | null
  is_active: boolean
  desks?: { code: string; name: string }
  trainers?: { first_name: string; last_name: string }
}

interface Desk {
  id: number
  code: string
  name: string
}

export default function AdminDispatchersPage() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [desks, setDesks] = useState<Desk[]>([])
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isNewDispatcherDialogOpen, setIsNewDispatcherDialogOpen] = useState(false)
  const [editingDispatcher, setEditingDispatcher] = useState<Dispatcher | null>(null)
  const [selectedDispatcherQuals, setSelectedDispatcherQuals] = useState<Qualification[]>([])
  const { toast } = useToast()

  // Form states
  const [dispatcherForm, setDispatcherForm] = useState({
    first_name: "",
    last_name: "",
    badge: "",
    rank: "",
    tie_breaker: 0,
    is_active: true
  })

  const [qualificationForm, setQualificationForm] = useState({
    desk_id: "",
    qualified_on: "",
    trainer_id: "",
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (editingDispatcher) {
      loadQualifications(editingDispatcher.id)
    }
  }, [editingDispatcher])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load dispatchers
      const { data: dispatchersData } = await supabase.functions.invoke('dispatchers', {
        method: 'GET',
        body: { q: searchQuery }
      })
      if (dispatchersData) setDispatchers(dispatchersData)

      // Load desks
      const { data: desksData } = await supabase.functions.invoke('desks', { method: 'GET' })
      if (desksData) setDesks(desksData)

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load dispatcher data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadQualifications = async (dispatcherId: number) => {
    try {
      const { data } = await supabase.functions.invoke('qualifications', {
        method: 'GET',
        body: { dispatcher_id: dispatcherId }
      })
      if (data) setSelectedDispatcherQuals(data)
    } catch (error) {
      console.error('Error loading qualifications:', error)
    }
  }

  const createDispatcher = async () => {
    try {
      // First create dispatcher
      const { data: dispatcher } = await supabase.functions.invoke('dispatchers', {
        method: 'POST',
        body: {
          first_name: dispatcherForm.first_name,
          last_name: dispatcherForm.last_name,
          badge: dispatcherForm.badge,
          is_active: dispatcherForm.is_active
        }
      })

      if (dispatcher) {
        // Then create seniority record
        await supabase.functions.invoke('seniority', {
          method: 'PUT',
          body: {
            dispatcher_id: dispatcher.id,
            rank: dispatcherForm.rank,
            tie_breaker: dispatcherForm.tie_breaker
          }
        })

        setDispatchers(prev => [...prev, { ...dispatcher, rank: dispatcherForm.rank }])
        setIsNewDispatcherDialogOpen(false)
        resetDispatcherForm()
        toast({ title: "Success", description: "Dispatcher created successfully" })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create dispatcher",
        variant: "destructive"
      })
    }
  }

  const updateDispatcher = async () => {
    if (!editingDispatcher) return
    try {
      const { data } = await supabase.functions.invoke('dispatchers', {
        method: 'PATCH',
        body: {
          id: editingDispatcher.id,
          first_name: dispatcherForm.first_name,
          last_name: dispatcherForm.last_name,
          badge: dispatcherForm.badge,
          is_active: dispatcherForm.is_active
        }
      })

      if (data) {
        // Update seniority
        await supabase.functions.invoke('seniority', {
          method: 'PUT',
          body: {
            dispatcher_id: editingDispatcher.id,
            rank: dispatcherForm.rank,
            tie_breaker: dispatcherForm.tie_breaker
          }
        })

        setDispatchers(prev => prev.map(d => 
          d.id === editingDispatcher.id 
            ? { ...data, rank: dispatcherForm.rank }
            : d
        ))
        toast({ title: "Success", description: "Dispatcher updated successfully" })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update dispatcher",
        variant: "destructive"
      })
    }
  }

  const addQualification = async () => {
    if (!editingDispatcher) return
    try {
      const { data } = await supabase.functions.invoke('qualifications', {
        method: 'POST',
        body: {
          dispatcher_id: editingDispatcher.id,
          desk_id: parseInt(qualificationForm.desk_id),
          qualified_on: qualificationForm.qualified_on,
          trainer_id: qualificationForm.trainer_id ? parseInt(qualificationForm.trainer_id) : null,
          notes: qualificationForm.notes || null
        }
      })

      if (data) {
        loadQualifications(editingDispatcher.id)
        setQualificationForm({ desk_id: "", qualified_on: "", trainer_id: "", notes: "" })
        toast({ title: "Success", description: "Qualification added successfully" })
      }
    } catch (error: any) {
      if (error.message?.includes('422') || error.message?.includes('duplicate')) {
        toast({
          title: "Validation Error",
          description: "Dispatcher already qualified for this desk",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add qualification",
          variant: "destructive"
        })
      }
    }
  }

  const removeQualification = async (qualId: number) => {
    try {
      await supabase.functions.invoke('qualifications', {
        method: 'DELETE',
        body: { id: qualId }
      })
      
      if (editingDispatcher) {
        loadQualifications(editingDispatcher.id)
      }
      toast({ title: "Success", description: "Qualification removed successfully" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove qualification",
        variant: "destructive"
      })
    }
  }

  const toggleDispatcherStatus = async (dispatcher: Dispatcher) => {
    try {
      const { data } = await supabase.functions.invoke('dispatchers', {
        method: 'PATCH',
        body: {
          id: dispatcher.id,
          is_active: !dispatcher.is_active
        }
      })

      if (data) {
        setDispatchers(prev => prev.map(d => 
          d.id === dispatcher.id ? { ...d, is_active: data.is_active } : d
        ))
        toast({ 
          title: "Success", 
          description: `Dispatcher ${data.is_active ? 'activated' : 'deactivated'}` 
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update dispatcher status",
        variant: "destructive"
      })
    }
  }

  const resetDispatcherForm = () => {
    setDispatcherForm({
      first_name: "",
      last_name: "",
      badge: "",
      rank: "",
      tie_breaker: 0,
      is_active: true
    })
  }

  const filteredDispatchers = dispatchers.filter(dispatcher =>
    dispatcher.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatcher.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatcher.badge.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Loading dispatchers...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-franklin font-bold">ADMIN → DISPATCHERS</h1>
          <Dialog open={isNewDispatcherDialogOpen} onOpenChange={setIsNewDispatcherDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                NEW DISPATCHER
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>CREATE NEW DISPATCHER</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="last-name">LAST NAME</Label>
                    <Input
                      id="last-name"
                      value={dispatcherForm.last_name}
                      onChange={(e) => setDispatcherForm(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="first-name">FIRST NAME</Label>
                    <Input
                      id="first-name"
                      value={dispatcherForm.first_name}
                      onChange={(e) => setDispatcherForm(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="badge">EMPLOYEE ID</Label>
                  <Input
                    id="badge"
                    value={dispatcherForm.badge}
                    onChange={(e) => setDispatcherForm(prev => ({ ...prev, badge: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="rank">RANK</Label>
                    <Input
                      id="rank"
                      value={dispatcherForm.rank}
                      onChange={(e) => setDispatcherForm(prev => ({ ...prev, rank: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tie-breaker">TIE BREAKER</Label>
                    <Input
                      id="tie-breaker"
                      type="number"
                      value={dispatcherForm.tie_breaker}
                      onChange={(e) => setDispatcherForm(prev => ({ ...prev, tie_breaker: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="active">ACTIVE</Label>
                  <Switch
                    id="active"
                    checked={dispatcherForm.is_active}
                    onCheckedChange={(checked) => setDispatcherForm(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
                <Button onClick={createDispatcher}>CREATE DISPATCHER</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dispatchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Dispatchers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-franklin">DISPATCHERS</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LAST NAME</TableHead>
                  <TableHead>FIRST NAME</TableHead>
                  <TableHead>EMPLOYEE ID</TableHead>
                  <TableHead>SENIORITY</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatchers.map(dispatcher => (
                  <TableRow key={dispatcher.id}>
                    <TableCell className="font-medium">{dispatcher.last_name}</TableCell>
                    <TableCell>{dispatcher.first_name}</TableCell>
                    <TableCell>{dispatcher.badge}</TableCell>
                    <TableCell>{dispatcher.rank || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={dispatcher.is_active ? "default" : "secondary"}>
                          {dispatcher.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Switch
                          checked={dispatcher.is_active}
                          onCheckedChange={() => toggleDispatcherStatus(dispatcher)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDispatcher(dispatcher)
                              setDispatcherForm({
                                first_name: dispatcher.first_name,
                                last_name: dispatcher.last_name,
                                badge: dispatcher.badge,
                                rank: dispatcher.rank || "",
                                tie_breaker: 0,
                                is_active: dispatcher.is_active
                              })
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            EDIT
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-w-4xl mx-auto">
                          <DrawerHeader>
                            <DrawerTitle className="font-franklin">
                              EDIT DISPATCHER: {dispatcher.last_name}, {dispatcher.first_name}
                            </DrawerTitle>
                          </DrawerHeader>
                          <div className="p-6">
                            <Tabs defaultValue="details">
                              <TabsList>
                                <TabsTrigger value="details">DETAILS</TabsTrigger>
                                <TabsTrigger value="qualifications">QUALIFICATIONS</TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="mt-4">
                                <div className="grid gap-4 max-w-md">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor="edit-last-name">LAST NAME</Label>
                                      <Input
                                        id="edit-last-name"
                                        value={dispatcherForm.last_name}
                                        onChange={(e) => setDispatcherForm(prev => ({ ...prev, last_name: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-first-name">FIRST NAME</Label>
                                      <Input
                                        id="edit-first-name"
                                        value={dispatcherForm.first_name}
                                        onChange={(e) => setDispatcherForm(prev => ({ ...prev, first_name: e.target.value }))}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-badge">EMPLOYEE ID</Label>
                                    <Input
                                      id="edit-badge"
                                      value={dispatcherForm.badge}
                                      onChange={(e) => setDispatcherForm(prev => ({ ...prev, badge: e.target.value }))}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor="edit-rank">RANK</Label>
                                      <Input
                                        id="edit-rank"
                                        value={dispatcherForm.rank}
                                        onChange={(e) => setDispatcherForm(prev => ({ ...prev, rank: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-tie-breaker">TIE BREAKER</Label>
                                      <Input
                                        id="edit-tie-breaker"
                                        type="number"
                                        value={dispatcherForm.tie_breaker}
                                        onChange={(e) => setDispatcherForm(prev => ({ ...prev, tie_breaker: parseInt(e.target.value) || 0 }))}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Label htmlFor="edit-active">ACTIVE</Label>
                                    <Switch
                                      id="edit-active"
                                      checked={dispatcherForm.is_active}
                                      onCheckedChange={(checked) => setDispatcherForm(prev => ({ ...prev, is_active: checked }))}
                                    />
                                  </div>
                                  <Button onClick={updateDispatcher}>SAVE CHANGES</Button>
                                </div>
                              </TabsContent>

                              <TabsContent value="qualifications" className="mt-4">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">QUALIFICATIONS</h3>
                                  </div>

                                  {/* Add New Qualification */}
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-base">ADD QUALIFICATION</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-4 gap-2">
                                        <div>
                                          <Label htmlFor="qual-desk">DESK</Label>
                                          <Select 
                                            value={qualificationForm.desk_id} 
                                            onValueChange={(value) => setQualificationForm(prev => ({ ...prev, desk_id: value }))}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select desk" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {desks.map(desk => (
                                                <SelectItem key={desk.id} value={desk.id.toString()}>
                                                  {desk.code} - {desk.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label htmlFor="qual-date">QUALIFIED ON</Label>
                                          <Input
                                            id="qual-date"
                                            type="date"
                                            value={qualificationForm.qualified_on}
                                            onChange={(e) => setQualificationForm(prev => ({ ...prev, qualified_on: e.target.value }))}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="qual-trainer">TRAINER</Label>
                                          <Select 
                                            value={qualificationForm.trainer_id} 
                                            onValueChange={(value) => setQualificationForm(prev => ({ ...prev, trainer_id: value }))}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Optional" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="">No Trainer</SelectItem>
                                              {dispatchers.filter(d => d.is_active).map(trainer => (
                                                <SelectItem key={trainer.id} value={trainer.id.toString()}>
                                                  {trainer.last_name}, {trainer.first_name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex items-end">
                                          <Button onClick={addQualification} size="sm" className="w-full">
                                            ADD
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <Label htmlFor="qual-notes">NOTES</Label>
                                        <Textarea
                                          id="qual-notes"
                                          value={qualificationForm.notes}
                                          onChange={(e) => setQualificationForm(prev => ({ ...prev, notes: e.target.value }))}
                                          rows={2}
                                          placeholder="Optional notes..."
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Qualifications Table */}
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>DESK</TableHead>
                                        <TableHead>QUALIFIED ON</TableHead>
                                        <TableHead>TRAINER</TableHead>
                                        <TableHead>STATUS</TableHead>
                                        <TableHead>ACTIONS</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedDispatcherQuals.map(qual => (
                                        <TableRow key={qual.id}>
                                          <TableCell>
                                            {qual.desks ? `${qual.desks.code} - ${qual.desks.name}` : `Desk ${qual.desk_id}`}
                                          </TableCell>
                                          <TableCell>{new Date(qual.qualified_on).toLocaleDateString()}</TableCell>
                                          <TableCell>
                                            {qual.trainers ? `${qual.trainers.last_name}, ${qual.trainers.first_name}` : "—"}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={qual.is_active ? "default" : "secondary"}>
                                              {qual.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeQualification(qual.id)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      {selectedDispatcherQuals.length === 0 && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No qualifications found
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </DrawerContent>
                      </Drawer>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDispatchers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No dispatchers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}