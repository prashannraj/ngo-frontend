'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export default function AttendancePage() {
  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);
    return { start: toISODate(start), end: toISODate(end) };
  }, []);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [openEntry, setOpenEntry] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const isAdminLike = useMemo(() => user?.roles?.some((r: string) => ['Admin', 'HR', 'Line Manager'].includes(r)), [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/attendance?start_date=${range.start}&end_date=${range.end}&per_page=200`,
        );
        setRows(res.data.data.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [range.end, range.start]);

  useEffect(() => {
    if (!openEntry) return;
    if (!isAdminLike) return;
    const loadEmployees = async () => {
      try {
        const res = await api.get('/employees?per_page=200');
        setEmployees(res.data.data.data);
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load employees');
      }
    };
    loadEmployees();
  }, [openEntry, isAdminLike]);

  const entrySchema = z.object({
    employee_id: z.coerce.number().optional(),
    date: z.string().min(1, 'Date is required'),
    check_in: z.string().optional(),
    check_out: z.string().optional(),
    status: z.enum(['present', 'absent', 'late', 'on_leave', 'wfh']),
    notes: z.string().optional(),
  });

  const entryForm = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      employee_id: undefined,
      date: new Date().toISOString().slice(0, 10),
      check_in: '',
      check_out: '',
      status: 'present',
      notes: '',
    },
  });

  const handleSave = async (values: z.infer<typeof entrySchema>) => {
    try {
      await api.post('/attendance', {
        employee_id: values.employee_id ? Number(values.employee_id) : undefined,
        date: values.date,
        check_in: values.check_in || null,
        check_out: values.check_out || null,
        status: values.status,
        notes: values.notes || undefined,
      });
      toast.success('Attendance saved');
      setOpenEntry(false);
      entryForm.reset();
      // refetch by triggering effect deps: simplest call list endpoint again
      const res = await api.get(
        `/attendance?start_date=${range.start}&end_date=${range.end}&per_page=200`,
      );
      setRows(res.data.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save attendance');
    }
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'present') return 'default';
    if (status === 'late') return 'secondary';
    if (status === 'absent') return 'destructive';
    if (status === 'on_leave' || status === 'wfh') return 'secondary';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500">
          Manual attendance records (including `wfh` status) for the last 14 days.
        </p>
      </div>

      <div className="flex justify-end">
        <Button className="flex items-center gap-2" onClick={() => setOpenEntry(true)}>
          <Plus className="w-4 h-4" />
          Add Entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {range.start} to {range.end}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    Loading attendance...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '-'}
                    </TableCell>
                    <TableCell className="font-mono">{r.check_in || '-'}</TableCell>
                    <TableCell className="font-mono">{r.check_out || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(r.status)}>
                        {String(r.status).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">{r.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={openEntry} onOpenChange={setOpenEntry}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Attendance</DialogTitle>
          <DialogDescription>Manual entry. WFH entries can be set by approvers.</DialogDescription>
        </DialogHeader>

        <Form {...entryForm}>
          <form onSubmit={entryForm.handleSubmit(handleSave)} className="space-y-4">
            {isAdminLike && (
              <FormField
                control={entryForm.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <FormControl>
                      <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((e: any) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              {e.first_name} {e.last_name} ({e.employee_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={entryForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="wfh">WFH</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={entryForm.control}
                name="check_in"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check In</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={entryForm.control}
                name="check_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Out</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={entryForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenEntry(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </div>
  );
}

