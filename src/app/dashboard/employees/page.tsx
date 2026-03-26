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
  join_date: z.string().min(1, 'Join date is required'),
  status: z.string().min(1, 'Status is required'),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  profile_picture: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema> & { profile_picture?: File | string };

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

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      employee_id: '',
      department_id: '',
      designation_id: '',
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
        api.get(`/employees?search=${search}`),
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>ID Card - ${employee.first_name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
            .id-card { width: 320px; height: 500px; background: white; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; position: relative; border: 1px solid #e1e4e8; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 5px; }
            .ngo-logo { width: 40px; height: 40px; object-fit: contain; margin-bottom: 5px; }
            .ngo-name { font-size: 18px; font-weight: 700; margin: 0; text-transform: uppercase; }
            .ngo-address { font-size: 10px; margin: 0; opacity: 0.9; }
            .photo-area { display: flex; justify-content: center; margin-top: -40px; }
            .photo { width: 100px; height: 100px; background: #ddd; border-radius: 50%; border: 4px solid white; object-fit: cover; }
            .details { padding: 20px; text-align: center; }
            .emp-name { font-size: 20px; font-weight: 700; color: #1f2937; margin: 10px 0 5px; }
            .emp-designation { font-size: 14px; color: #6b7280; margin: 0 0 20px; font-weight: 500; }
            .info-grid { display: grid; grid-cols: 1; gap: 10px; text-align: left; background: #f9fafb; padding: 15px; border-radius: 10px; }
            .info-item { display: flex; justify-content: space-between; font-size: 12px; }
            .info-label { color: #6b7280; font-weight: 600; }
            .info-value { color: #1f2937; font-weight: 700; }
            .footer { position: absolute; bottom: 0; width: 100%; background: #f3f4f6; padding: 10px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
            @media print {
              body { background: white; }
              .id-card { box-shadow: none; border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
           <div class="id-card">
             <div class="header">
               ${ngoSettings.ngo_logo ? `<img src="${ngoSettings.ngo_logo}" class="ngo-logo" />` : ''}
               <p class="ngo-name">${ngoSettings.ngo_name}</p>
               <p class="ngo-address">${ngoSettings.ngo_address}</p>
             </div>
            <div class="photo-area">
              <img src="${employee.profile_picture || 'https://via.placeholder.com/150'}" class="photo" />
            </div>
            <div class="details">
              <p class="emp-name">${employee.first_name} ${employee.last_name}</p>
              <p class="emp-designation">${employee.designation?.name}</p>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Employee ID:</span>
                  <span class="info-value">${employee.employee_id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Department:</span>
                  <span class="info-value">${employee.department?.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Blood Group:</span>
                  <span class="info-value">${employee.blood_group || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${employee.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              Issued by ${ngoSettings.ngo_name} | Valid until Dec 2026
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
   };

  return (
    <div className="space-y-6">
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              <DialogDescription>
                {selectedEmployee ? 'Update the details for this employee.' : 'Fill in the details below to register a new employee.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <div className="flex justify-end gap-3 pt-4">
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
