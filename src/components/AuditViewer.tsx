import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface AuditLog {
  id: number;
  actor?: number;
  action: string;
  entity: string;
  entity_id: number;
  before_data?: any;
  after_data?: any;
  created_at: string;
}

export const AuditViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityIdFilter, setEntityIdFilter] = useState<string>('');
  const { toast } = useToast();

  const fetchAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (entityFilter) {
        query = query.eq('entity', entityFilter);
      }
      
      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      
      if (entityIdFilter && !isNaN(parseInt(entityIdFilter))) {
        query = query.eq('entity_id', parseInt(entityIdFilter));
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter, actionFilter, entityIdFilter]);

  const formatJsonDiff = (before: any, after: any) => {
    if (!before && !after) return null;
    
    if (!before) {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-600">Created:</div>
          <pre className="text-xs bg-green-50 p-2 rounded border text-green-800 overflow-auto">
            {JSON.stringify(after, null, 2)}
          </pre>
        </div>
      );
    }
    
    if (!after) {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600">Deleted:</div>
          <pre className="text-xs bg-red-50 p-2 rounded border text-red-800 overflow-auto">
            {JSON.stringify(before, null, 2)}
          </pre>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-red-600 mb-1">Before:</div>
            <pre className="text-xs bg-red-50 p-2 rounded border text-red-800 overflow-auto max-h-32">
              {JSON.stringify(before, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-sm font-medium text-green-600 mb-1">After:</div>
            <pre className="text-xs bg-green-50 p-2 rounded border text-green-800 overflow-auto max-h-32">
              {JSON.stringify(after, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Entity Type</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  <SelectItem value="assignments">Assignments</SelectItem>
                  <SelectItem value="hold_downs">Hold Downs</SelectItem>
                  <SelectItem value="absences">Absences</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Entity ID</label>
              <Input
                placeholder="Enter entity ID"
                value={entityIdFilter}
                onChange={(e) => setEntityIdFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="font-medium">
                        {log.entity} #{log.entity_id}
                      </span>
                      {log.actor && (
                        <span className="text-sm text-muted-foreground">
                          by Actor #{log.actor}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                  </div>
                  
                  {(log.before_data || log.after_data) && (
                    <div className="border-t pt-3">
                      {formatJsonDiff(log.before_data, log.after_data)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};