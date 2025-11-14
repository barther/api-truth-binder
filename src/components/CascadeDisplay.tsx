import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

interface CascadeStep {
  stepNumber: number
  vacancySlotId: number
  filledByEmployee: {
    id: number
    emp_no: string
    name: string
    seniority_rank: number
    step_name: string
    pay_basis: string
  } | null
  sourceStep: string
  isDiversion: boolean
  divertedFromSlotId?: number
  createdVacancySlotId?: number
  resolved: boolean
  notes: string
}

interface CascadeResult {
  cascadeId: number
  rootVacancySlotId: number
  steps: CascadeStep[]
  resolved: boolean
  resolutionDepth: number
  finalStatus: 'RESOLVED' | 'PARTIAL' | 'FAILED' | 'MAX_DEPTH'
}

interface CascadeDisplayProps {
  cascade: CascadeResult
}

export function CascadeDisplay({ cascade }: CascadeDisplayProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle2 className="w-5 h-5 text-ok" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-danger" />
      case 'MAX_DEPTH':
      case 'PARTIAL':
        return <AlertTriangle className="w-5 h-5 text-warning" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-ok/10 border-ok'
      case 'FAILED':
        return 'bg-danger/10 border-danger'
      case 'MAX_DEPTH':
      case 'PARTIAL':
        return 'bg-warning/10 border-warning'
      default:
        return ''
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'All positions filled'
      case 'FAILED':
        return 'Could not fill all positions'
      case 'PARTIAL':
        return 'Some positions remain unfilled'
      case 'MAX_DEPTH':
        return 'Cascade too deep - stopped at max depth'
      default:
        return status
    }
  }

  return (
    <div className="space-y-4">
      {/* Cascade Summary */}
      <Card className={getStatusColor(cascade.finalStatus)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(cascade.finalStatus)}
              <CardTitle>
                Cascade Resolution {cascade.resolved ? 'Complete' : 'Incomplete'}
              </CardTitle>
            </div>
            <Badge variant={cascade.finalStatus === 'RESOLVED' ? 'default' : 'destructive'}>
              {cascade.finalStatus}
            </Badge>
          </div>
          <CardDescription>
            {getStatusText(cascade.finalStatus)} • Depth: {cascade.resolutionDepth} level{cascade.resolutionDepth !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Cascade Chain */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Coverage Chain:</h3>
        {cascade.steps.map((step, index) => (
          <div key={index} className="relative">
            {/* Connector Arrow */}
            {index > 0 && (
              <div className="absolute -top-3 left-8 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-muted" />
              </div>
            )}

            {/* Step Card */}
            <Card className={step.resolved ? 'border-ok/50' : 'border-warning/50'}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {/* Step Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-panel2 flex items-center justify-center font-semibold text-sm">
                      {step.stepNumber}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-grow space-y-2">
                    {step.filledByEmployee ? (
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{step.filledByEmployee.name}</p>
                            <p className="text-sm text-muted">
                              Emp #{step.filledByEmployee.emp_no} • Rank #{step.filledByEmployee.seniority_rank}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={step.filledByEmployee.pay_basis === 'OVERTIME' ? 'destructive' : 'default'} className="text-xs">
                              {step.filledByEmployee.pay_basis === 'OVERTIME' ? 'OT' : 'ST'}
                            </Badge>
                            {step.resolved ? (
                              <CheckCircle2 className="w-4 h-4 text-ok" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-warning" />
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-info bg-info/10 rounded px-2 py-1">
                          {step.filledByEmployee.step_name}
                        </div>

                        {step.isDiversion && (
                          <div className="text-xs text-warning bg-warning/10 border border-warning/20 rounded px-2 py-1">
                            <span className="font-semibold">⚠ DIVERSION</span>
                            {step.createdVacancySlotId && (
                              <span className="ml-1">
                                - Creates backfill vacancy (covered in step {step.stepNumber + 1})
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-danger">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold">No Coverage Available</span>
                        </div>
                        <p className="text-xs text-muted">{step.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{cascade.steps.length}</p>
              <p className="text-xs text-muted">Total Steps</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ok">{cascade.steps.filter(s => s.resolved).length}</p>
              <p className="text-xs text-muted">Filled</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                {cascade.steps.filter(s => s.isDiversion).length}
              </p>
              <p className="text-xs text-muted">Diversions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning if cascade hit max depth */}
      {cascade.finalStatus === 'MAX_DEPTH' && (
        <Card className="bg-warning/10 border-warning">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning">Maximum Cascade Depth Reached</p>
                <p className="text-sm text-muted mt-1">
                  The cascade was stopped at {cascade.resolutionDepth} levels to prevent infinite loops.
                  This indicates a serious shortage of available dispatchers. Some positions remain unfilled.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
