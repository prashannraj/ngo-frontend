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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, Plus, X } from 'lucide-react';

const createSchema = z.object({
  employee_id: z.coerce.number().optional(),
  period: z.string().min(1, 'Period is required'),
  goals: z.string().optional(),
  status: z.string().optional(),
  employee_comments: z.string().optional(),
  appraiser_comments: z.string().optional(),
});

const reviewSchema = z.object({
  ratings: z.string().optional(),
  appraiser_comments: z.string().optional(),
});

const completeSchema = z.object({
  final_score: z.coerce.number().min(0, 'Score must be >= 0'),
  employee_comments: z.string().optional(),
});

function splitLines(s?: string): string[] {
  if (!s) return [];
  return s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitNumbers(s?: string): number[] {
  if (!s) return [];
  return s
    .split(/[,\n]/g)
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n));
}

export default function AppraisalsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appraisals, setAppraisals] = useState<any[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const [activeAppraisalId, setActiveAppraisalId] = useState<number | null>(null);

  const isApprover = useMemo(
    () => user?.roles?.some((r: string) => ['Admin', 'HR', 'Line Manager'].includes(r)),
    [user],
  );

  const isEmployee = useMemo(() => user?.roles?.some((r: string) => r === 'Employee'), [user]);

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      employee_id: undefined,
      period: '',
      goals: '',
      status: 'draft',
      employee_comments: '',
      appraiser_comments: '',
    },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      ratings: '',
      appraiser_comments: '',
    },
  });

  const completeForm = useForm<z.infer<typeof completeSchema>>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      final_score: 0,
      employee_comments: '',
    },
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appraisals?per_page=200');
      setAppraisals(res.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch appraisals');
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

  const handleCreate = async (values: z.infer<typeof createSchema>) => {
    try {
      await api.post('/appraisals', {
        period: values.period,
        employee_id: values.employee_id ? Number(values.employee_id) : undefined,
        // Backend expects array for goals/ratings.
        goals: splitLines(values.goals),
        employee_comments: values.employee_comments || undefined,
        appraiser_comments: values.appraiser_comments || undefined,
        status: values.status || 'draft',
      });
      toast.success('Appraisal created');
      setCreateOpen(false);
      createForm.reset();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create appraisal');
    }
  };

  const handleSubmit = async (appraisalId: number) => {
    try {
      await api.post(`/appraisals/${appraisalId}/submit`);
      toast.success('Appraisal submitted for review');
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
  };

  const openReview = (id: number) => {
    setActiveAppraisalId(id);
    setReviewOpen(true);
  };

  const handleReview = async (values: z.infer<typeof reviewSchema>) => {
    if (!activeAppraisalId) return;
    try {
      await api.post(`/appraisals/${activeAppraisalId}/review`, {
        ratings: splitNumbers(values.ratings),
        appraiser_comments: values.appraiser_comments || undefined,
      });
      toast.success('Appraisal reviewed');
      setReviewOpen(false);
      setActiveAppraisalId(null);
      reviewForm.reset();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to review');
    }
  };

  const openComplete = (id: number) => {
    setActiveAppraisalId(id);
    setCompleteOpen(true);
  };

  const handleComplete = async (values: z.infer<typeof completeSchema>) => {
    if (!activeAppraisalId) return;
    try {
      await api.post(`/appraisals/${activeAppraisalId}/complete`, {
        final_score: values.final_score,
        employee_comments: values.employee_comments || undefined,
      });
      toast.success('Appraisal completed');
      setCompleteOpen(false);
      setActiveAppraisalId(null);
      completeForm.reset({ final_score: 0, employee_comments: '' });
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete');
    }
  };

  const statusVariant = (status: string) => {
    if (status === 'completed') return 'default';
    if (status === 'submitted') return 'secondary';
    if (status === 'reviewed') return 'secondary';
    if (status === 'draft') return 'outline' as any;
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Appraisals</h1>
          <p className="text-gray-500">Goals, review, and performance workflow.</p>
        </div>

        {(isEmployee || isApprover) && (
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Appraisal
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appraisal Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : appraisals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                    No appraisals found.
                  </TableCell>
                </TableRow>
              ) : (
                appraisals.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.employee
                        ? `${a.employee.first_name} ${a.employee.last_name}`
                        : '-'}
                    </TableCell>
                    <TableCell>{a.period}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'completed' ? 'default' : 'secondary'}>
                        {String(a.status).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isEmployee && a.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-2"
                          onClick={() => handleSubmit(a.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Submit
                        </Button>
                      )}

                      {isApprover && a.status === 'submitted' && (
                        <Button size="sm" variant="outline" className="mr-2" onClick={() => openReview(a.id)}>
                          Review
                        </Button>
                      )}

                      {isApprover && a.status === 'reviewed' && (
                        <Button size="sm" variant="outline" onClick={() => openComplete(a.id)}>
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Appraisal</DialogTitle>
            <DialogDescription>Set goals and prepare the review workflow.</DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              {!isEmployee && (
                <FormField
                  control={createForm.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID (override)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={createForm.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <FormControl>
                      <Input placeholder="2026 Q1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goals (one per line)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="employee_comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Comments (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
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

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Appraisal</DialogTitle>
            <DialogDescription>Provide ratings and reviewer comments.</DialogDescription>
          </DialogHeader>

          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(handleReview)} className="space-y-4">
              <FormField
                control={reviewForm.control}
                name="ratings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ratings (comma or newline separated numbers)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="appraiser_comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appraiser Comments</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Review</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Appraisal</DialogTitle>
            <DialogDescription>Finalize score and employee feedback.</DialogDescription>
          </DialogHeader>

          <Form {...completeForm}>
            <form onSubmit={completeForm.handleSubmit(handleComplete)} className="space-y-4">
              <FormField
                control={completeForm.control}
                name="final_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Score</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={completeForm.control}
                name="employee_comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Comments (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Complete</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

