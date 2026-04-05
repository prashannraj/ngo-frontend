'use client';

import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { formatDateTime } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?per_page=50');
      setNotifications(res.data.data.data);
      setPagination(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      await fetchNotifications();
      toast.success('Marked as read');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      await fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark all read');
    }
  };

  const renderNotificationRow = (n: any) => (
    <TableRow key={n.id}>
      <TableCell>
        <Badge variant={n.read_at ? 'secondary' : 'default'}>
          {n.read_at ? 'READ' : 'UNREAD'}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{n.title || 'Notification'}</TableCell>
      <TableCell className="max-w-[360px] truncate">{n.body || '-'}</TableCell>
      <TableCell>{formatDateTime(n.created_at)}</TableCell>
      <TableCell className="text-right">
        {!n.read_at && (
          <Button size="sm" variant="outline" onClick={() => handleMarkRead(n.id)}>
            Mark read
          </Button>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500">Workflow-based alerts and reminders.</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Inbox</CardTitle>
          <Button variant="outline" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    Loading notifications...
                  </TableCell>
                </TableRow>
              ) : notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    No notifications found.
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map(renderNotificationRow)
              )}
            </TableBody>
          </Table>

          {pagination && pagination.last_page > 1 && (
            <div className="mt-4 text-sm text-gray-500">
              Page {pagination.current_page} of {pagination.last_page}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

