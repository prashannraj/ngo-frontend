'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { formatDate } from '@/lib/utils';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Project code is required'),
  manager_id: z.number().min(1, 'Project manager is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string(),
  status: z.string(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = useMemo(
    () => user?.roles?.some((r: string) => ['Admin', 'HR', 'Project Manager'].includes(r)),
    [user],
  );

  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: '',
      manager_id: 1, 
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      status: 'planned',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, empRes] = await Promise.all([
        api.get('/projects?per_page=100'),
        api.get('/employees?per_page=500'),
      ]);
      setProjects(projRes.data.data.data);
      setPaginationInfo(projRes.data.data);
      setEmployees(empRes.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const handleCreateProject = async (values: z.infer<typeof projectSchema>) => {
    setSubmitting(true);
    try {
      await api.post('/projects', values);
      toast.success('Project created successfully');
      setOpenCreate(false);
      projectForm.reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500">View project status and assigned project manager.</p>
        </div>

        {canCreate && (
          <Button onClick={() => setOpenCreate(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-500" />
            Project List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-mono">{project.code}</TableCell>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      {project.manager ? `${project.manager.first_name} ${project.manager.last_name}` : '-'}
                    </TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
                    <TableCell>{formatDate(project.end_date)}</TableCell>
                    <TableCell>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {String(project.status).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {paginationInfo && (
            <div className="mt-4 text-sm text-gray-500">
              Page {paginationInfo.current_page} of {paginationInfo.last_page} (Total: {paginationInfo.total})
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Define a new project and assign a project manager.</DialogDescription>
          </DialogHeader>

          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(handleCreateProject)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={projectForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PJ-101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Yearly Audit 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={projectForm.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Manager</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp: any) => (
                            <SelectItem key={emp.id} value={String(emp.id)}>
                              {emp.first_name} {emp.last_name}
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
                  control={projectForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={projectForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


