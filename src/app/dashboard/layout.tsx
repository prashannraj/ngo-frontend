'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Employees', icon: Users, href: '/dashboard/employees' },
  { name: 'Leaves', icon: Calendar, href: '/dashboard/leaves' },
  { name: 'Projects', icon: Briefcase, href: '/dashboard/projects' },
  { name: 'Assets', icon: Package, href: '/dashboard/assets' },
  { name: 'Fleet', icon: Car, href: '/dashboard/fleet' },
  { name: 'Attendance', icon: Clock, href: '/dashboard/attendance' },
  { name: 'NGO Settings', icon: Settings, href: '/dashboard/ngo-settings' },
  { name: 'Reports', icon: FileText, href: '/dashboard/reports' },
];

import { useLanguage } from '@/context/LanguageContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 bg-white border-r flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <span className="text-xl font-bold text-primary">NGO Office</span>
          ) : (
            <span className="text-xl font-bold text-primary">NGO</span>
          )}
        </div>

        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center p-3 rounded-lg transition-colors ${
                  pathname === item.href 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {isSidebarOpen && <span className="ml-3 font-medium">{t(item.name.toLowerCase())}</span>}
                </span>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <div className="flex items-center justify-around">
            <Button 
              variant={language === 'en' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setLanguage('en')}
              className="text-xs"
            >
              EN
            </Button>
            <Button 
              variant={language === 'np' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setLanguage('np')}
              className="text-xs"
            >
              नेपा
            </Button>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3 font-medium">{t('logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="w-6 h-6" />
          </Button>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-bold">{user.name}</p>
              <p className="text-xs text-gray-500">{user.roles?.[0]}</p>
            </div>
            <Avatar>
              <AvatarImage src={user.employee?.profile_picture} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
