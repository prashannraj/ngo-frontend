'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MoreVertical, 
  Check, 
  X, 
  Settings, 
  Calendar as CalendarIcon, 
  History,
  FileText
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

const leaveRequestSchema = z.object({
  leave_type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

const inLieuSchema = z.object({
  work_date: z.string().min(1, 'Work date is required'),
  days: z.string().min(1, 'Days is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

const leaveTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  allowance: z.string().min(1, 'Allowance is required'),
  color: z.string().min(1, 'Color is required'),
});

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [inLieuLeaves, setInLieuLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isInLieuModalOpen, setIsInLieuModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestForm = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { leave_type_id: '', start_date: '', end_date: '', reason: '' }
  });

  const inLieuForm = useForm({
    resolver: zodResolver(inLieuSchema),
    defaultValues: { work_date: '', days: '1', reason: '' }
  });

  const typeForm = useForm({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: { name: '', allowance: '0', color: '#2563eb' }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [leavesRes, inLieuRes, typesRes] = await Promise.all([
        api.get('/leaves'),
        api.get('/in-lieu-leaves'),
        api.get('/leave-types')
      ]);
      setLeaves(leavesRes.data.data.data);
      setInLieuLeaves(inLieuRes.data.data.data);
      setLeaveTypes(typesRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/leaves', values);
      toast.success('Leave request submitted');
      setIsRequestModalOpen(false);
      requestForm.reset();
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInLieuSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/in-lieu-leaves', values);
      toast.success('In-lieu request submitted');
      setIsInLieuModalOpen(false);
      inLieuForm.reset();
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTypeSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/leave-types', values);
      toast.success('Leave type created');
      setIsTypeModalOpen(false);
      typeForm.reset();
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (type: 'leave' | 'in-lieu', id: number, action: 'approve' | 'reject') => {
    try {
      const endpoint = type === 'leave' ? `/leaves/${id}/${action}` : `/in-lieu-leaves/${id}/${action}`;
      await api.post(endpoint);
      toast.success(`Request ${action}ed`);
      fetchAllData();
    } catch (error) {
      toast.error(`Failed to ${action} request`);
    }
  };

  const isAdminOrHR = user?.roles?.some((r: string) => ['Admin', 'HR'].includes(r));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500">Configure types, request leaves, and manage approvals.</p>
        </div>
        <div className="flex gap-2">
          {isAdminOrHR && (
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsTypeModalOpen(true)}>
              <Settings className="w-4 h-4" />
              Configure Types
            </Button>
          )}
          <Button className="flex items-center gap-2" onClick={() => setIsRequestModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Apply for Leave
          </Button>
        </div>
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger value="requests" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-6">Leave Requests</TabsTrigger>
          <TabsTrigger value="in-lieu" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-6">In-Lieu Leaves</TabsTrigger>
          {isAdminOrHR && <TabsTrigger value="config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-6">Configuration</TabsTrigger>}
        </TabsList>

        <TabsContent value="requests" className="pt-6">
          <div className="bg-white rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : leaves.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">No requests found.</TableCell></TableRow>
                ) : (
                  leaves.map((leave: any) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{leave.employee?.first_name} {leave.employee?.last_name}</span>
                          <span className="text-xs text-gray-500">{leave.employee?.employee_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: leave.leave_type?.color }} />
                          {leave.leave_type?.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-600">
                        {formatDate(leave.start_date)} to {formatDate(leave.end_date)}
                      </TableCell>
                      <TableCell>{leave.days}</TableCell>
                      <TableCell>
                        <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'pending' ? 'secondary' : 'destructive'}>
                          {leave.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdminOrHR && leave.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAction('leave', leave.id, 'approve')}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction('leave', leave.id, 'reject')}>
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
          </div>
        </TabsContent>

        <TabsContent value="in-lieu" className="pt-6 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setIsInLieuModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Request In-Lieu
            </Button>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Work Date</TableHead>
                  <TableHead>Days Earned</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inLieuLeaves.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-500">No in-lieu records found.</TableCell></TableRow>
                ) : (
                  inLieuLeaves.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-bold">{record.employee?.first_name} {record.employee?.last_name}</TableCell>
                      <TableCell className="font-mono text-xs">{formatDate(record.work_date)}</TableCell>
                      <TableCell>{record.days}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{record.reason}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'approved' ? 'default' : record.status === 'pending' ? 'secondary' : 'destructive'}>
                          {record.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdminOrHR && record.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleAction('in-lieu', record.id, 'approve')}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleAction('in-lieu', record.id, 'reject')}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="config" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaveTypes.map((type: any) => (
              <Card key={type.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">{type.name}</CardTitle>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{type.allowance} Days</div>
                  <p className="text-xs text-gray-500">Annual Allowance</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Leave Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-4">
              <FormField control={requestForm.control} name="leave_type_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {leaveTypes.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={requestForm.control} name="start_date" render={({ field }) => (
                  <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={requestForm.control} name="end_date" render={({ field }) => (
                  <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={requestForm.control} name="reason" render={({ field }) => (
                <FormItem><FormLabel>Reason</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* In-Lieu Modal */}
      <Dialog open={isInLieuModalOpen} onOpenChange={setIsInLieuModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request In-Lieu Leave</DialogTitle></DialogHeader>
          <Form {...inLieuForm}>
            <form onSubmit={inLieuForm.handleSubmit(handleInLieuSubmit)} className="space-y-4">
              <FormField control={inLieuForm.control} name="work_date" render={({ field }) => (
                <FormItem><FormLabel>Date Worked (Weekend/Holiday)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={inLieuForm.control} name="days" render={({ field }) => (
                <FormItem><FormLabel>Days Earned</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={inLieuForm.control} name="reason" render={({ field }) => (
                <FormItem><FormLabel>Task Performed</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Leave Type Config Modal */}
      <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
          <Form {...typeForm}>
            <form onSubmit={typeForm.handleSubmit(handleTypeSubmit)} className="space-y-4">
              <FormField control={typeForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Type Name</FormLabel><FormControl><Input placeholder="e.g. Annual Leave" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={typeForm.control} name="allowance" render={({ field }) => (
                <FormItem><FormLabel>Annual Allowance (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={typeForm.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color Label</FormLabel><FormControl><Input type="color" {...field} className="h-10 p-1" /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Creating...' : 'Save Type'}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
