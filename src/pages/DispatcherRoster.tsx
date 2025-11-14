import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Dispatcher {
  employee_id: number;
  emp_no: string;
  first_name: string;
  last_name: string;
  seniority_date: string;
  hire_date: string;
  seniority_rank: number;
}

export default function DispatcherRoster() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDispatchers();
  }, []);

  const loadDispatchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_seniority_rank')
        .select('*')
        .order('seniority_rank', { ascending: true });

      if (error) throw error;
      setDispatchers(data || []);
    } catch (error: any) {
      toast.error('Failed to load dispatchers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dispatcher Roster</h1>
        <p className="text-muted mt-1">Seniority-based ranking (contract rules)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seniority List ({dispatchers.length} Active Dispatchers)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dispatchers.map((dispatcher) => (
              <div
                key={dispatcher.employee_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-panel transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-lg font-bold min-w-[60px] justify-center">
                    #{dispatcher.seniority_rank}
                  </Badge>
                  <div>
                    <p className="font-semibold text-lg">
                      {dispatcher.last_name}, {dispatcher.first_name}
                    </p>
                    <p className="text-sm text-muted">Emp #{dispatcher.emp_no}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    Seniority: {new Date(dispatcher.seniority_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted">
                    Hired: {new Date(dispatcher.hire_date || dispatcher.seniority_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted bg-panel2 p-4 rounded-lg">
        <p className="font-semibold mb-2">How Seniority Works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Rank is determined by seniority date (earlier = higher rank)</li>
          <li>Ties are broken by hire date (earlier hire wins)</li>
          <li>Final tie-breaker is employee number (lower number wins)</li>
          <li>This ranking determines who gets jobs, hold-downs, and board calls</li>
        </ul>
      </div>
    </div>
  );
}
