import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Search, User, Clock, AlertTriangle, Check } from "lucide-react"
import { format, parseISO } from "date-fns"

interface TrickInstance {
  id: number
  trick_id: number
  starts_at: string
  ends_at: string
  tricks: {
    id: number
    desk_id: number
    name: string
    shift_start: string
    shift_end: string
    timezone: string
  }
  assignments?: Assignment[]
}

interface Assignment {
  id: number
  dispatcher_id: number
  source: string
  requires_trainer: boolean
  trainer_id?: number
  dispatchers: Dispatcher
}

interface Dispatcher {
  id: number
  badge: string
  first_name: string
  last_name: string
  rank: string
  qualifications?: Qualification[]
}

interface Qualification {
  id: number
  desk_id: number
  qualified_on: string
  trainer_id?: number
  notes?: string
  desks: {
    id: number
    code: string
    name: string
  }
}

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trickInstance: TrickInstance
  onComplete: () => void
}

export function AssignmentDialog({
  open,
  onOpenChange,
  trickInstance,
  onComplete
}: AssignmentDialogProps) {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDispatcher, setSelectedDispatcher] = useState<Dispatcher | null>(null)
  const [requiresTrainer, setRequiresTrainer] = useState(false)
  const [selectedTrainer, setSelectedTrainer] = useState<string>("")
  const [source, setSource] = useState<string>("BASE")
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const { toast } = useToast()

  const currentAssignment = trickInstance.assignments?.[0]
  const isVacant = !currentAssignment

  useEffect(() => {
    if (open) {
      searchDispatchers("")
    }
  }, [open])

  const searchDispatchers = async (query: string) => {
    setSearchLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('dispatchers', {
        body: { q: query }
      })

      if (error) throw error
      
      // Filter to only show dispatchers qualified for this desk
      const qualifiedDispatchers = data.filter((dispatcher: Dispatcher) =>
        dispatcher.qualifications?.some(q => q.desk_id === trickInstance.tricks.desk_id)
      )
      
      setDispatchers(qualifiedDispatchers || [])
    } catch (error) {
      console.error('Error searching dispatchers:', error)
      toast({
        title: "Error",
        description: "Failed to search dispatchers",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    searchDispatchers(query)
  }

  const handleAssign = async () => {
    if (!selectedDispatcher) {
      toast({
        title: "Error",
        description: "Please select a dispatcher",
        variant: "destructive",
      })
      return
    }

    if (requiresTrainer && !selectedTrainer) {
      toast({
        title: "Error",
        description: "Trainee requires a trainer",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('assignments', {
        body: {
          trick_instance_id: trickInstance.id,
          dispatcher_id: selectedDispatcher.id,
          source,
          requires_trainer: requiresTrainer,
          trainer_id: requiresTrainer ? parseInt(selectedTrainer) : null
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to create assignment')
      }

      toast({
        title: "Success",
        description: `Assignment created for ${selectedDispatcher.first_name} ${selectedDispatcher.last_name}`,
      })

      onComplete()
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAssignment = async () => {
    if (!currentAssignment) return

    setLoading(true)
    try {
      const { error } = await supabase.functions.invoke('assignments', {
        body: { id: currentAssignment.id },
        method: 'DELETE'
      })

      if (error) {
        throw new Error(error.message || 'Failed to remove assignment')
      }

      toast({
        title: "Success",
        description: "Assignment removed successfully",
      })

      onComplete()
    } catch (error: any) {
      console.error('Error removing assignment:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove assignment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const availableTrainers = dispatchers.filter(d => 
    d.id !== selectedDispatcher?.id &&
    d.qualifications?.some(q => q.desk_id === trickInstance.tricks.desk_id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Assignment - {trickInstance.tricks.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trick Instance Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(trickInstance.starts_at), 'EEE, MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(trickInstance.starts_at), 'HH:mm')} - 
                    {format(parseISO(trickInstance.ends_at), 'HH:mm')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {isVacant ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <Badge variant="destructive">VACANT</Badge>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        <Badge variant="default">ASSIGNED</Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {currentAssignment && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {currentAssignment.dispatchers.first_name} {currentAssignment.dispatchers.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Badge: {currentAssignment.dispatchers.badge} | 
                        Rank: {currentAssignment.dispatchers.rank} |
                        Source: {currentAssignment.source}
                      </p>
                      {currentAssignment.requires_trainer && (
                        <Badge variant="secondary" className="mt-1">TRAINEE</Badge>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveAssignment}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isVacant && (
            <>
              {/* Dispatcher Search */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Qualified Dispatchers</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, badge, or rank..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Dispatcher List */}
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchLoading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Searching...
                    </div>
                  ) : dispatchers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No qualified dispatchers found
                    </div>
                  ) : (
                    dispatchers.map((dispatcher) => (
                      <Card
                        key={dispatcher.id}
                        className={`cursor-pointer transition-colors ${
                          selectedDispatcher?.id === dispatcher.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedDispatcher(dispatcher)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {dispatcher.first_name} {dispatcher.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Badge: {dispatcher.badge} | Rank: {dispatcher.rank}
                                </p>
                              </div>
                            </div>
                            {selectedDispatcher?.id === dispatcher.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Assignment Options */}
              {selectedDispatcher && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="source">Assignment Source</Label>
                      <Select value={source} onValueChange={setSource}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASE">BASE</SelectItem>
                          <SelectItem value="HOLD_DOWN">HOLD DOWN</SelectItem>
                          <SelectItem value="ATW">ATW (Around The World)</SelectItem>
                          <SelectItem value="OVERTIME">OVERTIME</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="trainer"
                        checked={requiresTrainer}
                        onCheckedChange={(checked) => setRequiresTrainer(checked as boolean)}
                      />
                      <Label htmlFor="trainer">Requires Trainer</Label>
                    </div>
                  </div>

                  {requiresTrainer && (
                    <div>
                      <Label htmlFor="trainer-select">Select Trainer</Label>
                      <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a qualified trainer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTrainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id.toString()}>
                              {trainer.first_name} {trainer.last_name} ({trainer.badge})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    onClick={handleAssign}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Creating Assignment..." : "Assign Dispatcher"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}