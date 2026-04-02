'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Calendar, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    projects: 0,
    leaves: 0,
    attendance: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        const data = response.data.data;
        setStats({
          employees: data.employees ?? 0,
          projects: data.projects ?? 0,
          leaves: data.pending_leaves ?? 0,
          attendance: data.attendance_today ?? 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Employees', value: stats.employees, icon: Users, color: 'text-blue-600' },
    { title: 'Active Projects', value: stats.projects, icon: Briefcase, color: 'text-green-600' },
    { title: 'Pending Leaves', value: stats.leaves, icon: Calendar, color: 'text-orange-600' },
    { title: 'Today Attendance', value: stats.attendance, icon: Clock, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to the NGO Office Automation System.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">No recent activity found.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">No upcoming deadlines.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
