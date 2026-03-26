'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ngoSchema = z.object({
  ngo_name: z.string().min(1, 'NGO Name is required'),
  ngo_address: z.string().min(1, 'Address is required'),
  ngo_phone: z.string().optional(),
  ngo_email: z.string().email('Invalid email').optional().or(z.literal('')),
  ngo_website: z.string().url('Invalid URL').optional().or(z.literal('')),
  ngo_logo: z.any().optional(),
  registration_number: z.string().optional(),
  pan_vat_number: z.string().optional(),
});

type NgoFormValues = z.infer<typeof ngoSchema>;

export default function NgoSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<NgoFormValues>({
    resolver: zodResolver(ngoSchema),
    defaultValues: {
      ngo_name: '',
      ngo_address: '',
      ngo_phone: '',
      ngo_email: '',
      ngo_website: '',
      ngo_logo: '',
      registration_number: '',
      pan_vat_number: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/ngo-settings');
        if (response.data.data) {
          const data = response.data.data;
          const sanitizedData = {
            ngo_name: data.ngo_name || '',
            ngo_address: data.ngo_address || '',
            ngo_phone: data.ngo_phone || '',
            ngo_email: data.ngo_email || '',
            ngo_website: data.ngo_website || '',
            ngo_logo: data.ngo_logo || '',
            registration_number: data.registration_number || '',
            pan_vat_number: data.pan_vat_number || '',
          };
          form.reset(sanitizedData);
          if (data.ngo_logo) setLogoPreview(data.ngo_logo);
        }
      } catch (error) {
        toast.error('Failed to fetch NGO settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const onSubmit = async (values: NgoFormValues) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        const value = (values as any)[key];
        if (key === 'ngo_logo') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, value || '');
        }
      });

      const response = await api.post('/ngo-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.data) {
        const data = response.data.data;
        const sanitizedData = {
            ngo_name: data.ngo_name || '',
            ngo_address: data.ngo_address || '',
            ngo_phone: data.ngo_phone || '',
            ngo_email: data.ngo_email || '',
            ngo_website: data.ngo_website || '',
            ngo_logo: data.ngo_logo || '',
            registration_number: data.registration_number || '',
            pan_vat_number: data.pan_vat_number || '',
          };
          form.reset(sanitizedData);
          if (data.ngo_logo) setLogoPreview(data.ngo_logo);
      }
      
      toast.success('NGO settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">NGO Settings</h1>
        <p className="text-gray-500">Manage your organization's information used for ID cards and reports.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            These details will appear on employee ID cards and official documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="ngo_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NGO Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Organization Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ngo_logo"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>NGO Logo (JPEG/PNG)</FormLabel>
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
                              reader.onloadend = () => setLogoPreview(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          {...fieldProps} 
                        />
                        {logoPreview && (
                          <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                            <img 
                              src={logoPreview} 
                              alt="NGO Logo Preview" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ngo_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Office Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ngo_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+977-01-XXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ngo_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Official Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@ngo.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ngo_website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.ngo.org" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registration_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Reg No. XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pan_vat_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN / VAT Number</FormLabel>
                      <FormControl>
                        <Input placeholder="XXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
