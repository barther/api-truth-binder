import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

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

interface Desk {
  id: number
  code: string
  name: string
}

export default function TricksPage() {
  const [tricks, setTricks] = useState<Trick[]>([])
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedDesk, setSelectedDesk] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    desk_id: '',
    shift_start: '07:00',
    shift_end: '15:00',
    timezone: 'America/New_York',
    is_active: true,
    days: {
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: false,
      sun: false
    }
  })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      // Load desks
      const { data: desksData, error: desksError } = await supabase.functions.invoke('desks')
      if (desksError) throw desksError
      setDesks(desksData || [])

      // Load tricks
      const { data: tricksData, error: tricksError } = await supabase.functions.invoke('tricks')
      if (tricksError) throw tricksError
      setTricks(tricksData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const daysMaskToInt = (days: typeof form.days) => {
    let mask = 0
    if (days.mon) mask |= 1
    if (days.tue) mask |= 2
    if (days.wed) mask |= 4
    if (days.thu) mask |= 8
    if (days.fri) mask |= 16
    if (days.sat) mask |= 32
    if (days.sun) mask |= 64
    return mask
  }

  const intToDaysMask = (mask: string) => {
    const intMask = parseInt(mask, 2) || 127
    return {
      mon: !!(intMask & 1),
      tue: !!(intMask & 2),
      wed: !!(intMask & 4),
      thu: !!(intMask & 8),
      fri: !!(intMask & 16),
      sat: !!(intMask & 32),
      sun: !!(intMask & 64)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.desk_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const payload = {
        name: form.name,
        desk_id: parseInt(form.desk_id),
        shift_start: form.shift_start,
        shift_end: form.shift_end,
        days_mask: daysMaskToInt(form.days),
        timezone: form.timezone,
        is_active: form.is_active
      }

      const { data, error } = await supabase.functions.invoke('tricks', {
        method: 'POST',
        body: payload
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Trick created successfully",
      })

      setOpen(false)
      setForm({
        name: '',
        desk_id: '',
        shift_start: '07:00',
        shift_end: '15:00',
        timezone: 'America/New_York',
        is_active: true,
        days: {
          mon: true,
          tue: true,
          wed: true,
          thu: true,
          fri: true,
          sat: false,
          sun: false
        }
      })
      loadData()
    } catch (error) {
      console.error('Error creating trick:', error)
      toast({
        title: "Error",
        description: "Failed to create trick",
        variant: "destructive",
      })
    }
  }

  const buildCalendar = async (deskId: number) => {
    const start = prompt('Start date (YYYY-MM-DD)')
    const end = prompt('End date (YYYY-MM-DD)')
    
    if (!start || !end) return

    try {
      const { error } = await supabase.functions.invoke('calendar', {
        method: 'POST',
        body: { desk_id: deskId, start, end }
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Calendar built successfully",
      })
    } catch (error) {
      console.error('Error building calendar:', error)
      toast({
        title: "Error",
        description: "Failed to build calendar",
        variant: "destructive",
      })
    }
  }

  const filteredTricks = selectedDesk 
    ? tricks.filter(t => t.desk_id === selectedDesk)
    : tricks

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand">Tricks Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-white">New Trick</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Trick</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Day Shift A"
                />
              </div>
              
              <div>
                <Label htmlFor="desk">Desk</Label>
                <Select value={form.desk_id} onValueChange={(value) => setForm(prev => ({ ...prev, desk_id: value }))}>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Time</Label>
                  <Input
                    id="start"
                    type="time"
                    value={form.shift_start}
                    onChange={(e) => setForm(prev => ({ ...prev, shift_start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Time</Label>
                  <Input
                    id="end"
                    type="time"
                    value={form.shift_end}
                    onChange={(e) => setForm(prev => ({ ...prev, shift_end: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Days</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {Object.entries(form.days).map(([day, checked]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Switch
                        id={day}
                        checked={checked}
                        onCheckedChange={(value) => 
                          setForm(prev => ({ ...prev, days: { ...prev.days, [day]: value } }))
                        }
                      />
                      <Label htmlFor={day} className="text-sm capitalize">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={form.is_active}
                  onCheckedChange={(value) => setForm(prev => ({ ...prev, is_active: value }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-gradient-primary text-white">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="colored-shadow">
          <CardHeader>
            <CardTitle>Desks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant={selectedDesk === null ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedDesk(null)}
              >
                All Desks
              </Button>
              {desks.map(desk => (
                <Button
                  key={desk.id}
                  variant={selectedDesk === desk.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedDesk(desk.id)}
                >
                  {desk.code} - {desk.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Card className="colored-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Tricks {selectedDesk && `for ${desks.find(d => d.id === selectedDesk)?.name}`}
                </CardTitle>
                {selectedDesk && (
                  <Button 
                    onClick={() => buildCalendar(selectedDesk)}
                    className="btn-success"
                  >
                    Build Calendar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTricks.map(trick => {
                  const days = intToDaysMask(trick.days_mask)
                  const activeDays = Object.entries(days)
                    .filter(([_, active]) => active)
                    .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1))
                    
                  return (
                    <div key={trick.id} className="border rounded-lg p-4 accent-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{trick.name}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Hours: {trick.shift_start} - {trick.shift_end}</p>
                            <p>Timezone: {trick.timezone}</p>
                            <div className="flex gap-1 flex-wrap">
                              {activeDays.map(day => (
                                <Badge key={day} variant="secondary">{day}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge variant={trick.is_active ? "default" : "destructive"}>
                          {trick.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}