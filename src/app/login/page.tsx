'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ShieldCheck, Briefcase, Users, LayoutDashboard, Database, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await api.post('/login', values);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Authentication Successful. Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Access Denied: Invalid Credentials');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 scale-105 animate-slow-pulse" 
        style={{ backgroundImage: `url('/login_bg.png')` }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-indigo-900/40" />

      {/* Floating Blobs for Depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] animate-blob animation-delay-2000" />

      <main className="relative z-20 w-full max-w-6xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Branding & Info Section */}
        <section className="hidden lg:flex flex-col space-y-8 animate-in-fade-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" /> Enterprise HRM Elite
            </div>
            <h1 className="text-6xl font-black text-white leading-tight">
              Appan HRM <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Office Automation</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md">
              Streamline your workforce, manage complex projects, and orchestrate organization-wide operations with surgical precision.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="p-4 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
              <Users className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">Human Capital</h3>
              <p className="text-slate-500 text-sm">Advanced employee lifecycle management.</p>
            </div>
            <div className="p-4 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
              <Briefcase className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">PMS Core</h3>
              <p className="text-slate-500 text-sm">Intelligent project and task synchronization.</p>
            </div>
            <div className="p-4 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
              <LayoutDashboard className="w-8 h-8 text-sky-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">Live Analytics</h3>
              <p className="text-slate-500 text-sm">Real-time operational visibility.</p>
            </div>
            <div className="p-4 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors group">
              <Database className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold mb-1">Unified Data</h3>
              <p className="text-slate-500 text-sm">One source of truth for NGO records.</p>
            </div>
          </div>
        </section>

        {/* Login Form Section */}
        <section className="animate-in-fade-right">
          <Card className="glass-extreme border-white/10 shadow-[0_0_50px_rgba(30,58,138,0.25)] rounded-[40px] overflow-hidden">
            <CardHeader className="space-y-2 pb-8 pt-10 text-center">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-blue-500/10">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <CardTitle className="text-3xl font-black text-white tracking-tight">Security Portal</CardTitle>
              <CardDescription className="text-slate-400 font-medium">
                Authorized staff entry only. Please provide your digital credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-slate-300 font-bold ml-1">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="username@appan.com" 
                            className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400/80 font-medium ml-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                          <FormLabel className="text-slate-300 font-bold">Access Password</FormLabel>
                          <span className="text-xs text-blue-400 font-bold cursor-pointer hover:underline">Forgot?</span>
                        </div>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••••••" 
                            className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400/80 font-medium ml-1" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-14 premium-gradient text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all group" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying Access...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Initialize Session <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-8 pt-8 border-t border-white/5 text-center space-y-2">
                 <p className="text-xs text-slate-500 uppercase font-black tracking-[0.2em]"> Powered by Appan Technology Pvt. Ltd. </p>
                 <p className="text-[10px] text-slate-600 font-medium tracking-tight"> © 2026 Appan HRM. All Corporate Rights Reserved. </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* CSS Utilities for this page */}
      <style jsx global>{`
        .glass-extreme {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(25px) saturate(180%);
          -webkit-backdrop-filter: blur(25px) saturate(180%);
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-slow-pulse {
          animation: pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1.05); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
