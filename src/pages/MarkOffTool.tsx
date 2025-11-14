import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserX, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CascadeDisplay } from '@/components/CascadeDisplay';
import { Switch } from '@/components/ui/switch';

interface Dispatcher {
  id: number;
  emp_no: string;
  first_name: string;
  last_name: string;
  seniority_rank?: number;
}

interface MarkOffResult {
  markOffId: number;
  vacancyCreated: {
    slotId: number;
    trickCode: string;
    deskName: string;
    shiftName: string;
    date: string;
  };
  engineResult: {
    recommendation: any;
    alternatives: any[];
    explanation: string;
  };
}

export default function MarkOffTool() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedDispatcher, setSelectedDispatcher] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('SICK');
  const [result, setResult] = useState<MarkOffResult | null>(null);
  const [cascadeResult, setCascadeResult] = useState<any>(null);
  const [useCascadeResolver, setUseCascadeResolver] = useState(true);

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

  const handleMarkOff = async () => {
    if (!selectedDispatcher) {
      toast.error('Please select a dispatcher');
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      // Step 1: Create mark-off record
      const { data: markOffData, error: markOffError } = await supabase
        .from('mark_offs')
        .insert({
          employee_id: parseInt(selectedDispatcher),
          the_date: selectedDate,
          reason: reason
        })
        .select()
        .single();

      if (markOffError) throw markOffError;

      toast.success('Mark-off created');

      // Step 2: Find the vacancy created (their assignment for that day)
      const { data: vacancyData, error: vacancyError } = await supabase
        .from('v_vacancies')
        .select('*')
        .eq('local_date', selectedDate)
        .eq('primary_employee_id', parseInt(selectedDispatcher))
        .single();

      if (vacancyError || !vacancyData) {
        // No assignment found for this day (might be their rest day)
        toast.info('No assignment found for this dispatcher on this date (might be rest day)');
        setProcessing(false);
        return;
      }

      // Step 3: Run coverage engine
      if (useCascadeResolver) {
        // Use cascade resolver for full chain
        const { data: cascadeData, error: cascadeError } = await supabase.functions.invoke('cascade-resolver', {
          body: { slot_id: vacancyData.schedule_slot_id }
        });

        if (cascadeError) throw cascadeError;
        setCascadeResult(cascadeData);
      }

      // Also get simple coverage for display
      const { data: engineData, error: engineError } = await supabase.functions.invoke('coverage-engine', {
        body: { slot_id: vacancyData.schedule_slot_id }
      });

      if (engineError) throw engineError;

      // Step 4: Display results
      setResult({
        markOffId: markOffData.id,
        vacancyCreated: {
          slotId: vacancyData.schedule_slot_id,
          trickCode: vacancyData.trick_code,
          deskName: vacancyData.desk_name,
          shiftName: vacancyData.shift_name,
          date: selectedDate
        },
        engineResult: engineData
      });

      toast.success('Coverage analysis complete!');
    } catch (error: any) {
      toast.error('Failed to process mark-off: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyRecommendation = async () => {
    if (!result || !result.engineResult.recommendation) return;

    try {
      const { error } = await supabase.functions.invoke('apply-assignment', {
        body: {
          slot_id: result.vacancyCreated.slotId,
          employee_id: result.engineResult.recommendation.employee_id,
          source: result.engineResult.recommendation.source,
          notes: `Auto-applied via Mark-Off Tool - ${result.engineResult.recommendation.band}`
        }
      });

      if (error) throw error;
      toast.success('Assignment applied successfully!');
      setResult(null);
    } catch (error: any) {
      toast.error('Failed to apply assignment: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  const selectedDispatcherData = dispatchers.find(d => d.id.toString() === selectedDispatcher);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mark-Off Tool</h1>
          <p className="text-muted mt-1">Mark a dispatcher off and see who should cover (algorithm-based)</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="cascade-mode-markoff"
            checked={useCascadeResolver}
            onCheckedChange={setUseCascadeResolver}
          />
          <Label htmlFor="cascade-mode-markoff" className="text-sm cursor-pointer">
            Show Full Cascade
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Mark Someone Off</CardTitle>
            <CardDescription>Select dispatcher and date to create absence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Dispatcher *</Label>
              <Select value={selectedDispatcher} onValueChange={setSelectedDispatcher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dispatcher..." />
                </SelectTrigger>
                <SelectContent>
                  {dispatchers.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      #{d.seniority_rank} - {d.last_name}, {d.first_name} ({d.emp_no})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SICK">Sick</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="WEATHER">Weather</SelectItem>
                  <SelectItem value="TRANSPORT">Transport</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDispatcherData && (
              <div className="bg-panel2 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Selected Dispatcher:</p>
                <p className="text-lg font-bold">
                  {selectedDispatcherData.last_name}, {selectedDispatcherData.first_name}
                </p>
                <p className="text-sm text-muted">
                  Emp #{selectedDispatcherData.emp_no} • Seniority Rank #{selectedDispatcherData.seniority_rank}
                </p>
              </div>
            )}

            <Button
              onClick={handleMarkOff}
              disabled={!selectedDispatcher || processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Mark Off & Run Algorithm
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {!result ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted" />
                <p className="text-muted">Mark someone off to see coverage recommendation</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Vacancy Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Trick:</span>
                      <span className="font-semibold">{result.vacancyCreated.trickCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Desk:</span>
                      <span className="font-semibold">{result.vacancyCreated.deskName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Shift:</span>
                      <span className="font-semibold">{result.vacancyCreated.shiftName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Date:</span>
                      <span className="font-semibold">{new Date(result.vacancyCreated.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-info">
                <CardHeader>
                  <CardTitle>Algorithm Recommendation</CardTitle>
                  <CardDescription>Who should be assigned per contract rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.engineResult.recommendation ? (
                    <>
                      <div className="bg-ok/10 border border-ok rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-lg">
                              {result.engineResult.recommendation.name}
                            </p>
                            <p className="text-sm text-muted">Emp #{result.engineResult.recommendation.emp_no}</p>
                          </div>
                          <Badge variant={result.engineResult.recommendation.pay_basis === 'OVERTIME' ? 'destructive' : 'default'}>
                            {result.engineResult.recommendation.pay_basis === 'OVERTIME' ? 'OT' : 'ST'}
                          </Badge>
                        </div>

                        {/* Order of Call Step */}
                        <div className="mb-3 p-2 bg-background rounded text-sm">
                          <span className="font-semibold text-info">{result.engineResult.recommendation.step_name}</span>
                        </div>

                        {/* Diversion Warning */}
                        {result.engineResult.recommendation.is_diversion && (
                          <div className="mb-3 p-2 bg-warning/10 border border-warning rounded text-sm">
                            <p className="font-semibold text-warning">⚠ DIVERSION</p>
                            {!result.engineResult.recommendation.eb_can_backfill && (
                              <p className="text-xs mt-1 text-warning">No EB backfill - creates cascading vacancy</p>
                            )}
                            {result.engineResult.recommendation.eb_can_backfill && (
                              <p className="text-xs mt-1">EB available to backfill original job</p>
                            )}
                          </div>
                        )}

                        {/* Rest Day Notice */}
                        {result.engineResult.recommendation.on_rest_day && (
                          <div className="mb-3 p-2 bg-info/10 border border-info rounded text-sm">
                            <p className="text-info">📅 On rest day (offered as overtime)</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-muted">Seniority Rank:</span>
                            <p className="font-semibold">#{result.engineResult.recommendation.seniority_rank}</p>
                          </div>
                          <div>
                            <span className="text-muted">Rest Hours:</span>
                            <p className="font-semibold">{result.engineResult.recommendation.rest_hours}h</p>
                          </div>
                          <div>
                            <span className="text-muted">Pay Basis:</span>
                            <p className="font-semibold">{result.engineResult.recommendation.pay_basis}</p>
                          </div>
                          <div>
                            <span className="text-muted">Source:</span>
                            <p className="font-semibold">{result.engineResult.recommendation.source}</p>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <p className="text-sm font-semibold mb-2">Rule Checks (Audit Trail):</p>
                          <div className="space-y-1">
                            {result.engineResult.recommendation.rule_trace.checks.map((check: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                {check.ok ? (
                                  <CheckCircle2 className="w-4 h-4 text-ok flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                                )}
                                <span className="font-medium">{check.name}</span>
                                {check.detail && <span className="text-muted">({check.detail})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-panel2 p-3 rounded text-sm">
                        <p className="font-semibold mb-1">Why this person?</p>
                        <p className="text-muted">{result.engineResult.explanation}</p>
                      </div>

                      {result.engineResult.alternatives.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Alternative Candidates:</p>
                          <div className="space-y-2">
                            {result.engineResult.alternatives.map((alt: any, idx: number) => (
                              <div key={idx} className="text-sm border-l-2 border-muted pl-3 py-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{alt.name} (#{alt.emp_no})</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={alt.pay_basis === 'OVERTIME' ? 'destructive' : 'outline'} className="text-xs">
                                      {alt.pay_basis === 'OVERTIME' ? 'OT' : 'ST'}
                                    </Badge>
                                    <span className="text-muted">Rank #{alt.seniority_rank}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-muted">{alt.step_name}</div>
                                {alt.is_diversion && <span className="text-xs text-warning">⚠ Diversion</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button onClick={handleApplyRecommendation} className="w-full">
                        Apply This Assignment
                      </Button>
                    </>
                  ) : (
                    <div className="bg-danger/10 border border-danger rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-danger" />
                        <p className="font-semibold">No Eligible Candidates</p>
                      </div>
                      <p className="text-sm text-muted">{result.engineResult.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cascade Chain Display */}
              {cascadeResult && (
                <CascadeDisplay cascade={cascadeResult} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
