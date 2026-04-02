'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, Plus, X } from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigned_to: z.coerce.number().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'ongoing', 'completed', 'on_hold', 'cancelled']).default('todo'),
  progress: z.coerce.number().min(0).max(100).optional(),
  parent_id: z.coerce.number().optional(),
});

const logSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  hours_worked: z.coerce.number().min(0, 'Hours must be >= 0'),
  description: z.string().optional(),
});

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id ? Number(params.id) : 0;

  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const isApprover = useMemo(
    () => user?.roles?.some((r: string) => ['Admin', 'HR', 'Project Manager'].includes(r)),
    [user],
  );
  const isEmployee = useMemo(() => user?.roles?.some((r: string) => r === 'Employee'), [user]);

  const [createOpen, setCreateOpen] = useState(false);
  const [openLog, setOpenLog] = useState(false);
  const [logTask, setLogTask] = useState<any>(null);

  const createForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      assigned_to: undefined,
      due_date: '',
      priority: 'medium',
      status: 'todo',
      progress: 0,
      parent_id: undefined,
    },
  });

  const logForm = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      hours_worked: 1,
      description: '',
    },
  });

  const statusBadge = (status: string) => {
    if (status === 'completed') return 'default';
    if (status === 'ongoing') return 'secondary';
    if (status === 'cancelled' || status === 'on_hold') return 'destructive';
    return 'secondary';
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, empRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?project_id=${projectId}&per_page=200`),
        api.get('/employees?per_page=200'),
      ]);

      setProject(projRes.data.data);
      setTasks(tasksRes.data.data.data);
      setEmployees(empRes.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch project');
      router.push('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (projectId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const weeklyPlan = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate());
    const weekEnd = new Date(end);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);

    return tasks
      .filter((t: any) => t.due_date && t.due_date >= startStr && t.due_date <= endStr)
      .sort((a: any, b: any) => (a.due_date || '').localeCompare(b.due_date || ''));
  }, [tasks]);

  const handleCreateTask = async (values: z.infer<typeof taskSchema>) => {
    try {
      await api.post('/tasks', {
        project_id: projectId,
        parent_id: values.parent_id ?? null,
        title: values.title,
        description: values.description || '',
        assigned_to: values.assigned_to ? Number(values.assigned_to) : null,
        due_date: values.due_date || null,
        priority: values.priority,
        status: values.status,
        progress: values.progress ?? 0,
      });
      toast.success('Task created');
      setCreateOpen(false);
      createForm.reset();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleSetStatus = async (taskId: number, status: string) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status, progress: status === 'completed' ? 100 : undefined });
      toast.success('Task updated');
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const openLogForTask = (task: any) => {
    setLogTask(task);
    logForm.reset({ date: new Date().toISOString().slice(0, 10), hours_worked: 1, description: '' });
    setOpenLog(true);
  };

  const submitLog = async (values: z.infer<typeof logSchema>) => {
    if (!logTask) return;
    try {
      await api.post('/timesheets', {
        task_id: logTask.id,
        date: values.date,
        hours_worked: values.hours_worked,
        description: values.description || '',
        status: 'submitted',
      });
      toast.success('Hours submitted');
      setOpenLog(false);
      setLogTask(null);
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to log hours');
    }
  };

  if (loading) {
    return <div className="p-8">Loading project...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project?.name || 'Project'}</h1>
          <p className="text-gray-500">
            Code: <span className="font-mono">{project?.code || '-'}</span> | Manager:{' '}
            {project?.manager ? `${project.manager.first_name} ${project.manager.last_name}` : '-'}
          </p>
        </div>

        {isApprover && (
          <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks
                    .slice()
                    .sort((a: any, b: any) => (a.due_date || '').localeCompare(b.due_date || ''))
                    .map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>
                          {t.assignedTo ? `${t.assignedTo.first_name} ${t.assignedTo.last_name}` : '-'}
                        </TableCell>
                        <TableCell className="font-mono">{t.due_date || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge(t.status)}>{String(t.status).toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{t.progress ?? 0}%</TableCell>
                        <TableCell className="text-right">
                          {isApprover ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleSetStatus(t.id, 'todo')}>
                                Todo
                              </Button>
                              <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleSetStatus(t.id, 'ongoing')}>
                                Start
                              </Button>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleSetStatus(t.id, 'completed')}>
                                Complete
                              </Button>
                            </div>
                          ) : isEmployee ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openLogForTask(t)}
                              disabled={!t.assignedTo}
                            >
                              Log Hours
                            </Button>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyPlan.length === 0 ? (
                <div className="text-sm text-gray-500">No tasks due in the next 7 days.</div>
              ) : (
                <div className="space-y-3">
                  {weeklyPlan.slice(0, 8).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{t.title}</div>
                        <div className="text-xs text-gray-500">{t.due_date}</div>
                      </div>
                      <Badge variant={statusBadge(t.status)}>{String(t.status).toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gantt (Due Timeline)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-500">
                Simple timeline using `due_date` (tasks are shown as due points).
              </div>
              {tasks
                .filter((t: any) => t.due_date)
                .slice(0, 10)
                .sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))
                .map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.title}</div>
                    </div>
                    <Badge variant={statusBadge(t.status)}>{t.due_date}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Create a task or subtask inside this project.</DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateTask)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To (optional)</FormLabel>
                      <FormControl>
                        <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {employees.map((e: any) => (
                              <SelectItem key={e.id} value={String(e.id)}>
                                {e.first_name} {e.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtask of (optional)</FormLabel>
                    <FormControl>
                      <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="No parent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No parent</SelectItem>
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

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={openLog} onOpenChange={setOpenLog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Log Hours</DialogTitle>
            <DialogDescription>{logTask ? `Task: ${logTask.title}` : 'Submit your task hours.'}</DialogDescription>
          </DialogHeader>

          <Form {...logForm}>
            <form onSubmit={logForm.handleSubmit(submitLog)} className="space-y-4">
              <FormField
                control={logForm.control}
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
                control={logForm.control}
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

              <FormField
                control={logForm.control}
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
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

