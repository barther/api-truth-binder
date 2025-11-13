import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Division {
  id: number;
  code: string;
  name: string;
}

interface Shift {
  id: number;
  code: string;
  name: string;
}

interface Desk {
  id: number;
  code: string;
  name: string;
  division_id: number;
  active: boolean;
  division?: { code: string; name: string };
  tricks?: Trick[];
}

interface Trick {
  id: number;
  code: string;
  desk_id: number;
  shift_id: number;
  rest_day1: number;
  rest_day2: number;
  active: boolean;
  shift?: { code: string; name: string };
}

const WEEKDAYS = [
  { id: 1, name: 'Mon' },
  { id: 2, name: 'Tue' },
  { id: 3, name: 'Wed' },
  { id: 4, name: 'Thu' },
  { id: 5, name: 'Fri' },
  { id: 6, name: 'Sat' },
  { id: 7, name: 'Sun' }
];

export default function DeskAdmin() {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [deskDialogOpen, setDeskDialogOpen] = useState(false);
  const [trickDialogOpen, setTrickDialogOpen] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);

  const [deskForm, setDeskForm] = useState({
    code: '',
    name: '',
    division_id: '',
    active: true
  });

  const [trickForm, setTrickForm] = useState({
    shift_id: '',
    rest_day1: '',
    rest_day2: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load divisions
      const { data: divData } = await supabase
        .from('divisions')
        .select('*')
        .order('code');

      setDivisions(divData || []);

      // Load shifts
      const { data: shiftData } = await supabase
        .from('shifts')
        .select('*')
        .order('code');

      setShifts(shiftData || []);

      // Load desks with tricks
      const { data: deskData, error } = await supabase
        .from('desks')
        .select(`
          *,
          divisions(code, name),
          desk_tricks:desk_tricks(
            *,
            shifts(code, name)
          )
        `)
        .order('code');

      if (error) throw error;

      setDesks(deskData?.map(d => ({
        ...d,
        division: d.divisions,
        tricks: d.desk_tricks
      })) || []);
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('desks')
        .insert([{
          code: deskForm.code,
          name: deskForm.name,
          division_id: parseInt(deskForm.division_id),
          active: deskForm.active
        }]);

      if (error) throw error;
      toast.success('Desk added');
      setDeskDialogOpen(false);
      resetDeskForm();
      loadData();
    } catch (error: any) {
      toast.error('Failed to add desk: ' + error.message);
    }
  };

  const handleTrickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDesk) return;

    if (trickForm.rest_day1 === trickForm.rest_day2) {
      toast.error('Rest days must be different');
      return;
    }

    const shift = shifts.find(s => s.id === parseInt(trickForm.shift_id));
    const code = `${selectedDesk.code}-${shift?.code}`;

    try {
      const { error } = await supabase
        .from('desk_tricks')
        .insert([{
          desk_id: selectedDesk.id,
          shift_id: parseInt(trickForm.shift_id),
          code,
          rest_day1: parseInt(trickForm.rest_day1),
          rest_day2: parseInt(trickForm.rest_day2),
          active: true
        }]);

      if (error) throw error;
      toast.success('Trick added');
      setTrickDialogOpen(false);
      resetTrickForm();
      loadData();
    } catch (error: any) {
      toast.error('Failed to add trick: ' + error.message);
    }
  };

  const handleDeleteDesk = async (id: number) => {
    if (!confirm('Delete this desk and all its tricks?')) return;

    try {
      const { error } = await supabase
        .from('desks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Desk deleted');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleDeleteTrick = async (id: number) => {
    if (!confirm('Delete this trick?')) return;

    try {
      const { error } = await supabase
        .from('desk_tricks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Trick deleted');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const resetDeskForm = () => {
    setDeskForm({
      code: '',
      name: '',
      division_id: '',
      active: true
    });
  };

  const resetTrickForm = () => {
    setTrickForm({
      shift_id: '',
      rest_day1: '',
      rest_day2: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  // Group desks by division
  const desksByDivision = divisions.map(div => ({
    division: div,
    desks: desks.filter(d => d.division_id === div.id)
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Desk & Trick Management</h1>
          <p className="text-muted mt-1">Manage desks and their shift combinations</p>
        </div>
        <Dialog open={deskDialogOpen} onOpenChange={(open) => {
          setDeskDialogOpen(open);
          if (!open) resetDeskForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Desk
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Desk</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDeskSubmit} className="space-y-4">
              <div>
                <Label>Desk Code *</Label>
                <Input
                  required
                  value={deskForm.code}
                  onChange={e => setDeskForm({...deskForm, code: e.target.value.toUpperCase()})}
                  placeholder="EE3"
                />
              </div>
              <div>
                <Label>Desk Name *</Label>
                <Input
                  required
                  value={deskForm.name}
                  onChange={e => setDeskForm({...deskForm, name: e.target.value})}
                  placeholder="East End 3"
                />
              </div>
              <div>
                <Label>Division *</Label>
                <Select
                  value={deskForm.division_id}
                  onValueChange={value => setDeskForm({...deskForm, division_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(div => (
                      <SelectItem key={div.id} value={div.id.toString()}>
                        {div.code} - {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDeskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Desk</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {desksByDivision.map(({ division, desks: divDesks }) => (
        <Card key={division.id}>
          <CardHeader>
            <CardTitle>
              {division.code} - {division.name} ({divDesks.length} desks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {divDesks.length === 0 ? (
              <p className="text-muted text-center py-8">No desks in this division</p>
            ) : (
              <div className="space-y-4">
                {divDesks.map(desk => (
                  <div key={desk.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{desk.code} - {desk.name}</h3>
                        <p className="text-sm text-muted">{desk.tricks?.length || 0} tricks configured</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDesk(desk);
                            setTrickDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Trick
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDesk(desk.id)}
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </Button>
                      </div>
                    </div>

                    {desk.tricks && desk.tricks.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {desk.tricks.map(trick => (
                          <div key={trick.id} className="flex items-center justify-between p-3 bg-panel2 rounded border">
                            <div>
                              <p className="font-medium">{trick.code}</p>
                              <p className="text-xs text-muted">
                                Rest: {WEEKDAYS.find(w => w.id === trick.rest_day1)?.name},{' '}
                                {WEEKDAYS.find(w => w.id === trick.rest_day2)?.name}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTrick(trick.id)}
                            >
                              <Trash2 className="w-3 h-3 text-danger" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={trickDialogOpen} onOpenChange={(open) => {
        setTrickDialogOpen(open);
        if (!open) {
          resetTrickForm();
          setSelectedDesk(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Trick to {selectedDesk?.code}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTrickSubmit} className="space-y-4">
            <div>
              <Label>Shift *</Label>
              <Select
                value={trickForm.shift_id}
                onValueChange={value => setTrickForm({...trickForm, shift_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map(shift => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      {shift.code} - {shift.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rest Day 1 *</Label>
                <Select
                  value={trickForm.rest_day1}
                  onValueChange={value => setTrickForm({...trickForm, rest_day1: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map(day => (
                      <SelectItem key={day.id} value={day.id.toString()}>
                        {day.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rest Day 2 *</Label>
                <Select
                  value={trickForm.rest_day2}
                  onValueChange={value => setTrickForm({...trickForm, rest_day2: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map(day => (
                      <SelectItem key={day.id} value={day.id.toString()}>
                        {day.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTrickDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Trick</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
