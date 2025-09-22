import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"

interface Qualification {
  id: number
  dispatcher_id: number
  desk_id: number
  qualified_on: string
  trainer_id?: number
  is_active: boolean
  notes?: string
  created_at: string
  desk?: {
    code: string
    name: string
  }
  dispatcher?: {
    first_name: string
    last_name: string
    badge: string
  }
  trainer?: {
    first_name: string
    last_name: string
  }
}

interface Dispatcher {
  id: number
  first_name: string
  last_name: string
  badge: string
}

interface Desk {
  id: number
  code: string
  name: string
}

interface Props {
  dispatcherId?: number
  onUpdate?: () => void
}

export function QualificationsManagement({ dispatcherId, onUpdate }: Props) {
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [desks, setDesks] = useState<Desk[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    dispatcher_id: dispatcherId || '',
    desk_id: '',
    trainer_id: '',
    notes: ''
  })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      // Load qualifications
      let qualQuery = supabase
        .from('qualifications')
        .select(`
          *,
          desk:desks(code, name),
          dispatcher:dispatchers(first_name, last_name, badge),
          trainer:dispatchers!qualifications_trainer_id_fkey(first_name, last_name)
        `)
        .eq('is_active', true)

      if (dispatcherId) {
        qualQuery = qualQuery.eq('dispatcher_id', dispatcherId)
      }

      const { data: qualsData, error: qualsError } = await qualQuery
      if (qualsError) throw qualsError

      // Load dispatchers and desks for forms
      const [dispatchersResult, desksResult] = await Promise.all([
        supabase.functions.invoke('dispatchers'),
        supabase.functions.invoke('desks')
      ])

      if (dispatchersResult.error) throw dispatchersResult.error
      if (desksResult.error) throw desksResult.error

      setQualifications((qualsData as any) || [])
      setDispatchers(dispatchersResult.data || [])
      setDesks(desksResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load qualifications data",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [dispatcherId])

  const handleSubmit = async () => {
    if (!form.dispatcher_id || !form.desk_id) {
      toast({
        title: "Error",
        description: "Please select dispatcher and desk",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('qualifications')
        .insert({
          dispatcher_id: parseInt(form.dispatcher_id.toString()),
          desk_id: parseInt(form.desk_id),
          qualified_on: new Date().toISOString().split('T')[0],
          trainer_id: form.trainer_id ? parseInt(form.trainer_id) : null,
          notes: form.notes || null,
          is_active: true
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Qualification added successfully",
      })

      setOpen(false)
      setForm({
        dispatcher_id: dispatcherId || '',
        desk_id: '',
        trainer_id: '',
        notes: ''
      })
      loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error adding qualification:', error)
      toast({
        title: "Error",
        description: "Failed to add qualification",
        variant: "destructive",
      })
    }
  }

  const removeQualification = async (qualificationId: number) => {
    try {
      const { error } = await supabase
        .from('qualifications')
        .update({ is_active: false })
        .eq('id', qualificationId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Qualification removed",
      })

      loadData()
      onUpdate?.()
    } catch (error) {
      console.error('Error removing qualification:', error)
      toast({
        title: "Error",
        description: "Failed to remove qualification",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="colored-shadow">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Desk Qualifications</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-success">Add Qualification</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Desk Qualification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!dispatcherId && (
                  <div>
                    <Label htmlFor="dispatcher">Dispatcher</Label>
                    <Select value={form.dispatcher_id.toString()} onValueChange={(value) => setForm(prev => ({ ...prev, dispatcher_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispatcher" />
                      </SelectTrigger>
                      <SelectContent>
                        {dispatchers.map(dispatcher => (
                          <SelectItem key={dispatcher.id} value={dispatcher.id.toString()}>
                            {dispatcher.first_name} {dispatcher.last_name} ({dispatcher.badge})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
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

                <div>
                  <Label htmlFor="trainer">Trainer (Optional)</Label>
                  <Select value={form.trainer_id} onValueChange={(value) => setForm(prev => ({ ...prev, trainer_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No trainer</SelectItem>
                      {dispatchers.map(dispatcher => (
                        <SelectItem key={dispatcher.id} value={dispatcher.id.toString()}>
                          {dispatcher.first_name} {dispatcher.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional qualification notes"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit} className="btn-success">Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {qualifications.map(qual => (
            <div key={qual.id} className="flex justify-between items-center p-3 border rounded-lg accent-border">
              <div>
                <div className="font-medium">
                  {qual.desk?.code} - {qual.desk?.name}
                </div>
                {!dispatcherId && (
                  <div className="text-sm text-muted-foreground">
                    {qual.dispatcher?.first_name} {qual.dispatcher?.last_name} ({qual.dispatcher?.badge})
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Qualified: {new Date(qual.qualified_on).toLocaleDateString()}
                  {qual.trainer && ` • Trainer: ${qual.trainer.first_name} ${qual.trainer.last_name}`}
                </div>
                {qual.notes && (
                  <div className="text-xs text-muted-foreground mt-1">{qual.notes}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Qualified</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeQualification(qual.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          {qualifications.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No qualifications found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}