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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarDays, Check, Plus, X } from 'lucide-react';

const wfhSchema = z.object({
  task_id: z.string().optional(),
  work_date: z.string().min(1, 'Work date is required'),
  days: z.coerce.number().min(0.5, 'Days must be at least 0.5'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export default function WfhPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openApply, setOpenApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'all' | 'pending' | 'approved'>('all');

  const isAdminLike = useMemo(
    () => user?.roles?.some((r: string) => ['Admin', 'HR', 'Line Manager'].includes(r)),
    [user],
  );

  const form = useForm<z.infer<typeof wfhSchema>>({
    resolver: zodResolver(wfhSchema),
    defaultValues: {
      task_id: undefined,
      work_date: new Date().toISOString().slice(0, 10),
      days: 1,
      reason: '',
    },
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, tasksRes] = await Promise.all([
        api.get('/wfh-requests?per_page=100'),
        api.get('/tasks?per_page=200'),
      ]);

      setRequests(reqRes.data.data.data);
      setTasks(tasksRes.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch WFH data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values: z.infer<typeof wfhSchema>) => {
    setSubmitting(true);
    try {
      await api.post('/wfh-requests', {
        task_id: values.task_id ? Number(values.task_id) : null,
        work_date: values.work_date,
        days: values.days,
        reason: values.reason,
      });
      toast.success('WFH request submitted');
      setOpenApply(false);
      form.reset({ task_id: undefined, work_date: values.work_date, days: 1, reason: '' });
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit WFH request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/wfh-requests/${id}/${action}`);
      toast.success(`WFH request ${action}d`);
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} WFH request`);
    }
  };

  const visibleRequests = useMemo(() => {
    if (tab === 'pending') return requests.filter((r: any) => r.status === 'pending');
    if (tab === 'approved') return requests.filter((r: any) => r.status === 'approved');
    return requests;
  }, [requests, tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WFH Requests</h1>
          <p className="text-gray-500">Request work-from-home and track approvals.</p>
        </div>

        <Button className="flex items-center gap-2" onClick={() => setOpenApply(true)}>
          <Plus className="w-4 h-4" />
          Apply WFH
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Work Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
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
              ) : visibleRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                visibleRequests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '-'}
                    </TableCell>
                    <TableCell className="font-mono">{r.work_date}</TableCell>
                    <TableCell>{r.days}</TableCell>
                    <TableCell>{r.task ? r.task.title : '-'}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{r.reason}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'approved'
                            ? 'default'
                            : r.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {String(r.status).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdminLike && r.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleAction(r.id, 'approve')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleAction(r.id, 'reject')}
                          >
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

      <Dialog open={openApply} onOpenChange={setOpenApply}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply for WFH</DialogTitle>
            <DialogDescription>Submit a WFH request linked to a task (optional).</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="work_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task (optional)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v)} value={field.value ? String(field.value) : ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No task</SelectItem>
                        {tasks.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenApply(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

