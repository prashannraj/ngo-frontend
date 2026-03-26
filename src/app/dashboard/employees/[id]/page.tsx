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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  History, 
  ArrowLeft,
  Activity,
  Printer
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [ngoSettings, setNgoSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, ngoRes] = await Promise.all([
          api.get(`/employees/${params.id}`),
          api.get('/ngo-settings')
        ]);
        setEmployee(empRes.data.data);
        setNgoSettings(ngoRes.data.data);
      } catch (error) {
        toast.error('Failed to fetch data');
        router.push('/dashboard/employees');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id, router]);

  const handlePrintID = () => {
    if (!ngoSettings) {
      toast.error('Please configure NGO Settings first to print ID cards');
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleActualPrint = () => {
    setIsPrinting(true);
    setIsPreviewOpen(false);
  };

  useEffect(() => {
    if (isPrinting) {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
    }
  }, [isPrinting]);

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!employee) return <div className="p-8">Employee not found.</div>;

  return (
    <div className="space-y-6">
      {/* Print Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md bg-gray-50/50 backdrop-blur-sm border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              ID Card Preview
            </DialogTitle>
            <DialogDescription>
              Review the employee information before printing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 flex justify-center bg-gray-100/50 min-h-[600px] items-center">
            {employee && (
              <div className="w-[320px] h-[500px] border border-gray-300 rounded-2xl overflow-hidden relative bg-white shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="bg-blue-600 p-6 text-center flex flex-col items-center gap-2">
                  {ngoSettings?.ngo_logo && (
                    <img src={ngoSettings.ngo_logo} alt="NGO Logo" className="h-12 w-12 object-contain mb-1" />
                  )}
                  <h2 className="text-white text-lg font-bold uppercase leading-tight tracking-wide">{ngoSettings?.ngo_name}</h2>
                  <p className="text-white/80 text-[10px] leading-tight font-medium">{ngoSettings?.ngo_address}</p>
                </div>
                <div className="flex justify-center -mt-10">
                  <img 
                    src={employee.profile_picture || 'https://via.placeholder.com/150'} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                </div>
                <div className="p-6 text-center space-y-1">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{employee.first_name} {employee.last_name}</h3>
                  <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase">{employee.designation?.name}</p>
                  <div className="mt-8 bg-gray-50/80 p-5 rounded-2xl space-y-3 text-left border border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Employee ID</span>
                      <span className="text-gray-900 font-black">{employee.employee_id}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Department</span>
                      <span className="text-gray-900 font-black">{employee.department?.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Blood Group</span>
                      <span className="text-gray-900 font-black">{employee.blood_group || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Phone</span>
                      <span className="text-gray-900 font-black">{employee.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 w-full bg-gray-50 py-3 text-center border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Issued by {ngoSettings?.ngo_name} | Valid until Dec 2026</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t flex justify-end gap-3 sticky bottom-0 z-10">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="px-6 font-semibold">
              Cancel
            </Button>
            <Button onClick={handleActualPrint} className="bg-blue-600 hover:bg-blue-700 px-8 font-bold flex items-center gap-2 shadow-lg shadow-blue-200">
              <Printer className="w-4 h-4" />
              Print Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print-only ID Card container */}
       {isPrinting && (
         <div className="fixed inset-0 z-[9999] bg-white print:block hidden overflow-visible print-only">
           <div className="flex justify-center items-center h-screen bg-white">
            <div className="w-[320px] h-[500px] border border-gray-300 rounded-2xl overflow-hidden relative bg-white shadow-xl">
              <div className="bg-blue-600 p-6 text-center flex flex-col items-center gap-2">
                {ngoSettings.ngo_logo && (
                  <img src={ngoSettings.ngo_logo} alt="NGO Logo" className="h-12 w-12 object-contain mb-1" />
                )}
                <h2 className="text-white text-lg font-bold uppercase leading-tight">{ngoSettings.ngo_name}</h2>
                <p className="text-white/80 text-[10px] leading-tight">{ngoSettings.ngo_address}</p>
              </div>
              <div className="flex justify-center -mt-10">
                <img 
                  src={employee.profile_picture || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md"
                />
              </div>
              <div className="p-6 text-center space-y-1">
                <h3 className="text-xl font-bold text-gray-900">{employee.first_name} {employee.last_name}</h3>
                <p className="text-gray-500 text-sm font-medium">{employee.designation?.name}</p>
                <div className="mt-6 bg-gray-50 p-4 rounded-xl space-y-2 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Employee ID:</span>
                    <span className="text-gray-900 font-bold">{employee.employee_id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Department:</span>
                    <span className="text-gray-900 font-bold">{employee.department?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Blood Group:</span>
                    <span className="text-gray-900 font-bold">{employee.blood_group || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Phone:</span>
                    <span className="text-gray-900 font-bold">{employee.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 w-full bg-gray-100 py-2 text-center border-t border-gray-200">
                <p className="text-[10px] text-gray-400">Issued by {ngoSettings.ngo_name} | Valid until Dec 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Employee Profile</h1>
        </div>
        <Button className="flex items-center gap-2" onClick={handlePrintID}>
          <Printer className="w-4 h-4" />
          Print ID Card
        </Button>
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
