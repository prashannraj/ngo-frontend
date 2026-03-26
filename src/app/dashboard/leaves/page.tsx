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
import { Plus, MoreVertical, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data.data.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/leaves/${id}/approve`);
      toast.success('Leave approved');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/leaves/${id}/reject`);
      toast.success('Leave rejected');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const isAdminOrHR = user?.roles?.some((r: string) => ['Admin', 'HR', 'Line Manager'].includes(r));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-500">Track and manage employee leave applications.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Request Leave
        </Button>
      </div>

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
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  Loading leaves...
                </TableCell>
              </TableRow>
            ) : leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((leave: any) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{leave.employee?.first_name} {leave.employee?.last_name}</span>
                      <span className="text-xs text-gray-500">{leave.employee?.employee_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{leave.leave_type?.name}</TableCell>
                  <TableCell>
                    {leave.start_date} to {leave.end_date}
                  </TableCell>
                  <TableCell>{leave.days}</TableCell>
                  <TableCell>
                    <Badge variant={
                      leave.status === 'approved' ? 'default' : 
                      leave.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdminOrHR && leave.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleApprove(leave.id)}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleReject(leave.id)}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
