'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  History, 
  ArrowLeft,
  Activity
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/employees/${params.id}`);
        setEmployee(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch employee details');
        router.push('/dashboard/employees');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchEmployee();
  }, [params.id, router]);

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!employee) return <div className="p-8">Employee not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Employee Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={employee.profile_picture} />
                <AvatarFallback className="text-4xl">{employee.first_name[0]}{employee.last_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h2>
                <p className="text-gray-500">{employee.designation?.name}</p>
              </div>
              <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                {employee.status.toUpperCase()}
              </Badge>
              <div className="w-full pt-4 space-y-3 text-sm text-left border-t">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>ID: {employee.employee_id}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{employee.department?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Joined: {employee.join_date}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details and Activities */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4">Details</TabsTrigger>
              <TabsTrigger value="activities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4">Activities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Gender</p>
                    <p className="font-medium capitalize">{employee.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date of Birth</p>
                    <p className="font-medium">{employee.date_of_birth || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium">{employee.address ? `${employee.address}, ${employee.city}` : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Emergency Contact</p>
                    <p className="font-medium">{employee.emergency_contact_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Emergency Phone</p>
                    <p className="font-medium">{employee.emergency_contact_phone || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Activity Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {employee.user?.activity_logs?.length > 0 ? (
                      employee.user.activity_logs.map((log: any) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-start">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-white shadow shrink-0 md:order-1">
                            <Activity className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 ml-4 md:order-2">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900">{log.description}</p>
                              <time className="text-xs text-slate-500 font-medium">{new Date(log.created_at).toLocaleString()}</time>
                            </div>
                            <div className="text-slate-500 text-sm">Module: {log.module} | Action: {log.action}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-10 text-gray-500">No activities recorded yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
