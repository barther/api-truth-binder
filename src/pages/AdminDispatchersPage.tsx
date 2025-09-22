import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Division {
  division_id: string
  code: string
  name: string
}

interface Dispatcher {
  dispatcher_id: string
  emp_id: string
  first_name: string
  last_name: string
  seniority_date: string
  status: 'active' | 'inactive' | 'retired' | 'terminated'
  dispatcher_current_division?: {
    division_id: string
    divisions?: Division
  }
}

export default function AdminDispatchersPage() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDivision, setSelectedDivision] = useState("")
  const [loading, setLoading] = useState(true)
  const [isNewDispatcherDialogOpen, setIsNewDispatcherDialogOpen] = useState(false)
  const [editingDispatcher, setEditingDispatcher] = useState<Dispatcher | null>(null)
  const { toast } = useToast()

  // Form states
  const [dispatcherForm, setDispatcherForm] = useState({
    emp_id: "",
    first_name: "",
    last_name: "",
    seniority_date: "",
    status: "active" as 'active' | 'inactive' | 'retired' | 'terminated'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load divisions
      const { data: divisionsData } = await supabase.functions.invoke('divisions', { method: 'GET' })
      if (divisionsData) setDivisions(divisionsData)
      
      // Load dispatchers
      const { data: dispatchersData } = await supabase.functions.invoke('dispatchers', {
        method: 'GET',
        body: { 
          q: searchQuery,
          division: selectedDivision 
        }
      })
      if (dispatchersData) setDispatchers(dispatchersData)

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

  const createDispatcher = async () => {
    try {
      const { data: dispatcher } = await supabase.functions.invoke('dispatchers', {
        method: 'POST',
        body: dispatcherForm
      })

      if (dispatcher) {
        setDispatchers(prev => [...prev, dispatcher])
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
          dispatcher_id: editingDispatcher.dispatcher_id,
          ...dispatcherForm
        }
      })

      if (data) {
        setDispatchers(prev => prev.map(d => 
          d.dispatcher_id === editingDispatcher.dispatcher_id ? { ...d, ...data } : d
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

  const toggleDispatcherStatus = async (dispatcher: Dispatcher) => {
    try {
      const newStatus = dispatcher.status === 'active' ? 'inactive' : 'active'
      const { data } = await supabase.functions.invoke('dispatchers', {
        method: 'PATCH',
        body: {
          dispatcher_id: dispatcher.dispatcher_id,
          status: newStatus
        }
      })

      if (data) {
        setDispatchers(prev => prev.map(d => 
          d.dispatcher_id === dispatcher.dispatcher_id ? { ...d, status: newStatus } : d
        ))
        toast({ 
          title: "Success", 
          description: `Dispatcher ${newStatus === 'active' ? 'activated' : 'deactivated'}` 
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
      emp_id: "",
      first_name: "",
      last_name: "",
      seniority_date: "",
      status: "active" as 'active' | 'inactive' | 'retired' | 'terminated'
    })
  }

  // Filter dispatchers based on search and division
  const filteredDispatchers = dispatchers.filter(dispatcher => {
    const matchesSearch = !searchQuery || 
      dispatcher.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispatcher.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispatcher.emp_id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDivision = !selectedDivision || selectedDivision === "all" || 
      dispatcher.dispatcher_current_division?.divisions?.code === selectedDivision

    return matchesSearch && matchesDivision
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'retired': return 'outline'
      case 'terminated': return 'destructive'
      default: return 'secondary'
    }
  }

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
                  <Label htmlFor="emp-id">EMPLOYEE ID</Label>
                  <Input
                    id="emp-id"
                    value={dispatcherForm.emp_id}
                    onChange={(e) => setDispatcherForm(prev => ({ ...prev, emp_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="seniority-date">SENIORITY DATE</Label>
                  <Input
                    id="seniority-date"
                    type="date"
                    value={dispatcherForm.seniority_date}
                    onChange={(e) => setDispatcherForm(prev => ({ ...prev, seniority_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">STATUS</Label>
                  <Select value={dispatcherForm.status} onValueChange={(value: any) => setDispatcherForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createDispatcher}>CREATE DISPATCHER</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dispatchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-48">
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger>
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division.division_id} value={division.code}>
                    {division.code} - {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={loadData}>
            REFRESH
          </Button>
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
                  <TableHead>DIVISION</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatchers.map(dispatcher => (
                  <TableRow key={dispatcher.dispatcher_id}>
                    <TableCell className="font-medium">{dispatcher.last_name}</TableCell>
                    <TableCell>{dispatcher.first_name}</TableCell>
                    <TableCell>{dispatcher.emp_id}</TableCell>
                    <TableCell>{new Date(dispatcher.seniority_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {dispatcher.dispatcher_current_division?.divisions ? 
                        `${dispatcher.dispatcher_current_division.divisions.code} - ${dispatcher.dispatcher_current_division.divisions.name}` : 
                        "—"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(dispatcher.status)}>
                          {dispatcher.status.toUpperCase()}
                        </Badge>
                        {(dispatcher.status === 'active' || dispatcher.status === 'inactive') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDispatcherStatus(dispatcher)}
                            className="text-xs"
                          >
                            {dispatcher.status === 'active' ? 'DEACTIVATE' : 'ACTIVATE'}
                          </Button>
                        )}
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
                                emp_id: dispatcher.emp_id,
                                first_name: dispatcher.first_name,
                                last_name: dispatcher.last_name,
                                seniority_date: dispatcher.seniority_date,
                                status: dispatcher.status
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
                                <TabsTrigger value="assignments">JOB AWARDS</TabsTrigger>
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
                                    <Label htmlFor="edit-emp-id">EMPLOYEE ID</Label>
                                    <Input
                                      id="edit-emp-id"
                                      value={dispatcherForm.emp_id}
                                      onChange={(e) => setDispatcherForm(prev => ({ ...prev, emp_id: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-seniority-date">SENIORITY DATE</Label>
                                    <Input
                                      id="edit-seniority-date"
                                      type="date"
                                      value={dispatcherForm.seniority_date}
                                      onChange={(e) => setDispatcherForm(prev => ({ ...prev, seniority_date: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-status">STATUS</Label>
                                    <Select value={dispatcherForm.status} onValueChange={(value: any) => setDispatcherForm(prev => ({ ...prev, status: value }))}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="retired">Retired</SelectItem>
                                        <SelectItem value="terminated">Terminated</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button onClick={updateDispatcher}>SAVE CHANGES</Button>
                                </div>
                              </TabsContent>

                              <TabsContent value="assignments" className="mt-4">
                                <div className="space-y-4">
                                  <div className="text-center text-muted-foreground py-8">
                                    <h3 className="text-lg font-medium mb-2">JOB AWARDS & ASSIGNMENTS</h3>
                                    <p>Feature coming soon - manage job awards, hold-downs, and ATW assignments</p>
                                  </div>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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