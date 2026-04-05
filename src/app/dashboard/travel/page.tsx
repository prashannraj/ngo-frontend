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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, Plus, Plane, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const travelSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  estimated_budget: z.number().min(0),
});

const settleSchema = z.object({
  actual_expenditure: z.number().min(0, 'Actual expenditure must be 0 or more'),
});

type TravelFormValues = z.infer<typeof travelSchema>;
type SettleFormValues = z.infer<typeof settleSchema>;

export default function TravelPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [openApply, setOpenApply] = useState(false);
  const [openSettle, setOpenSettle] = useState(false);
  const [settling, setSettling] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const isApprover = useMemo(
    () => user?.roles?.some((r: string) => ['Admin', 'HR', 'Line Manager'].includes(r)),
    [user],
  );

  const applyForm = useForm<TravelFormValues>({
    resolver: zodResolver(travelSchema),
    defaultValues: {
      destination: '',
      purpose: '',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      estimated_budget: 0,
    },
  });

  const settleForm = useForm<SettleFormValues>({
    resolver: zodResolver(settleSchema),
    defaultValues: { actual_expenditure: 0 },
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/travel-requests?per_page=200');
      setRequests(res.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch travel requests');
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

  const handleApply = async (values: z.infer<typeof travelSchema>) => {
    setSubmitting(true);
    try {
      await api.post('/travel-requests', {
        destination: values.destination,
        purpose: values.purpose,
        start_date: values.start_date,
        end_date: values.end_date,
        estimated_budget: values.estimated_budget ?? 0,
      });
      toast.success('Travel request submitted');
      setOpenApply(false);
      applyForm.reset();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit travel request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/travel-requests/${id}/approve`);
      toast.success('Travel approved');
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/travel-requests/${id}/reject`);
      toast.success('Travel rejected');
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const handleSettle = async (values: z.infer<typeof settleSchema>) => {
    if (!settling) return;
    try {
      await api.post(`/travel-requests/${settling.id}/settle`, {
        actual_expenditure: values.actual_expenditure,
      });
      toast.success('Travel settled');
      setOpenSettle(false);
      setSettling(null);
      settleForm.reset({ actual_expenditure: 0 });
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to settle');
    }
  };

  const statusVariant = (status: string) => {
    if (status === 'approved' || status === 'settled') return 'default';
    if (status === 'pending') return 'secondary';
    if (status === 'rejected' || status === 'cancelled') return 'destructive';
    return 'secondary';
  };

  const renderTravelRow = (r: any) => (
    <TableRow key={r.id}>
      <TableCell>{r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '-'}</TableCell>
      <TableCell className="font-medium">{r.destination}</TableCell>
      <TableCell className="text-sm">
        {formatDate(r.start_date)} to {formatDate(r.end_date)}
      </TableCell>
      <TableCell className="text-sm">
        {r.estimated_budget ?? 0} <span className="text-gray-500">/</span>{' '}
        {r.actual_expenditure ?? '-'}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(r.status)}>{String(r.status).toUpperCase()}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {isApprover && r.status === 'pending' ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(r.id)}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(r.id)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : isApprover && r.status === 'approved' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSettling(r);
              setOpenSettle(true);
              settleForm.reset({ actual_expenditure: Number(r.actual_expenditure ?? 0) });
            }}
          >
            Settle
          </Button>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Management</h1>
          <p className="text-gray-500">Travel request, approval, and settlement.</p>
        </div>

        <Button className="flex items-center gap-2" onClick={() => setOpenApply(true)}>
          <Plus className="w-4 h-4" />
          Apply Travel
        </Button>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Travel Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No travel requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map(renderTravelRow)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openApply} onOpenChange={setOpenApply}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply for Travel</DialogTitle>
            <DialogDescription>Submit destination, dates and budget.</DialogDescription>
          </DialogHeader>

          <Form {...applyForm}>
            <form onSubmit={applyForm.handleSubmit(handleApply)} className="space-y-4">
              <FormField
                control={applyForm.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kathmandu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={applyForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={applyForm.control}
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
                  control={applyForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={applyForm.control}
                name="estimated_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Budget</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
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

      <Dialog open={openSettle} onOpenChange={setOpenSettle}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Settle Travel</DialogTitle>
            <DialogDescription>Provide actual expenditure to complete settlement.</DialogDescription>
          </DialogHeader>

          <Form {...settleForm}>
            <form onSubmit={settleForm.handleSubmit(handleSettle)} className="space-y-4">
              <FormField
                control={settleForm.control}
                name="actual_expenditure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Expenditure</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenSettle(false)}>
                  Cancel
                </Button>
                <Button type="submit">Settle</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

