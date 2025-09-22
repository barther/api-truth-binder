import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Division {
  division_id: string
  code: string
  name: string
}

interface Desk {
  id: string
  code: string
  name: string
  division: string
  is_active: boolean
}

export default function AdminDesksPage() {
  const [desks, setDesks] = useState<Desk[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewDeskDialogOpen, setIsNewDeskDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form states
  const [deskForm, setDeskForm] = useState({
    code: "",
    name: "",
    division: "",
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load divisions - use direct database query since we have new schema
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions')
        .select('*')
      
      if (divisionsError) {
        console.error('Error loading divisions:', divisionsError)
      } else if (divisionsData) {
        setDivisions(divisionsData)
      }
      
      // Load desks - use direct database query
      const { data: desksData, error: desksError } = await supabase
        .from('desks')
        .select('*')
        .order('code')
      
      if (desksError) {
        console.error('Error loading desks:', desksError)
      } else if (desksData) {
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

  const createDesk = async () => {
    try {
      console.log('Creating desk with form data:', deskForm)
      
      const { data, error } = await supabase
        .from('desks')
        .insert([deskForm])
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error creating desk:', error)
        throw error
      }
      
      if (data) {
        console.log('Desk created successfully:', data)
        setDesks(prev => [...prev, data])
        setSelectedDesk(data)
        setIsNewDeskDialogOpen(false)
        setDeskForm({ code: "", name: "", division: "", is_active: true })
        toast({ title: "Success", description: "Desk created successfully" })
      }
    } catch (error: any) {
      console.error('Error in createDesk:', error)
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
      const { data, error } = await supabase
        .from('desks')
        .update(deskForm)
        .eq('id', selectedDesk.id)
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
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

  if (loading) {
    return <div className="p-6">Loading desks...</div>
  }

  if (desks.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">NO DESKS CONFIGURED</h2>
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
                      value={deskForm.code}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g. BR2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="desk-name">DESK NAME</Label>
                    <Input
                      id="desk-name"
                      value={deskForm.name}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Blue Ridge 2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="division">DIVISION</Label>
                    <Select value={deskForm.division} onValueChange={(value) => setDeskForm(prev => ({ ...prev, division: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Coastal">Coastal</SelectItem>
                        <SelectItem value="Gulf">Gulf</SelectItem>
                        <SelectItem value="Blue Ridge">Blue Ridge</SelectItem>
                        <SelectItem value="Midwest">Midwest</SelectItem>
                        <SelectItem value="Great Lakes">Great Lakes</SelectItem>
                        <SelectItem value="Keystone">Keystone</SelectItem>
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
                <CardTitle className="text-lg">DESKS</CardTitle>
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
                          value={deskForm.code}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="e.g. BR2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="desk-name">DESK NAME</Label>
                        <Input
                          id="desk-name"
                          value={deskForm.name}
                          onChange={(e) => setDeskForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Blue Ridge 2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="division">DIVISION</Label>
                        <Select value={deskForm.division} onValueChange={(value) => setDeskForm(prev => ({ ...prev, division: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Coastal">Coastal</SelectItem>
                            <SelectItem value="Gulf">Gulf</SelectItem>
                            <SelectItem value="Blue Ridge">Blue Ridge</SelectItem>
                            <SelectItem value="Midwest">Midwest</SelectItem>
                            <SelectItem value="Great Lakes">Great Lakes</SelectItem>
                            <SelectItem value="Keystone">Keystone</SelectItem>
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
                  key={desk.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDesk?.id === desk.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedDesk(desk)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{desk.code}</div>
                      <div className="text-sm opacity-80">{desk.name}</div>
                      <div className="text-xs opacity-60">{desk.division}</div>
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
                <CardTitle className="text-lg">
                  {selectedDesk.code} - {selectedDesk.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit-desk-code">DESK CODE</Label>
                    <Input
                      id="edit-desk-code"
                      value={deskForm.code || selectedDesk.code}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-desk-name">DESK NAME</Label>
                    <Input
                      id="edit-desk-name"
                      value={deskForm.name || selectedDesk.name}
                      onChange={(e) => setDeskForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-division">DIVISION</Label>
                    <Select 
                      value={deskForm.division || selectedDesk.division} 
                      onValueChange={(value) => setDeskForm(prev => ({ ...prev, division: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Coastal">Coastal</SelectItem>
                        <SelectItem value="Gulf">Gulf</SelectItem>
                        <SelectItem value="Blue Ridge">Blue Ridge</SelectItem>
                        <SelectItem value="Midwest">Midwest</SelectItem>
                        <SelectItem value="Great Lakes">Great Lakes</SelectItem>
                        <SelectItem value="Keystone">Keystone</SelectItem>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}