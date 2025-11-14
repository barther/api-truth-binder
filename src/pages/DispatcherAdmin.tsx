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

interface Dispatcher {
  id: number;
  emp_no: string;
  first_name: string;
  last_name: string;
  seniority_date: string;
  hire_date: string;
  status: string;
  email?: string;
  phone?: string;
  seniority_rank?: number;
  job_assignment?: string;
  board_assignment?: string;
}

export default function DispatcherAdmin() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState<Dispatcher | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  const [formData, setFormData] = useState({
    emp_no: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    seniority_date: '',
    hire_date: '',
    status: 'ACTIVE',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadDispatchers();
  }, []);

  const loadDispatchers = async () => {
    setLoading(true);
    try {
      // Get dispatchers with seniority rank
      const { data: rankData, error: rankError } = await supabase
        .from('v_seniority_rank')
        .select('*')
        .order('seniority_rank', { ascending: true });

      if (rankError) throw rankError;

      // Get job assignments
      const { data: jobData } = await supabase
        .from('job_ownerships')
        .select(`
          employee_id,
          desk_tricks!inner(code)
        `)
        .is('end_date', null);

      // Get board assignments
      const { data: boardData } = await supabase
        .from('board_memberships')
        .select(`
          employee_id,
          boards!inner(name)
        `)
        .is('end_date', null);

      // Merge data
      const dispatchers = rankData?.map(d => ({
        ...d,
        job_assignment: jobData?.find(j => j.employee_id === d.employee_id)?.desk_tricks?.code,
        board_assignment: boardData?.find(b => b.employee_id === d.employee_id)?.boards?.name
      })) || [];

      setDispatchers(dispatchers);
    } catch (error: any) {
      toast.error('Failed to load dispatchers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDispatcher) {
        // Update existing
        const { error } = await supabase
          .from('employees')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDispatcher.id);

        if (error) throw error;
        toast.success('Dispatcher updated');
      } else {
        // Create new
        const { error } = await supabase
          .from('employees')
          .insert([formData]);

        if (error) throw error;
        toast.success('Dispatcher added');
      }

      setDialogOpen(false);
      setEditingDispatcher(null);
      resetForm();
      loadDispatchers();
    } catch (error: any) {
      toast.error('Failed to save dispatcher: ' + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dispatcher?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Dispatcher deleted');
      loadDispatchers();
    } catch (error: any) {
      toast.error('Failed to delete dispatcher: ' + error.message);
    }
  };

  const handleEdit = (dispatcher: Dispatcher) => {
    setEditingDispatcher(dispatcher);
    setFormData({
      emp_no: dispatcher.emp_no,
      first_name: dispatcher.first_name,
      last_name: dispatcher.last_name,
      middle_name: '',
      suffix: '',
      seniority_date: dispatcher.seniority_date,
      hire_date: dispatcher.hire_date || dispatcher.seniority_date,
      status: dispatcher.status,
      email: dispatcher.email || '',
      phone: dispatcher.phone || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      emp_no: '',
      first_name: '',
      last_name: '',
      middle_name: '',
      suffix: '',
      seniority_date: '',
      hire_date: '',
      status: 'ACTIVE',
      email: '',
      phone: ''
    });
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    const records = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const record: any = {};
      headers.forEach((header, i) => {
        record[header] = values[i];
      });
      return record;
    });

    try {
      const { error } = await supabase
        .from('employees')
        .insert(records);

      if (error) throw error;
      toast.success(`Imported ${records.length} dispatchers`);
      setCsvImportOpen(false);
      loadDispatchers();
    } catch (error: any) {
      toast.error('Failed to import: ' + error.message);
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
          <h1 className="text-3xl font-bold">Dispatcher Management</h1>
          <p className="text-muted mt-1">Add, edit, and manage all dispatchers</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Dispatchers from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>CSV Format:</Label>
                  <pre className="text-xs bg-panel2 p-3 rounded mt-2 overflow-x-auto">
emp_no,first_name,last_name,seniority_date,hire_date,status,email,phone{'\n'}
1001,James,Anderson,2010-03-15,2009-08-01,ACTIVE,james@ns.com,555-0101
                  </pre>
                </div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingDispatcher(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Dispatcher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDispatcher ? 'Edit Dispatcher' : 'Add New Dispatcher'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee Number *</Label>
                    <Input
                      required
                      value={formData.emp_no}
                      onChange={e => setFormData({...formData, emp_no: e.target.value})}
                      placeholder="1001"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="LEAVE">Leave</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="RETIRED">Retired</SelectItem>
                        <SelectItem value="RESIGNED">Resigned</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      required
                      value={formData.first_name}
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      required
                      value={formData.last_name}
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Seniority Date *</Label>
                    <Input
                      required
                      type="date"
                      value={formData.seniority_date}
                      onChange={e => setFormData({...formData, seniority_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Hire Date</Label>
                    <Input
                      type="date"
                      value={formData.hire_date}
                      onChange={e => setFormData({...formData, hire_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDispatcher ? 'Update' : 'Add'} Dispatcher
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dispatchers.length} Dispatchers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dispatchers.map((dispatcher) => (
              <div
                key={dispatcher.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-panel transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-base font-bold min-w-[50px] justify-center">
                    #{dispatcher.seniority_rank}
                  </Badge>
                  <div>
                    <p className="font-semibold text-lg">
                      {dispatcher.last_name}, {dispatcher.first_name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <span>Emp #{dispatcher.emp_no}</span>
                      <span>•</span>
                      <span>Seniority: {new Date(dispatcher.seniority_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {dispatcher.job_assignment && (
                    <Badge className="bg-ok text-white">Job: {dispatcher.job_assignment}</Badge>
                  )}
                  {dispatcher.board_assignment && (
                    <Badge className="bg-info text-white">Board: {dispatcher.board_assignment}</Badge>
                  )}
                  {!dispatcher.job_assignment && !dispatcher.board_assignment && (
                    <Badge variant="outline" className="text-muted">Unassigned</Badge>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(dispatcher)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(dispatcher.id)}
                  >
                    <Trash2 className="w-4 h-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
