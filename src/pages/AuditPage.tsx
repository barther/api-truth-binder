import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Calendar, User, Activity } from "lucide-react"
import { format, parseISO } from "date-fns"

interface AuditLog {
  id: number
  actor: number | null
  action: string
  entity: string
  entity_id: number
  before_data: any
  after_data: any
  created_at: string
}

export function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [searchFilter, setSearchFilter] = useState("")

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setAuditLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'default'
      case 'UPDATE':
        return 'secondary'
      case 'DELETE':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'assignments':
        return <User className="h-4 w-4" />
      case 'dispatchers':
        return <User className="h-4 w-4" />
      case 'absences':
        return <Calendar className="h-4 w-4" />
      case 'hold_downs':
        return <Activity className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDataChange = (beforeData: any, afterData: any, action: string) => {
    if (action === 'CREATE') {
      return (
        <div className="text-sm">
          <span className="text-muted-foreground">Created:</span>
          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
            {JSON.stringify(afterData, null, 2)}
          </pre>
        </div>
      )
    }

    if (action === 'DELETE') {
      return (
        <div className="text-sm">
          <span className="text-muted-foreground">Deleted:</span>
          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
            {JSON.stringify(beforeData, null, 2)}
          </pre>
        </div>
      )
    }

    if (action === 'UPDATE' && beforeData && afterData) {
      const changes: any = {}
      Object.keys(afterData).forEach(key => {
        if (beforeData[key] !== afterData[key]) {
          changes[key] = {
            from: beforeData[key],
            to: afterData[key]
          }
        }
      })

      return (
        <div className="text-sm">
          <span className="text-muted-foreground">Changes:</span>
          <div className="mt-1 p-2 bg-muted rounded text-xs">
            {Object.keys(changes).length === 0 ? (
              <span className="text-muted-foreground">No changes detected</span>
            ) : (
              Object.entries(changes).map(([field, change]: [string, any]) => (
                <div key={field} className="mb-1">
                  <span className="font-medium">{field}:</span>
                  <div className="ml-2">
                    <span className="text-destructive">- {String(change.from)}</span>
                    <br />
                    <span className="text-success">+ {String(change.to)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    return null
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesEntity = entityFilter === "all" || log.entity === entityFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesSearch = searchFilter === "" || 
      log.entity.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.entity_id.toString().includes(searchFilter)

    return matchesEntity && matchesAction && matchesSearch
  })

  const entities = [...new Set(auditLogs.map(log => log.entity))]
  const actions = [...new Set(auditLogs.map(log => log.action))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Complete history of all system changes and actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search logs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity} value={entity}>
                      {entity.charAt(0).toUpperCase() + entity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {auditLogs.length} records
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getEntityIcon(log.entity)}
                    <div>
                      <CardTitle className="text-lg">
                        {log.action} {log.entity} #{log.entity_id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(log.created_at), 'MMM d, yyyy • HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getActionColor(log.action) as any}>
                      {log.action}
                    </Badge>
                    <Badge variant="outline">
                      {log.entity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {log.actor && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Actor:</span>
                      <span>Dispatcher #{log.actor}</span>
                    </div>
                  )}
                  
                  {formatDataChange(log.before_data, log.after_data, log.action)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredLogs.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing latest 100 records. Use filters to narrow results.
        </div>
      )}
    </div>
  )
}