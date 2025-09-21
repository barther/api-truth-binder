import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Search, User, Calendar, Award, Phone, Mail } from "lucide-react"
import { format } from "date-fns"

interface Dispatcher {
  id: number
  badge: string
  first_name: string
  last_name: string
  rank: string
  hire_date: string
  is_active: boolean
  qualifications?: Qualification[]
  seniority?: {
    rank: string
    tie_breaker: number
  }
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

export function DispatchersPage() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedDispatcher, setSelectedDispatcher] = useState<Dispatcher | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDispatchers("")
  }, [])

  const fetchDispatchers = async (query: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('dispatchers', {
        body: { q: query }
      })

      if (error) throw error
      setDispatchers(data || [])
    } catch (error) {
      console.error('Error fetching dispatchers:', error)
      toast({
        title: "Error",
        description: "Failed to load dispatchers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    fetchDispatchers(query)
  }

  const filteredDispatchers = dispatchers.filter(dispatcher =>
    dispatcher.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatcher.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatcher.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatcher.rank.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatchers</h1>
          <p className="text-muted-foreground">
            Manage dispatcher information, qualifications, and assignments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredDispatchers.length} dispatcher{filteredDispatchers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, badge, or rank..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatcher List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dispatchers...</p>
            </div>
          ) : filteredDispatchers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No dispatchers found
            </div>
          ) : (
            filteredDispatchers.map((dispatcher) => (
              <Card
                key={dispatcher.id}
                className={`cursor-pointer transition-colors ${
                  selectedDispatcher?.id === dispatcher.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedDispatcher(dispatcher)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {dispatcher.first_name} {dispatcher.last_name}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          <span>Badge: {dispatcher.badge}</span>
                          <span>•</span>
                          <span>Rank: {dispatcher.rank}</span>
                          <span>•</span>
                          <span>Hired: {format(new Date(dispatcher.hire_date), 'MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge 
                        variant={dispatcher.is_active ? "default" : "secondary"}
                      >
                        {dispatcher.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {dispatcher.qualifications?.length || 0} qualification{dispatcher.qualifications?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dispatcher Details */}
        <div className="space-y-4">
          {selectedDispatcher ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Dispatcher Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedDispatcher.first_name} {selectedDispatcher.last_name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Badge:</span>
                        <p className="font-medium">{selectedDispatcher.badge}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rank:</span>
                        <p className="font-medium">{selectedDispatcher.rank}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hire Date:</span>
                        <p className="font-medium">
                          {format(new Date(selectedDispatcher.hire_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge 
                          variant={selectedDispatcher.is_active ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {selectedDispatcher.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedDispatcher.seniority && (
                    <div>
                      <span className="text-muted-foreground text-sm">Seniority:</span>
                      <p className="font-medium">
                        {selectedDispatcher.seniority.rank}
                        {selectedDispatcher.seniority.tie_breaker > 0 && 
                          ` (Tie: ${selectedDispatcher.seniority.tie_breaker})`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Qualifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDispatcher.qualifications && selectedDispatcher.qualifications.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDispatcher.qualifications.map((qual) => (
                        <div key={qual.id} className="p-3 bg-muted rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{qual.desks.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Code: {qual.desks.code}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {format(new Date(qual.qualified_on), 'MMM yyyy')}
                            </Badge>
                          </div>
                          {qual.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {qual.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No qualifications on record
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a dispatcher to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}