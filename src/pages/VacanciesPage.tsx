import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Calendar, Clock, User, Award } from "lucide-react"
import { format, parseISO } from "date-fns"

interface Vacancy {
  id: number
  trick_id: number
  starts_at: string
  ends_at: string
  is_holiday: boolean
  tricks: {
    id: number
    desk_id: number
    name: string
    shift_start: string
    shift_end: string
    timezone: string
    desks: {
      id: number
      code: string
      name: string
      territory: string
    }
  }
}

interface Dispatcher {
  id: number
  badge: string
  first_name: string
  last_name: string
  rank: string
  qualifications?: Array<{
    desk_id: number
  }>
}

export function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null)
  const [awarding, setAwarding] = useState(false)
  const { toast } = useToast()

  // Get current week range
  const today = new Date()
  const startDate = format(new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'yyyy-MM-dd')
  const endDate = format(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14), 'yyyy-MM-dd')

  useEffect(() => {
    fetchVacancies()
    fetchDispatchers()
  }, [])

  const fetchVacancies = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(`vacancies?start=${startDate}&end=${endDate}`, {
        method: 'GET'
      })

      if (error) throw error
      setVacancies(data || [])
    } catch (error) {
      console.error('Error fetching vacancies:', error)
      toast({
        title: "Error",
        description: "Failed to load vacancies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDispatchers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('dispatchers', {
        body: { q: '' }
      })

      if (error) throw error
      setDispatchers(data || [])
    } catch (error) {
      console.error('Error fetching dispatchers:', error)
    }
  }

  const getQualifiedDispatchers = (vacancy: Vacancy) => {
    return dispatchers.filter(dispatcher =>
      dispatcher.qualifications?.some(q => q.desk_id === vacancy.tricks.desk_id)
    )
  }

  const handleAwardVacancy = async (vacancy: Vacancy, dispatcherId: number) => {
    setAwarding(true)
    try {
      const { data, error } = await supabase.functions.invoke(`vacancies/${vacancy.id}/award`, {
        method: 'POST',
        body: {
          dispatcher_id: dispatcherId
        }
      })

      if (error) {
        if (error.message?.includes('409')) {
          throw new Error('Position is no longer vacant');
        } else if (error.message?.includes('422')) {
          throw new Error('Dispatcher is not qualified for this desk');
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Vacancy awarded successfully",
      })

      // Refresh vacancies
      await fetchVacancies()
      setSelectedVacancy(null)
    } catch (error: any) {
      console.error('Error awarding vacancy:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to award vacancy",
        variant: "destructive",
      })
    } finally {
      setAwarding(false)
    }
  }

  const groupVacanciesByDesk = () => {
    const grouped: { [key: string]: Vacancy[] } = {}
    vacancies.forEach(vacancy => {
      const deskCode = vacancy.tricks.desks.code
      if (!grouped[deskCode]) {
        grouped[deskCode] = []
      }
      grouped[deskCode].push(vacancy)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vacancies...</p>
        </div>
      </div>
    )
  }

  const groupedVacancies = groupVacanciesByDesk()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vacancies</h1>
          <p className="text-muted-foreground">
            Unassigned trick instances requiring coverage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-muted-foreground">
            {vacancies.length} vacant position{vacancies.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {vacancies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-success" />
            <h3 className="text-lg font-semibold mb-2">All Positions Covered</h3>
            <p className="text-muted-foreground">
              No vacant positions found for the next 14 days
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vacancies List */}
          <div className="space-y-4">
            {Object.entries(groupedVacancies).map(([deskCode, deskVacancies]) => (
              <Card key={deskCode}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span>Desk {deskCode}</span>
                    <Badge variant="destructive">
                      {deskVacancies.length} vacant
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deskVacancies.map((vacancy) => (
                    <div
                      key={vacancy.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedVacancy?.id === vacancy.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedVacancy(vacancy)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{vacancy.tricks.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(vacancy.starts_at), 'EEE, MMM d')} •{' '}
                            {format(parseISO(vacancy.starts_at), 'HH:mm')} - 
                            {format(parseISO(vacancy.ends_at), 'HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="mb-1">
                            VACANT
                          </Badge>
                          {vacancy.is_holiday && (
                            <p className="text-xs text-warning">Holiday</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Vacancy Details and Assignment */}
          <div className="space-y-4">
            {selectedVacancy ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Vacancy Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground text-sm">Desk:</span>
                        <p className="font-medium">
                          {selectedVacancy.tricks.desks.code} - {selectedVacancy.tricks.desks.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Trick:</span>
                        <p className="font-medium">{selectedVacancy.tricks.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Date:</span>
                        <p className="font-medium">
                          {format(parseISO(selectedVacancy.starts_at), 'EEE, MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Time:</span>
                        <p className="font-medium">
                          {format(parseISO(selectedVacancy.starts_at), 'HH:mm')} - 
                          {format(parseISO(selectedVacancy.ends_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-sm">Territory:</span>
                      <p className="font-medium">{selectedVacancy.tricks.desks.territory}</p>
                    </div>

                    {selectedVacancy.is_holiday && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-warning" />
                          <span className="text-sm font-medium text-warning">Holiday Shift</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Qualified Dispatchers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const qualified = getQualifiedDispatchers(selectedVacancy)
                      return qualified.length > 0 ? (
                        <div className="space-y-2">
                          {qualified.map((dispatcher) => (
                            <div
                              key={dispatcher.id}
                              className="flex items-center justify-between p-3 border border-border rounded-md"
                            >
                              <div>
                                <p className="font-medium">
                                  {dispatcher.first_name} {dispatcher.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Badge: {dispatcher.badge} | Rank: {dispatcher.rank}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAwardVacancy(selectedVacancy, dispatcher.id)}
                                disabled={awarding}
                              >
                                {awarding ? "Awarding..." : "Award"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No qualified dispatchers available
                        </p>
                      )
                    })()}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a vacancy to view details and assignment options</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}