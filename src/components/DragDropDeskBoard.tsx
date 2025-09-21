import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

// Types
interface Desk {
  id: number;
  code: string;
  name: string;
  territory?: string;
}

interface Trick {
  id: number;
  desk_id: number;
  name: string;
  shift_start: string;
  shift_end: string;
  timezone: string;
}

interface Dispatcher {
  id: number;
  badge: string;
  first_name: string;
  last_name: string;
  rank?: string;
}

interface Assignment {
  id: number;
  dispatcher_id: number;
  source: string;
  requires_trainer: boolean;
  trainer_id?: number;
  created_at: string;
  deleted_at?: string;
  dispatchers: Dispatcher;
}

interface TrickInstance {
  id: number;
  trick_id: number;
  starts_at: string;
  ends_at: string;
  is_holiday: boolean;
  tricks: Trick;
  assignments: Assignment[];
}

interface DraggableDispatcher {
  id: number;
  badge: string;
  name: string;
  rank?: string;
  qualifications: number[]; // desk IDs
}

export const DragDropDeskBoard = () => {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [schedule, setSchedule] = useState<TrickInstance[]>([]);
  const [dispatchers, setDispatchers] = useState<DraggableDispatcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedDispatcher, setDraggedDispatcher] = useState<DraggableDispatcher | null>(null);
  const [optimisticAssignments, setOptimisticAssignments] = useState<Map<number, { 
    dispatcher: DraggableDispatcher; 
    status: 'pending' | 'success' | 'error'; 
    error?: string 
  }>>(new Map());
  
  const { toast } = useToast();

  // Date range for current week
  const now = new Date();
  const startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const fetchDesks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('desks');
      if (error) throw error;
      setDesks(data || []);
      if (data && data.length > 0) {
        setSelectedDesk(data[0]);
      }
    } catch (error) {
      console.error('Error fetching desks:', error);
      toast({
        title: "Error",
        description: "Failed to load desks",
        variant: "destructive",
      });
    }
  };

  const fetchSchedule = async (deskId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke(`desks/${deskId}/schedule?start=${startDate}&end=${endDate}`);
      if (error) throw error;
      setSchedule(data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: "Error", 
        description: "Failed to load schedule",
        variant: "destructive",
      });
    }
  };

  const fetchDispatchers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('dispatchers');
      if (error) throw error;
      
      // Transform dispatcher data to include qualifications
      const dispatchersWithQualifications = (data || []).map((dispatcher: any) => ({
        id: dispatcher.id,
        badge: dispatcher.badge,
        name: `${dispatcher.first_name} ${dispatcher.last_name}`,
        rank: dispatcher.rank,
        qualifications: dispatcher.qualifications?.map((q: any) => q.desk_id) || []
      }));
      
      setDispatchers(dispatchersWithQualifications);
    } catch (error) {
      console.error('Error fetching dispatchers:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDesks(), fetchDispatchers()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedDesk) {
      fetchSchedule(selectedDesk.id);
    }
  }, [selectedDesk, startDate, endDate]);

  const handleDragStart = (event: DragStartEvent) => {
    const dispatcher = dispatchers.find(d => d.id.toString() === event.active.id);
    setDraggedDispatcher(dispatcher || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedDispatcher(null);

    if (!over) return;

    const dispatcherId = parseInt(active.id.toString());
    const trickInstanceId = parseInt(over.id.toString());
    
    const dispatcher = dispatchers.find(d => d.id === dispatcherId);
    const trickInstance = schedule.find(ti => ti.id === trickInstanceId);

    if (!dispatcher || !trickInstance) return;

    // Check if dispatcher is qualified for this desk
    if (!dispatcher.qualifications.includes(trickInstance.tricks.desk_id)) {
      toast({
        title: "Error",
        description: "Dispatcher is not qualified for this desk",
        variant: "destructive",
      });
      return;
    }

    // Check if position is already occupied
    const hasActiveAssignment = trickInstance.assignments.some(a => !a.deleted_at);
    if (hasActiveAssignment) {
      toast({
        title: "Error",
        description: "Position is already occupied",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    setOptimisticAssignments(prev => new Map(prev.set(trickInstanceId, {
      dispatcher,
      status: 'pending'
    })));

    try {
      const { data, error } = await supabase.functions.invoke('assignments', {
        method: 'POST',
        body: {
          trick_instance_id: trickInstanceId,
          dispatcher_id: dispatcherId,
          source: 'BASE'
        }
      });

      if (error) {
        let errorMessage = 'Failed to create assignment';
        if (error.message?.includes('409')) {
          errorMessage = 'Assignment conflict detected';
        } else if (error.message?.includes('422')) {
          errorMessage = 'Dispatcher not qualified or requires trainer';
        } else if (error.message?.includes('400')) {
          errorMessage = 'Dispatcher has absence overlap';
        }
        
        throw new Error(errorMessage);
      }

      // Update optimistic assignment to success
      setOptimisticAssignments(prev => new Map(prev.set(trickInstanceId, {
        dispatcher,
        status: 'success'
      })));

      // Refresh the schedule after successful assignment
      if (selectedDesk) {
        await fetchSchedule(selectedDesk.id);
      }

      // Clear optimistic assignment after refresh
      setTimeout(() => {
        setOptimisticAssignments(prev => {
          const newMap = new Map(prev);
          newMap.delete(trickInstanceId);
          return newMap;
        });
      }, 1000);

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

    } catch (error: any) {
      console.error('Error creating assignment:', error);
      
      // Update optimistic assignment to error
      setOptimisticAssignments(prev => new Map(prev.set(trickInstanceId, {
        dispatcher,
        status: 'error',
        error: error.message
      })));

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });

      // Clear error after 3 seconds
      setTimeout(() => {
        setOptimisticAssignments(prev => {
          const newMap = new Map(prev);
          newMap.delete(trickInstanceId);
          return newMap;
        });
      }, 3000);
    }
  };

  const getAssignmentStatus = (instance: TrickInstance) => {
    const optimistic = optimisticAssignments.get(instance.id);
    if (optimistic) {
      return optimistic.status;
    }

    const activeAssignment = instance.assignments.find(a => !a.deleted_at);
    if (activeAssignment) {
      if (activeAssignment.requires_trainer) return 'TRAINEE';
      if (activeAssignment.source === 'HOLD_DOWN') return 'HOLD-DOWN';
      return 'ASSIGNED';
    }
    return 'VACANT';
  };

  const renderAssignmentCell = (instance: TrickInstance) => {
    const optimistic = optimisticAssignments.get(instance.id);
    const status = getAssignmentStatus(instance);
    
    if (optimistic) {
      const { dispatcher, status: optStatus, error } = optimistic;
      
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
      let displayText = dispatcher.badge;
      
      if (optStatus === 'pending') {
        badgeVariant = "outline";
        displayText += " (Pending...)";
      } else if (optStatus === 'error') {
        badgeVariant = "destructive";
        displayText += " (Error)";
      } else if (optStatus === 'success') {
        badgeVariant = "default";
        displayText += " (Success)";
      }
      
      return (
        <div className="space-y-1">
          <Badge variant={badgeVariant} className="text-xs">
            {displayText}
          </Badge>
          {error && (
            <div className="text-xs text-red-600">{error}</div>
          )}
        </div>
      );
    }

    const activeAssignment = instance.assignments.find(a => !a.deleted_at);
    
    if (activeAssignment) {
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
      let statusText = "";
      
      if (status === 'TRAINEE') {
        badgeVariant = "secondary";
        statusText = " (Trainee)";
      } else if (status === 'HOLD-DOWN') {
        badgeVariant = "outline";
        statusText = " (Hold-Down)";
      }
      
      return (
        <Badge variant={badgeVariant} className="text-xs">
          {activeAssignment.dispatchers.badge}{statusText}
        </Badge>
      );
    }

    // Vacant cell - droppable
    return (
      <div 
        className="min-h-[24px] border-2 border-dashed border-muted-foreground/25 rounded p-1 text-xs text-muted-foreground text-center bg-muted/10"
        style={{ minHeight: '40px' }}
      >
        Drop dispatcher here
      </div>
    );
  };

  const renderDispatcherChip = (dispatcher: DraggableDispatcher) => (
    <Badge
      key={dispatcher.id}
      variant="outline"
      className="cursor-grab active:cursor-grabbing hover:bg-accent p-2 m-1"
      style={{ 
        transform: draggedDispatcher?.id === dispatcher.id ? 'rotate(5deg)' : 'none',
        opacity: draggedDispatcher?.id === dispatcher.id ? 0.5 : 1 
      }}
    >
      {dispatcher.badge} - {dispatcher.name}
      {dispatcher.rank && <span className="ml-1 text-xs">({dispatcher.rank})</span>}
    </Badge>
  );

  const renderScheduleGrid = () => {
    if (!selectedDesk || schedule.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No schedule data available</div>;
    }

    // Group by trick and day
    const tricks = schedule.reduce((acc, instance) => {
      if (!acc[instance.trick_id]) {
        acc[instance.trick_id] = {
          trick: instance.tricks,
          instances: []
        };
      }
      acc[instance.trick_id].instances.push(instance);
      return acc;
    }, {} as Record<number, { trick: Trick; instances: TrickInstance[] }>);

    // Get week days
    const weekDays = Array.from({ length: 7 }, (_, i) => 
      addDays(startOfWeek(new Date(startDate), { weekStartsOn: 1 }), i)
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-2 text-sm font-medium">
          <div>Trick</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-center">
              {format(day, 'EEE MM/dd')}
            </div>
          ))}
        </div>
        
        {Object.values(tricks).map(({ trick, instances }) => (
          <div key={trick.id} className="grid grid-cols-8 gap-2 items-center">
            <div className="font-medium text-sm">
              {trick.name}
              <div className="text-xs text-muted-foreground">
                {trick.shift_start} - {trick.shift_end}
              </div>
            </div>
            
            {weekDays.map(day => {
              const dayString = format(day, 'yyyy-MM-dd');
              const instance = instances.find(inst => 
                inst.starts_at.startsWith(dayString)
              );
              
              return (
                <div
                  key={`${trick.id}-${dayString}`}
                  id={instance?.id.toString()}
                  className="min-h-[60px] border rounded p-2 bg-card hover:bg-accent/50 transition-colors"
                  data-droppable={instance && getAssignmentStatus(instance) === 'VACANT'}
                >
                  {instance ? renderAssignmentCell(instance) : (
                    <div className="text-xs text-muted-foreground">No shift</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Available Dispatchers */}
        <Card>
          <CardHeader>
            <CardTitle>Available Dispatchers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dispatchers.map(dispatcher => (
                <div
                  key={dispatcher.id}
                  draggable
                  id={dispatcher.id.toString()}
                  data-draggable
                >
                  {renderDispatcherChip(dispatcher)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <p className="text-sm text-muted-foreground">
                {startDate} to {endDate}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedDesk?.code || ''} onValueChange={(value) => {
              const desk = desks.find(d => d.code === value);
              if (desk) setSelectedDesk(desk);
            }}>
              <TabsList className="grid w-full grid-cols-4">
                {desks.map(desk => (
                  <TabsTrigger key={desk.id} value={desk.code}>
                    {desk.code}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {desks.map(desk => (
                <TabsContent key={desk.id} value={desk.code} className="mt-6">
                  {renderScheduleGrid()}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <DragOverlay>
        {draggedDispatcher ? renderDispatcherChip(draggedDispatcher) : null}
      </DragOverlay>
    </DndContext>
  );
};