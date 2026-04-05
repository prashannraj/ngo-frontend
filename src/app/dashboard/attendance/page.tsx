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
import { Plus, Smartphone, Fingerprint, User, MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

import { formatDate } from '@/lib/utils';

const entrySchema = z.object({
  employee_id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  status: z.string().min(1),
  notes: z.string().optional(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const entryForm = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      employee_id: '',
      date: toISODate(new Date()),
      check_in: '',
      check_out: '',
      status: 'present',
      notes: '',
    },
  });

  const handleManualSave = async (values: EntryFormValues) => {
    try {
      await api.post('/attendance', {
        ...values,
        employee_id: values.employee_id ? parseInt(values.employee_id) : undefined
      });
      toast.success('Attendance record saved');
      setOpenEntry(false);
      entryForm.reset();
      fetchAttendance();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save attendance');
    }
  };

  const handleMobileCheck = async (type: 'in' | 'out') => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await api.post('/attendance/mobile', {
          type,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast.success(type === 'in' ? 'Checked in successfully' : 'Checked out successfully');
        fetchAttendance();
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to perform check-in/out');
      }
    }, (error) => {
      toast.error('Unable to retrieve your location. Please allow location access.');
    });
  };

  const todayRecord = useMemo(() => {
    const today = toISODate(new Date());
    return rows.find(r => String(r.date).startsWith(today));
  }, [rows]);

  const sourceIcon = (source: string) => {
    switch (source) {
      case 'biometric': return <Fingerprint className="w-4 h-4 text-blue-500" />;
      case 'mobile': return <Smartphone className="w-4 h-4 text-green-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        {isAdminLike && (
          <Button onClick={() => setOpenEntry(true)} className="premium-gradient shadow-lg font-bold">
            <Plus className="w-4 h-4 mr-2" /> Manual Entry
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass overflow-hidden border-primary/20 shadow-xl">
          <CardHeader className="premium-gradient text-white">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> 
              Mobile App Check-In/Out
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center space-y-4">
            {todayRecord?.check_in && !todayRecord?.check_out ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shift Started</p>
                   <p className="text-2xl font-black text-primary">{todayRecord.check_in}</p>
                </div>
                <Button size="lg" className="h-20 w-full bg-red-500 hover:bg-red-600 shadow-lg text-lg font-bold rounded-2xl transition-all" onClick={() => handleMobileCheck('out')}>
                   Check Out Now
                </Button>
              </div>
            ) : todayRecord?.check_out ? (
               <div className="py-6 space-y-2">
                 <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8" />
                 </div>
                 <p className="text-xl font-black text-green-600">Day Completed</p>
                 <p className="text-sm font-medium text-gray-500">{todayRecord.check_in} - {todayRecord.check_out}</p>
               </div>
            ) : (
              <div className="space-y-4">
                 <p className="text-sm font-medium text-gray-400">Welcome! Start your work session below.</p>
                 <Button size="lg" className="h-20 w-full premium-gradient shadow-lg text-lg font-bold rounded-2xl" onClick={() => handleMobileCheck('in')}>
                    Check In Now
                 </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass shadow-xl">
           <CardHeader>
             <CardTitle className="text-lg font-bold">Recent Stats</CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 rounded-xl bg-green-500/5">
                <p className="text-[10px] font-bold text-green-600 uppercase">Present</p>
                <p className="text-2xl font-black">{rows.filter(r => r.status === 'present').length}</p>
              </div>
              <div className="p-2 rounded-xl bg-red-500/5">
                <p className="text-[10px] font-bold text-red-600 uppercase">Absent</p>
                <p className="text-2xl font-black">{rows.filter(r => r.status === 'absent').length}</p>
              </div>
              <div className="p-2 rounded-xl bg-orange-500/5">
                <p className="text-[10px] font-bold text-orange-600 uppercase">Late</p>
                <p className="text-2xl font-black">{rows.filter(r => r.status === 'late').length}</p>
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="glass border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-black flex items-center gap-2">
             <Fingerprint className="w-5 h-5 text-primary" />
             Attendance Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-none">
                <TableHead className="font-bold">Employee</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">In</TableHead>
                <TableHead className="font-bold">Out</TableHead>
                <TableHead className="font-bold">Origin</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="font-bold">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-gray-400">Loading data...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-gray-400">No records found.</TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-primary/5 transition-all">
                    <TableCell className="font-bold">
                      {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="font-semibold">{r.check_in || '--:--'}</TableCell>
                    <TableCell className="font-semibold">{r.check_out || '--:--'}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-2 cursor-help">
                              {sourceIcon(r.source)}
                              {(r.latitude || r.longitude) && <MapPin className="w-3 h-3 text-primary animate-pulse" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="glass p-2">
                            <p className="text-[10px] font-bold uppercase">Source: {r.source || 'manual'}</p>
                            {r.latitude && <p className="text-[10px]">Lat: {r.latitude}</p>}
                            {r.longitude && <p className="text-[10px]">Lng: {r.longitude}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.status === 'present' ? 'default' : r.status === 'absent' ? 'destructive' : 'secondary'} className="rounded-full px-3 text-[10px] uppercase">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic text-[11px] max-w-[150px] truncate">{r.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openEntry} onOpenChange={setOpenEntry}>
        <DialogContent className="glass max-w-lg rounded-3xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Manual Entry</DialogTitle>
          </DialogHeader>
          <Form {...entryForm}>
            <form onSubmit={entryForm.handleSubmit(handleManualSave)} className="space-y-4 pt-4">
              {isAdminLike && (
                <FormField
                  control={entryForm.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Employee</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass">
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={String(emp.id)}>
                              {emp.first_name} {emp.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={entryForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={entryForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass">
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="wfh">WFH</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={entryForm.control}
                  name="check_in"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">In Time</FormLabel>
                      <FormControl>
                        <Input type="time" step="1" {...field} className="rounded-xl" />
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
                      <FormLabel className="font-bold">Out Time</FormLabel>
                      <FormControl>
                        <Input type="time" step="1" {...field} className="rounded-xl" />
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
                    <FormLabel className="font-bold">Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpenEntry(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="premium-gradient shadow-lg px-8 rounded-xl font-bold">
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
