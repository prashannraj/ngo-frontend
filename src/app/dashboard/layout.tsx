'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Briefcase, 
  Package, 
  Car, 
  Clock, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Globe
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Employees', icon: Users, href: '/dashboard/employees' },
  { name: 'Leaves', icon: Calendar, href: '/dashboard/leaves' },
  { name: 'Projects', icon: Briefcase, href: '/dashboard/projects' },
  { name: 'Assets', icon: Package, href: '/dashboard/assets' },
  { name: 'Fleet', icon: Car, href: '/dashboard/fleet' },
  { name: 'Attendance', icon: Clock, href: '/dashboard/attendance' },
  { name: 'WFH', icon: Calendar, href: '/dashboard/wfh' },
  { name: 'Timesheets', icon: Briefcase, href: '/dashboard/timesheets' },
  { name: 'Appraisals', icon: FileText, href: '/dashboard/appraisals' },
  { name: 'Travel', icon: Car, href: '/dashboard/travel' },
  { name: 'Notifications', icon: Bell, href: '/dashboard/notifications' },
  { name: 'NGO Settings', icon: Settings, href: '/dashboard/ngo-settings' },
  { name: 'Reports', icon: FileText, href: '/dashboard/reports' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [ngoSettings, setNgoSettings] = useState<any>(null);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }

    const fetchSettings = async () => {
      try {
        const res = await api.get('/ngo-settings');
        setNgoSettings(res.data.data);
      } catch (e) {
        console.error('Failed to fetch NGO settings');
      }
    };
    fetchSettings();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-24'
        } transition-all duration-500 ease-in-out glass m-4 mr-0 rounded-[32px] flex flex-col z-20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20`}
      >
        {/* Responsive Logo Area */}
        <div className={`p-6 transition-all duration-500 border-b border-border/50 ${isSidebarOpen ? 'px-8' : 'px-4'}`}>
          <Link href="/dashboard" prefetch={false} className="flex items-center gap-4 group">
            <div className={`relative transition-all duration-500 flex-shrink-0 bg-white shadow-inner border border-border/50 overflow-hidden rounded-2xl ${isSidebarOpen ? 'w-14 h-14' : 'w-12 h-12 mx-auto ring-2 ring-primary/10'}`}>
              <Image 
                src={ngoSettings?.ngo_logo || '/appan_logo.png'} 
                alt="Appan Logo"
                fill
                className="object-contain p-1 group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col animate-in-fade-left">
                <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 tracking-tight leading-none mb-1">
                  Appan HRM
                </span>
                <div className="flex items-center gap-2">
                   <div className="h-[2px] w-4 bg-primary/40 rounded-full" />
                   <span className="text-[10px] uppercase font-black text-primary/60 tracking-[0.3em] leading-none">
                     Automation
                   </span>
                </div>
              </div>
            )}
          </Link>
        </div>

        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-1.5 pt-6">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href} prefetch={false}>
                  <div className={`group flex items-center p-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                      : 'hover:bg-primary/5 hover:text-primary text-slate-500'
                  }`}>
                    <item.icon className={`transition-transform duration-300 ${isActive ? 'w-5 h-5' : 'w-5 h-5 group-hover:scale-110'}`} />
                    {isSidebarOpen && (
                      <span className={`ml-4 font-bold text-sm tracking-wide ${isActive ? 'text-white' : ''}`}>
                        {t(item.name.toLowerCase())}
                      </span>
                    )}
                    {!isSidebarOpen && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-1 h-6 bg-primary rounded-full absolute right-0" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Card at Sidebar Bottom */}
        <div className="p-4 border-t border-border/50 bg-slate-50/30">
          <Button 
            variant="ghost" 
            className={`w-full flex items-center group transition-colors rounded-2xl ${isSidebarOpen ? 'justify-start px-4 text-red-500 hover:bg-red-50 hover:text-red-600' : 'justify-center p-0 h-12 w-12 mx-auto hover:bg-red-50 text-red-500'}`} 
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="ml-3 font-bold text-sm">{t('logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Premium Header */}
        <header className="h-20 glass m-4 mb-0 rounded-3xl flex items-center justify-between px-8 z-10 shadow-sm border border-white/20">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-2xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm border border-transparent hover:border-primary/20"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="hidden md:flex flex-col">
               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t(pathname.split('/').pop() || 'dashboard')}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-4 pr-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-xl border border-primary/20 hover:bg-primary/5 gap-2 px-3 flex items-center h-8"
                )}
              >
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-[10px] uppercase font-black tracking-tight">{language === 'en' ? 'English' : 'नेपाली'}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass border-primary/10 rounded-2xl p-1 shadow-2xl">
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${language === 'en' ? 'bg-primary text-white' : 'hover:bg-primary/5'}`}
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('np')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${language === 'np' ? 'bg-primary text-white' : 'hover:bg-primary/5'}`}
                >
                  नेपाली (Nepali)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="relative rounded-2xl hover:bg-primary/5 transition-all group">
               <Bell className="w-5 h-5 text-slate-500 group-hover:text-primary" />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Button>
            
            <div className="h-8 w-[1px] bg-border/40 mx-1" />

            <div className="flex items-center space-x-4 pl-2 group cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-primary transition-colors">{user.name}</span>
                <span className="text-[9px] font-black text-primary px-3 py-1 rounded-full bg-primary/10 uppercase tracking-[0.1em]">
                  {user.roles?.[0] || 'Member'}
                </span>
              </div>
              <Avatar className="h-10 w-10 border-2 border-white shadow-lg group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                <AvatarImage src={user.employee?.profile_picture} />
                <AvatarFallback className="bg-slate-100 text-primary font-black text-lg">{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 w-full bg-transparent">
          <div className="p-8 pb-12 w-full animate-in-fade max-w-[1600px] mx-auto">
            {children}
            
            {/* Dashboard Footer */}
            <footer className="mt-20 pt-8 border-t border-border/30 flex flex-col items-center justify-center space-y-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
               <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-800">
                 Powered by Appan Technology Pvt. Ltd.
               </p>
               <p className="text-[9px] text-slate-500 font-bold">
                 © 2026 Appan HRM Office Automation. Secure Hybrid Enterprise Edition.
               </p>
            </footer>
          </div>
        </ScrollArea>
      </main>

      <style jsx global>{`
        .animate-in-fade {
          animation: fade-in 0.6s ease-out;
        }
        .animate-in-fade-left {
          animation: fade-in-left 0.4s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
