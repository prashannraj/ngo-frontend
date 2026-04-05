'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, Plus, X } from 'lucide-react';

import { formatDate } from '@/lib/utils';

const entrySchema = z.object({
  task_id: z.number().min(1, 'Task is required'),
  date: z.string().min(1, 'Date is required'),
  hours_worked: z.number().min(0, 'Hours must be 0 or more'),
  description: z.string().optional(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

export default function TimesheetsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);

  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('me');

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }, []);

  const isEmployee = useMemo(() => user?.roles?.some((r: string) => r === 'Employee'), [user]);
  const isApprover = useMemo(
    () => user?.roles?.some((r: string) => ['Admin', 'HR', 'Project Manager'].includes(r)),
    [user],
  );

  const [openLog, setOpenLog] = useState(false);
  const [logging, setLogging] = useState(false);

  const entryForm = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      task_id: 1,
      date: new Date().toISOString().slice(0, 10),
      hours_worked: 1,
      description: '',
    },
  });

  const fetchTasks = async () => {
    const res = await api.get('/tasks?per_page=200');
    setTasks(res.data.data.data);
  };

  const fetchEmployees = async () => {
    const res = await api.get('/employees?per_page=200');
    setEmployees(res.data.data.data);
  };

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const params: any = {
        start_date: range.start,
        end_date: range.end,
        per_page: 100,
      };
      if (taskFilter !== 'all') params.task_id = taskFilter;
      if (!isEmployee && employeeFilter !== 'all') {
        params.employee_id = employeeFilter;
      }
      const res = await api.get('/timesheets', { params });
      setTimesheets(res.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchTasks().then(() => {
      if (!isEmployee) fetchEmployees();
      fetchTimesheets();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Refresh when filters change.
    fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskFilter, employeeFilter]);

  const statusVariant = (status: string) => {
    if (status === 'approved') return 'default';
    if (status === 'submitted') return 'secondary';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
  };

  const handleLog = async (values: z.infer<typeof entrySchema>) => {
    setLogging(true);
    try {
      await api.post('/timesheets', {
        task_id: values.task_id,
        date: values.date,
        hours_worked: values.hours_worked,
        description: values.description || '',
        status: 'submitted',
      });
      toast.success('Timesheet submitted');
      setOpenLog(false);
      entryForm.reset({
        task_id: 0,
        date: values.date,
        hours_worked: 1,
        description: '',
      });
      fetchTimesheets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit timesheet');
    } finally {
      setLogging(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/timesheets/${id}/approve`);
      toast.success('Timesheet approved');
      fetchTimesheets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/timesheets/${id}/reject`);
      toast.success('Timesheet rejected');
      fetchTimesheets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const openWithTask = (taskId: number) => {
    entryForm.setValue('task_id', taskId);
    setOpenLog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-500">Task-based timesheet logs and approvals.</p>
        </div>

        {isEmployee && (
          <Button className="flex items-center gap-2" onClick={() => setOpenLog(true)}>
            <Plus className="w-4 h-4" />
            Log Hours
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Task</div>
              <Select value={taskFilter} onValueChange={(v) => v && setTaskFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tasks</SelectItem>
                  {tasks.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEmployee && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Employee</div>
                <Select value={employeeFilter} onValueChange={(v) => v && setEmployeeFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Employee filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((e: any) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.first_name} {e.last_name} ({e.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Showing logs from <span className="font-mono">{formatDate(range.start)}</span> to{' '}
            <span className="font-mono">{formatDate(range.end)}</span>.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    No timesheets found.
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono">{formatDate(t.date)}</TableCell>
                    <TableCell className="font-medium">{t.task?.title || '-'}</TableCell>
                    <TableCell>{t.task?.project?.name || '-'}</TableCell>
                    <TableCell>{t.hours_worked}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.status)}>{String(t.status).toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate">{t.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      {isApprover && t.status === 'submitted' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(t.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(t.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openLog} onOpenChange={setOpenLog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Log Hours</DialogTitle>
            <DialogDescription>Submit hours for a task. Status will be `submitted`.</DialogDescription>
          </DialogHeader>

          <Form {...entryForm}>
            <form onSubmit={entryForm.handleSubmit(handleLog)} className="space-y-4">
              <FormField
                control={entryForm.control}
                name="task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks.map((t: any) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={entryForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={entryForm.control}
                  name="hours_worked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Worked</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.25" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={entryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenLog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={logging}>
                  {logging ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

