import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Dispatcher {
  id: string
  emp_id: string
  first_name: string
  last_name: string
  seniority_date: string
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
}

export default function AdminDispatchersPage() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewDispatcherDialogOpen, setIsNewDispatcherDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  // Form states
  const [dispatcherForm, setDispatcherForm] = useState({
    emp_id: '',
    first_name: '',
    last_name: '',
    seniority_date: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.functions.invoke('admin-dispatchers', {
        method: 'GET'
      })
      
      if (error) {
        throw new Error(error.message || 'Failed to load dispatchers')
      }
      
      if (data && data.dispatchers) {
        setDispatchers(data.dispatchers)
      }
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load dispatcher data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createDispatcher = async () => {
    try {
      console.log('Creating dispatcher with form data:', dispatcherForm)
      
      const { data, error } = await supabase.functions.invoke('admin-dispatchers', {
        method: 'POST',
        body: dispatcherForm
      })

      if (error) {
        throw new Error(error.message || 'Failed to create dispatcher')
      }

      if (data && data.dispatcher) {
        console.log('Dispatcher created successfully:', data.dispatcher)
        setDispatchers(prev => [...prev, data.dispatcher])
        setIsNewDispatcherDialogOpen(false)
        setDispatcherForm({
          emp_id: '',
          first_name: '',
          last_name: '',
          seniority_date: '',
          status: 'ACTIVE'
        })
        toast({ title: "Success", description: "Dispatcher created successfully" })
      }
    } catch (error: any) {
      console.error('Error in createDispatcher:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create dispatcher",
        variant: "destructive"
      })
    }
  }

  const deleteDispatcher = async (dispatcherId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-dispatchers', {
        method: 'DELETE',
        body: { id: dispatcherId }
      })
      
      if (error) {
        throw new Error(error.message || 'Failed to delete dispatcher')
      }
      
      setDispatchers(prev => prev.filter(d => d.id !== dispatcherId))
      toast({ title: "Success", description: "Dispatcher deleted successfully" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dispatcher",
        variant: "destructive"
      })
    }
  }

  const filteredDispatchers = dispatchers.filter(dispatcher => 
    dispatcher.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatcher.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatcher.emp_id.includes(searchQuery)
  )

  if (loading) {
    return <div className="p-6">Loading dispatchers...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dispatcher Management</h1>
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
              <div>
                <Label htmlFor="emp-id">EMPLOYEE ID</Label>
                <Input
                  id="emp-id"
                  value={dispatcherForm.emp_id}
                  onChange={(e) => setDispatcherForm(prev => ({ ...prev, emp_id: e.target.value }))}
                  placeholder="e.g. 1001"
                />
              </div>
              <div>
                <Label htmlFor="first-name">FIRST NAME</Label>
                <Input
                  id="first-name"
                  value={dispatcherForm.first_name}
                  onChange={(e) => setDispatcherForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <Label htmlFor="last-name">LAST NAME</Label>
                <Input
                  id="last-name"
                  value={dispatcherForm.last_name}
                  onChange={(e) => setDispatcherForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="e.g. Doe"
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
                <Select value={dispatcherForm.status} onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE') => setDispatcherForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createDispatcher}>CREATE DISPATCHER</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
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
          <CardTitle>Dispatchers ({filteredDispatchers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Employee ID</TableHead>
                 <TableHead>Name</TableHead>
                 <TableHead>Seniority Date</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Actions</TableHead>
               </TableRow>
             </TableHeader>
            <TableBody>
              {filteredDispatchers.map(dispatcher => (
                <TableRow key={dispatcher.id}>
                  <TableCell className="font-medium">{dispatcher.emp_id}</TableCell>
                  <TableCell>{dispatcher.first_name} {dispatcher.last_name}</TableCell>
                  <TableCell>{new Date(dispatcher.seniority_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      dispatcher.status === 'ACTIVE' ? 'default' :
                      dispatcher.status === 'INACTIVE' ? 'secondary' : 'outline'
                    }>
                      {dispatcher.status}
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => deleteDispatcher(dispatcher.id)}
                       className="text-destructive hover:text-destructive"
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </TableCell>
                </TableRow>
              ))}
               {filteredDispatchers.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center text-muted-foreground">
                     No dispatchers found
                   </TableCell>
                 </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}