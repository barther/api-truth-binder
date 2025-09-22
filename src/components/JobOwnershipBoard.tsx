import React, { useState, useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format, addDays, startOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Constants
const SUPABASE_URL = "https://rxvptkcgqftxfishbuta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dnB0a2NncWZ0eGZpc2hidXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTUzNDUsImV4cCI6MjA3NDA3MTM0NX0.OO-RHz8LWiLlS_C_veIZpRWJB3aPUdfZ5-9NSPltHbE";

// Types from the prompt specification
type Division = 'Coastal' | 'Gulf' | 'Blue Ridge' | 'Midwest' | 'Great Lakes' | 'Keystone';
type AssignmentSource = 'BASE' | 'HOLD_DOWN' | 'ATW' | 'OVERTIME' | 'TRAINEE';

interface Dispatcher {
  id: string;
  emp_id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface Job {
  id: string;
  job_code: string;
  trick_id: string;
  desk_id: string;
  shift: string;
  work_days: number[];
  desk: {
    id: string;
    code: string;
    name: string;
    division: Division;
  };
}

interface DerivedCell {
  kind: 'explicit' | 'implicitBase' | 'vacancy';
  source?: string;
  dispatcher?: Dispatcher;
  notes?: string;
  requires_trainer?: boolean;
}

interface ScheduleEntry {
  job: Job;
  cell: DerivedCell;
  service_date: string;
}

interface AssignmentDialogState {
  open: boolean;
  dispatcher?: Dispatcher;
  job?: Job;
  date?: string;
}

const JobOwnershipBoard: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDivision, setSelectedDivision] = useState<Division | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [assignmentDialog, setAssignmentDialog] = useState<AssignmentDialogState>({ open: false });
  const [selectedAction, setSelectedAction] = useState<'owner' | 'coverage'>('coverage');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [source, setSource] = useState<Exclude<AssignmentSource, 'BASE'>>('HOLD_DOWN');
  const [requiresTrainer, setRequiresTrainer] = useState(false);

  const divisions: (Division | 'all')[] = [
    'all', 'Coastal', 'Gulf', 'Blue Ridge', 'Midwest', 'Great Lakes', 'Keystone'
  ];

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  useEffect(() => {
    loadDispatchers();
    loadScheduleForWeek();
  }, [currentWeek, selectedDivision]);

  const loadDispatchers = async () => {
    const { data, error } = await supabase
      .from('dispatchers')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('seniority_date');

    if (error) {
      console.error('Error loading dispatchers:', error);
      toast.error('Failed to load dispatchers');
      return;
    }

    setDispatchers(data as Dispatcher[] || []);
  };

  const loadScheduleForWeek = async () => {
    setLoading(true);
    const schedulePromises = weekDays.map(async (date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase.functions.invoke('schedule', {
        body: {},
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) {
        console.error(`Error loading schedule for ${dateStr}:`, error);
        return [];
      }

      // Call the schedule API endpoint
      const response = await fetch(`${SUPABASE_URL}/functions/v1/schedule/date/${dateStr}${selectedDivision !== 'all' ? `?division=${selectedDivision}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch schedule for ${dateStr}`);
        return [];
      }

      const result = await response.json();
      return result.schedule || [];
    });

    try {
      const weekSchedule = await Promise.all(schedulePromises);
      setSchedule(weekSchedule.flat());
    } catch (error) {
      console.error('Error loading week schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (dispatcher: Dispatcher, job: Job, date: string) => {
    setAssignmentDialog({
      open: true,
      dispatcher,
      job,
      date
    });
    setStartDate(date);
  };

  const handleAssignmentSubmit = async () => {
    const { dispatcher, job, date } = assignmentDialog;
    if (!dispatcher || !job || !date) return;

    try {
      if (selectedAction === 'owner') {
        // Set ownership
        const response = await fetch(`${SUPABASE_URL}/functions/v1/schedule/ownership`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            job_id: job.id,
            dispatcher_id: dispatcher.id,
            start_date: startDate,
            source: 'BID'
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to set owner');
        }

        toast.success(`${dispatcher.first_name} ${dispatcher.last_name} is now the owner of ${job.job_code}`);
      } else {
        // Set coverage assignment
        const response = await fetch(`${SUPABASE_URL}/functions/v1/schedule/assignment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            job_id: job.id,
            service_date: date,
            dispatcher_id: dispatcher.id,
            source,
            requires_trainer: requiresTrainer
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to set coverage');
        }

        toast.success(`${dispatcher.first_name} ${dispatcher.last_name} assigned to cover ${job.job_code} on ${format(new Date(date), 'MMM d')}`);
      }

      setAssignmentDialog({ open: false });
      loadScheduleForWeek(); // Refresh
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast.error(error.message);
    }
  };

  const renderCell = (job: Job, date: string) => {
    const entry = schedule.find(s => s.job.id === job.id && s.service_date === format(date, 'yyyy-MM-dd'));
    const cell = entry?.cell;

    if (!cell || cell.kind === 'vacancy') {
      return (
        <div className="p-2 border-2 border-dashed border-muted-foreground/20 rounded text-center text-sm text-muted-foreground min-h-[60px] flex items-center justify-center">
          Drop dispatcher here
        </div>
      );
    }

    const badgeVariant = cell.kind === 'implicitBase' ? 'outline' : 
      cell.source === 'HOLD_DOWN' ? 'destructive' :
      cell.source === 'ATW' ? 'secondary' :
      cell.source === 'OVERTIME' ? 'default' :
      cell.source === 'TRAINEE' ? 'outline' : 'default';

    return (
      <div className="p-2 border rounded bg-background min-h-[60px]">
        <div className="text-sm font-medium">
          {cell.dispatcher?.first_name} {cell.dispatcher?.last_name}
        </div>
        <Badge variant={badgeVariant} className="text-xs">
          {cell.source}
        </Badge>
        {cell.requires_trainer && (
          <Badge variant="outline" className="text-xs ml-1">
            Trainer Req.
          </Badge>
        )}
        {cell.notes && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {cell.notes}
          </div>
        )}
      </div>
    );
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const dispatcherId = result.draggableId;
    const [jobId, dateStr] = result.destination.droppableId.split('|');
    
    const dispatcher = dispatchers.find(d => d.id === dispatcherId);
    const entry = schedule.find(s => s.job.id === jobId && s.service_date === dateStr);
    
    if (dispatcher && entry) {
      handleDrop(dispatcher, entry.job, dateStr);
    }
  };

  // Get unique jobs for the current selection
  const jobs = Array.from(new Set(schedule.map(s => s.job.id)))
    .map(jobId => schedule.find(s => s.job.id === jobId)?.job)
    .filter(Boolean) as Job[];

  if (loading) {
    return <div className="p-8 text-center">Loading schedule...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Ownership & Assignment Board</h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedDivision} onValueChange={(value: Division | 'all') => setSelectedDivision(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {divisions.map(division => (
                <SelectItem key={division} value={division}>
                  {division === 'all' ? 'All Divisions' : division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setCurrentWeek(prev => addDays(prev, -7))}>
              Previous Week
            </Button>
            <Button variant="outline" onClick={() => setCurrentWeek(prev => addDays(prev, 7))}>
              Next Week
            </Button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-12 gap-4">
          {/* Available Dispatchers */}
          <Card className="col-span-3 p-4">
            <h3 className="font-semibold mb-4">Available Dispatchers</h3>
            <Droppable droppableId="dispatchers" type="DISPATCHER">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {dispatchers.map((dispatcher, index) => (
                    <Draggable
                      key={dispatcher.id}
                      draggableId={dispatcher.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-2 bg-primary/10 rounded cursor-move hover:bg-primary/20"
                        >
                          <div className="text-sm font-medium">
                            {dispatcher.first_name} {dispatcher.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dispatcher.emp_id}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Card>

          {/* Schedule Grid */}
          <div className="col-span-9">
            <div className="grid grid-cols-8 gap-2">
              {/* Header */}
              <div className="font-semibold p-2">Job</div>
              {weekDays.map(date => (
                <div key={date.toISOString()} className="font-semibold p-2 text-center">
                  <div>{format(date, 'EEE')}</div>
                  <div className="text-sm text-muted-foreground">{format(date, 'M/d')}</div>
                </div>
              ))}

              {/* Job Rows */}
              {jobs.map(job => (
                <React.Fragment key={job.id}>
                  <div className="p-2 font-medium text-sm">
                    <div>{job.job_code}</div>
                    <div className="text-xs text-muted-foreground">
                      {job.desk.name} - {job.shift}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {job.desk.division}
                    </Badge>
                  </div>
                  {weekDays.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert to 1-7 (Mon-Sun)
                    
                    // Only show cells for days the job actually works
                    if (!job.work_days.includes(dayOfWeek)) {
                      return (
                        <div key={dateStr} className="p-2 bg-muted/20 text-center text-xs text-muted-foreground">
                          Off
                        </div>
                      );
                    }

                    return (
                      <Droppable
                        key={`${job.id}|${dateStr}`}
                        droppableId={`${job.id}|${dateStr}`}
                        type="DISPATCHER"
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="min-h-[60px]"
                          >
                            {renderCell(job, dateStr)}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialog.open} onOpenChange={(open) => setAssignmentDialog({ open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Assign {assignmentDialog.dispatcher?.first_name} {assignmentDialog.dispatcher?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Job: {assignmentDialog.job?.job_code}<br />
              Date: {assignmentDialog.date ? format(new Date(assignmentDialog.date), 'EEEE, MMMM d, yyyy') : ''}
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">What do you want to do?</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="owner"
                    name="action"
                    value="owner"
                    checked={selectedAction === 'owner'}
                    onChange={(e) => setSelectedAction(e.target.value as 'owner' | 'coverage')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="owner" className="font-medium">
                    Make this dispatcher the OWNER of this job
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="coverage"
                    name="action"
                    value="coverage"
                    checked={selectedAction === 'coverage'}
                    onChange={(e) => setSelectedAction(e.target.value as 'owner' | 'coverage')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="coverage" className="font-medium">
                    Assign this dispatcher to COVER this date only
                  </Label>
                </div>
              </div>

              {selectedAction === 'owner' && (
                <div className="space-y-2">
                  <Label htmlFor="startDate">Ownership starts on:</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              )}

              {selectedAction === 'coverage' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="source">Coverage type:</Label>
                    <Select value={source} onValueChange={(value: Exclude<AssignmentSource, 'BASE'>) => setSource(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOLD_DOWN">Hold Down</SelectItem>
                        <SelectItem value="OVERTIME">Overtime</SelectItem>
                        <SelectItem value="TRAINEE">Trainee</SelectItem>
                        <SelectItem value="ATW">Around The World</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trainer"
                      checked={requiresTrainer}
                      onCheckedChange={(checked) => setRequiresTrainer(checked === true)}
                    />
                    <Label htmlFor="trainer" className="text-sm">
                      Requires trainer supervision
                    </Label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setAssignmentDialog({ open: false })}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleAssignmentSubmit}
              >
                {selectedAction === 'owner' ? 'Set Owner' : 'Assign Coverage'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobOwnershipBoard;