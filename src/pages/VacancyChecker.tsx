import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

interface Vacancy {
  schedule_slot_id: number;
  local_date: string;
  trick_code: string;
  desk_name: string;
  shift_name: string;
  division_name: string;
  vacancy_reason: string;
  primary_employee_id?: number;
}

interface Recommendation {
  employee_id: number;
  emp_no: string;
  name: string;
  seniority_rank: number;
  source: string;
  band: string;
  cost: number;
  rest_hours: number;
  rule_trace: any;
}

interface EngineResult {
  slot: any;
  recommendation: Recommendation | null;
  alternatives: any[];
  explanation: string;
  eligible_count: number;
  ineligible_reasons: any[];
}

export default function VacancyChecker() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_vacancies')
        .select('*')
        .gte('local_date', new Date().toISOString().split('T')[0])
        .order('local_date', { ascending: true });

      if (error) throw error;
      setVacancies(data || []);
    } catch (error: any) {
      toast.error('Failed to load vacancies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeVacancy = async (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setAnalyzing(true);
    setEngineResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('coverage-engine', {
        body: { slot_id: vacancy.schedule_slot_id }
      });

      if (error) throw error;
      setEngineResult(data);
    } catch (error: any) {
      toast.error('Failed to analyze vacancy: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyAssignment = async (recommendation: Recommendation) => {
    try {
      const { data, error } = await supabase.functions.invoke('apply-assignment', {
        body: {
          slot_id: selectedVacancy?.schedule_slot_id,
          employee_id: recommendation.employee_id,
          source: recommendation.source,
          notes: `Applied via algorithm - ${recommendation.band} (cost: ${recommendation.cost})`
        }
      });

      if (error) throw error;
      toast.success(`Assigned ${recommendation.name} to ${selectedVacancy?.trick_code}`);
      loadVacancies();
      setSelectedVacancy(null);
      setEngineResult(null);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vacancy Checker</h1>
          <p className="text-muted mt-1">Algorithm-based assignment recommendations</p>
        </div>
        <Button onClick={loadVacancies} variant="outline">
          Refresh
        </Button>
      </div>

      {vacancies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-ok" />
            <p className="text-xl font-semibold">No vacancies found!</p>
            <p className="text-muted mt-2">All slots are covered for upcoming dates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vacancy List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Open Vacancies ({vacancies.length})</h2>
            {vacancies.map((vacancy) => (
              <Card
                key={vacancy.schedule_slot_id}
                className={`cursor-pointer hover:border-info transition-colors ${
                  selectedVacancy?.schedule_slot_id === vacancy.schedule_slot_id ? 'border-info' : ''
                }`}
                onClick={() => analyzeVacancy(vacancy)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{vacancy.trick_code}</CardTitle>
                      <CardDescription>{vacancy.desk_name}</CardDescription>
                    </div>
                    <Badge variant="destructive" className="badge-vacant">
                      {vacancy.vacancy_reason.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span>{new Date(vacancy.local_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{vacancy.shift_name}</span>
                    <span>•</span>
                    <span>{vacancy.division_name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analysis Result */}
          <div className="space-y-4 sticky top-6 h-fit">
            {!selectedVacancy ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted" />
                  <p className="text-muted">Select a vacancy to see algorithm recommendation</p>
                </CardContent>
              </Card>
            ) : analyzing ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-info" />
                  <p className="font-semibold">Running algorithm...</p>
                  <p className="text-sm text-muted mt-2">Analyzing candidates and applying contract rules</p>
                </CardContent>
              </Card>
            ) : engineResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Recommendation</CardTitle>
                  <CardDescription>
                    {engineResult.slot.trick} on {new Date(engineResult.slot.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {engineResult.recommendation ? (
                    <>
                      <div className="bg-ok/10 border border-ok rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-lg flex items-center gap-2">
                              <User className="w-5 h-5" />
                              {engineResult.recommendation.name}
                            </p>
                            <p className="text-sm text-muted">Emp #{engineResult.recommendation.emp_no}</p>
                          </div>
                          <Badge className="badge-covered">{engineResult.recommendation.band}</Badge>
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted">Seniority Rank:</span>
                            <span className="font-semibold">#{engineResult.recommendation.seniority_rank}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Rest Hours:</span>
                            <span className="font-semibold">{engineResult.recommendation.rest_hours}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Cost Score:</span>
                            <span className="font-semibold">{engineResult.recommendation.cost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Why this person?</p>
                        <p className="text-sm text-muted">{engineResult.explanation}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Rule Checks:</p>
                        <div className="space-y-1">
                          {engineResult.recommendation.rule_trace.checks.map((check: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {check.ok ? (
                                <CheckCircle2 className="w-4 h-4 text-ok" />
                              ) : (
                                <XCircle className="w-4 h-4 text-danger" />
                              )}
                              <span>{check.name}</span>
                              {check.detail && <span className="text-muted">({check.detail})</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {engineResult.alternatives.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Alternative Candidates:</p>
                          <div className="space-y-2">
                            {engineResult.alternatives.map((alt: any, idx: number) => (
                              <div key={idx} className="text-sm flex items-center justify-between border-l-2 border-muted pl-3 py-1">
                                <span>{alt.name} (#{alt.emp_no})</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{alt.band}</Badge>
                                  <span className="text-muted">Rank #{alt.seniority_rank}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => applyAssignment(engineResult.recommendation!)}
                        className="w-full"
                      >
                        Apply This Assignment
                      </Button>
                    </>
                  ) : (
                    <div className="bg-danger/10 border border-danger rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-danger" />
                        <p className="font-semibold">No Eligible Candidates</p>
                      </div>
                      <p className="text-sm text-muted mb-3">{engineResult.explanation}</p>
                      {engineResult.ineligible_reasons.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Why candidates were rejected:</p>
                          {engineResult.ineligible_reasons.map((reason: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              <p className="font-medium">{reason.name} (#{reason.emp_no})</p>
                              <ul className="list-disc list-inside text-muted ml-2">
                                {reason.reasons.map((r: string, ridx: number) => (
                                  <li key={ridx}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted pt-2 border-t">
                    Analyzed {engineResult.all_candidates_count} candidates, {engineResult.eligible_count} eligible
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
