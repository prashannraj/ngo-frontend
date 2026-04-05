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
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreVertical, Edit, Trash, User, Printer } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  employee_id: z.string().min(1, 'Employee ID is required'),
  department_id: z.string().min(1, 'Department is required'),
  designation_id: z.string().min(1, 'Designation is required'),
  manager_id: z.string().optional(),
  join_date: z.string().min(1, 'Join date is required'),
  status: z.string().min(1, 'Status is required'),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  profile_picture: z.any().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [ngoSettings, setNgoSettings] = useState<any>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [printingEmployee, setPrintingEmployee] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      employee_id: '',
      department_id: '',
      designation_id: '',
      manager_id: '',
      join_date: new Date().toISOString().split('T')[0],
      status: 'active',
      gender: '',
      date_of_birth: '',
      address: '',
      city: '',
      phone: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      profile_picture: '',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, depRes, desRes, ngoRes] = await Promise.all([
        api.get(`/employees?search=${search}&per_page=200`),
        api.get('/departments'),
        api.get('/designations'),
        api.get('/ngo-settings'),
      ]);
      setEmployees(empRes.data.data.data);
      setDepartments(depRes.data.data);
      setDesignations(desRes.data.data);
      setNgoSettings(ngoRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const onSubmit = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        const value = (values as any)[key];
        if (key === 'profile_picture') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else if (key === 'manager_id' && (!value || String(value).trim() === '')) {
          formData.append(key, '');
        } else {
          formData.append(key, value || '');
        }
      });

      if (selectedEmployee) {
        await api.post(`/employees/${selectedEmployee.id}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Employee added successfully');
      }
      setIsModalOpen(false);
      setSelectedEmployee(null);
      setPhotoPreview(null);
      form.reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setPhotoPreview(employee.profile_picture);
    form.reset({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      employee_id: employee.employee_id || '',
      department_id: (employee.department_id || '').toString(),
      designation_id: (employee.designation_id || '').toString(),
      manager_id: (employee.manager_id || '').toString(),
      join_date: employee.join_date || '',
      status: employee.status || 'active',
      gender: employee.gender || '',
      date_of_birth: employee.date_of_birth || '',
      address: employee.address || '',
      city: employee.city || '',
      phone: employee.phone || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
     if (window.confirm('Are you sure you want to delete this employee?')) {
       try {
         await api.delete(`/employees/${id}`);
         toast.success('Employee deleted successfully');
         fetchData();
       } catch (error: any) {
         toast.error('Failed to delete employee');
       }
     }
   };
 
   const handlePrintID = (employee: any) => {
    if (!ngoSettings) {
      toast.error('Please configure NGO Settings first to print ID cards');
      router.push('/dashboard/ngo-settings');
      return;
    }
    setPrintingEmployee(employee);
    setIsPreviewOpen(true);
   };

   const handleActualPrint = () => {
    window.print();
    setIsPreviewOpen(false);
    setPrintingEmployee(null);
   };

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
            {printingEmployee && (
              <div className="w-[320px] h-[500px] border border-gray-300 rounded-2xl overflow-hidden relative bg-white shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="bg-blue-600 p-6 text-center flex flex-col items-center gap-2">
                  {ngoSettings?.ngo_logo && (
                    <img src={ngoSettings.ngo_logo} alt="NGO Logo" className="h-12 w-12 object-contain mb-1" />
                  )}
                  <h2 className="text-white text-lg font-bold uppercase leading-tight tracking-wide">{ngoSettings?.ngo_name || 'NGO Name'}</h2>
                  <p className="text-white/80 text-[10px] leading-tight font-medium">{ngoSettings?.ngo_address || 'NGO Address'}</p>
                </div>
                <div className="flex justify-center -mt-10">
                  <img 
                    src={printingEmployee.profile_picture || 'https://via.placeholder.com/150'} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                </div>
                <div className="p-6 text-center space-y-1">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{printingEmployee.first_name} {printingEmployee.last_name}</h3>
                  <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase">{printingEmployee.designation?.name}</p>
                  <div className="mt-8 bg-gray-50/80 p-5 rounded-2xl space-y-3 text-left border border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Employee ID</span>
                      <span className="text-gray-900 font-black">{printingEmployee.employee_id}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Department</span>
                      <span className="text-gray-900 font-black">{printingEmployee.department?.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Blood Group</span>
                      <span className="text-gray-900 font-black">{printingEmployee.blood_group || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">Phone</span>
                      <span className="text-gray-900 font-black">{printingEmployee.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 w-full bg-gray-50 py-3 text-center border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Issued by {ngoSettings?.ngo_name || 'NGO'} | Valid until Dec 2026</p>
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

      {/* Print-only ID Card container (Hidden on screen) */}
      {printingEmployee && (
        <div className="fixed inset-0 z-[9999] bg-white print:block hidden overflow-visible print-only">
          <div className="flex justify-center items-center h-screen bg-white">
            <div className="w-[320px] h-[500px] border border-gray-300 rounded-2xl overflow-hidden relative bg-white">
              <div className="bg-blue-600 p-6 text-center flex flex-col items-center gap-2">
                {ngoSettings?.ngo_logo && (
                  <img src={ngoSettings.ngo_logo} alt="NGO Logo" className="h-12 w-12 object-contain mb-1" />
                )}
                <h2 className="text-white text-lg font-bold uppercase leading-tight">{ngoSettings?.ngo_name || 'NGO Name'}</h2>
                <p className="text-white/80 text-[10px] leading-tight">{ngoSettings?.ngo_address || 'NGO Address'}</p>
              </div>
              <div className="flex justify-center -mt-10">
                <img 
                  src={printingEmployee.profile_picture || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md"
                />
              </div>
              <div className="p-6 text-center space-y-1">
                <h3 className="text-xl font-bold text-gray-900">{printingEmployee.first_name} {printingEmployee.last_name}</h3>
                <p className="text-gray-500 text-sm font-medium">{printingEmployee.designation?.name}</p>
                <div className="mt-6 bg-gray-50 p-4 rounded-xl space-y-2 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Employee ID:</span>
                    <span className="text-gray-900 font-bold">{printingEmployee.employee_id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Department:</span>
                    <span className="text-gray-900 font-bold">{printingEmployee.department?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Blood Group:</span>
                    <span className="text-gray-900 font-bold">{printingEmployee.blood_group || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Phone:</span>
                    <span className="text-gray-900 font-bold">{printingEmployee.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 w-full bg-gray-100 py-2 text-center border-t border-gray-200">
                <p className="text-[10px] text-gray-400">Issued by {ngoSettings?.ngo_name || 'NGO'} | Valid until Dec 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500">Manage your NGO staff and their profiles.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedEmployee(null);
            form.reset({
               first_name: '',
               last_name: '',
               email: '',
               employee_id: '',
               department_id: '',
               designation_id: '',
               manager_id: '',
               join_date: new Date().toISOString().split('T')[0],
               status: 'active',
               gender: '',
               date_of_birth: '',
               address: '',
               city: '',
               phone: '',
               emergency_contact_name: '',
               emergency_contact_phone: '',
             });
          }
        }}>
          <DialogTrigger
            render={
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
              <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              <DialogDescription>
                {selectedEmployee ? 'Update the details for this employee.' : 'Fill in the details below to register a new employee.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID</FormLabel>
                        <FormControl>
                          <Input placeholder="EMP-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.length > 0 ? (
                              departments.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No departments found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="designation_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select designation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {designations.length > 0 ? (
                              designations.map((desig: any) => (
                                <SelectItem key={desig.id} value={desig.id.toString()}>
                                  {desig.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No designations found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manager_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select manager (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No manager</SelectItem>
                            {employees.length > 0 ? (
                              employees
                                .filter((m: any) => String(m.id) !== String(selectedEmployee?.id ?? ''))
                                .map((m: any) => (
                                  <SelectItem key={m.id} value={m.id.toString()}>
                                    {m.first_name} {m.last_name}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="none" disabled>No employees found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="join_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Join Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="profile_picture"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Profile Picture (JPEG/PNG)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input 
                            type="file" 
                            accept="image/jpeg,image/png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                                const reader = new FileReader();
                                reader.onloadend = () => setPhotoPreview(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            {...fieldProps} 
                          />
                          {photoPreview && (
                            <div className="relative w-24 h-24 border rounded-full overflow-hidden bg-gray-50">
                              <img 
                                src={photoPreview} 
                                alt="Profile Preview" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+977-98XXXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Kathmandu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street name, Area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Relative Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergency_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-3 sticky bottom-0 bg-white z-10 py-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (selectedEmployee ? 'Updating...' : 'Adding...') : (selectedEmployee ? 'Update Employee' : 'Add Employee')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search by name, email or ID..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee: any) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.employee_id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{employee.first_name} {employee.last_name}</span>
                      <span className="text-xs text-gray-500">{employee.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{employee.department?.name}</TableCell>
                  <TableCell>{employee.designation?.name}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => handlePrintID(employee)}>
                            <Printer className="w-4 h-4" />
                            Print ID Card
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => router.push(`/dashboard/employees/${employee.id}`)}>
                            <User className="w-4 h-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleEdit(employee)}>
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 text-red-600" onClick={() => handleDelete(employee.id)}>
                          <Trash className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
