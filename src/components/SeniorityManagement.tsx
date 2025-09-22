import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"

interface SeniorityRecord {
  dispatcher_id: number
  rank: string
  tie_breaker: number
  dispatcher?: {
    first_name: string
    last_name: string
    badge: string
  }
}

interface Props {
  dispatcherId?: number
  onUpdate?: () => void
}

export function SeniorityManagement({ dispatcherId, onUpdate }: Props) {
  const [seniority, setSeniority] = useState<SeniorityRecord[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    dispatcher_id: dispatcherId || '',
    rank: '',
    tie_breaker: 0
  })
  const { toast } = useToast()

  const loadSeniority = async () => {
    try {
      const { data, error } = await supabase
        .from('seniority')
        .select(`
          *,
          dispatcher:dispatchers(first_name, last_name, badge)
        `)
        .order('rank')

      if (error) throw error
      setSeniority(data || [])
    } catch (error) {
      console.error('Error loading seniority:', error)
      toast({
        title: "Error",
        description: "Failed to load seniority data",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadSeniority()
  }, [])

  const handleSubmit = async () => {
    if (!form.dispatcher_id || !form.rank) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('seniority')
        .upsert({
          dispatcher_id: parseInt(form.dispatcher_id.toString()),
          rank: form.rank,
          tie_breaker: form.tie_breaker
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Seniority updated successfully",
      })

      setOpen(false)
      setForm({
        dispatcher_id: dispatcherId || '',
        rank: '',
        tie_breaker: 0
      })
      loadSeniority()
      onUpdate?.()
    } catch (error) {
      console.error('Error updating seniority:', error)
      toast({
        title: "Error",
        description: "Failed to update seniority",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="colored-shadow">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Seniority Management</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent">Update Seniority</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Seniority</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rank">Rank</Label>
                  <Input
                    id="rank"
                    value={form.rank}
                    onChange={(e) => setForm(prev => ({ ...prev, rank: e.target.value }))}
                    placeholder="e.g., Senior, Junior, Lead"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tie_breaker">Tie Breaker</Label>
                  <Input
                    id="tie_breaker"
                    type="number"
                    value={form.tie_breaker}
                    onChange={(e) => setForm(prev => ({ ...prev, tie_breaker: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit} className="btn-accent">Update</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {seniority.map(record => (
            <div key={record.dispatcher_id} className="flex justify-between items-center p-3 border rounded-lg accent-border">
              <div>
                <div className="font-medium">
                  {record.dispatcher?.first_name} {record.dispatcher?.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  Badge: {record.dispatcher?.badge}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{record.rank}</Badge>
                {record.tie_breaker > 0 && (
                  <Badge variant="secondary">TB: {record.tie_breaker}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}