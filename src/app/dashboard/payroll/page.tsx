'use client';

import { useState, useEffect } from 'react';
import { 
  Banknote, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  FileDown,
  MoreVertical,
  ArrowRight,
  Calculator,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Payroll {
  id: number;
  employee_id: number;
  month: string;
  year: number;
  basic_salary: string;
  allowances: string;
  deductions: string;
  net_salary: string;
  status: 'draft' | 'generated' | 'paid';
  payment_date: string | null;
  transaction_id: string | null;
  notes: string | null;
  employee: {
    id: number;
    name: string;
    photo: string | null;
    designation: { name: string } | null;
    department: { name: string } | null;
  } | null;
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [generating, setGenerating] = useState(false);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payrolls', { params: { month } });
      setPayrolls(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payrolls', error);
      toast.error('Could not load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month]);

  const handleBulkGenerate = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/payrolls/bulk-generate', { month });
      toast.success(response.data.message);
      fetchPayrolls();
    } catch (error) {
      toast.error('Bulk generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/payrolls/${id}`, { status });
      toast.success(`Payroll marked as ${status}`);
      fetchPayrolls();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20">Paid</Badge>;
      case 'generated':
        return <Badge className="bg-blue-500 hover:bg-blue-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/20">Generated</Badge>;
      case 'draft':
      default:
        return <Badge className="bg-slate-400 hover:bg-slate-500 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-slate-400/20">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in-fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 tracking-tight">
            Payroll Ledger
          </h1>
          <p className="text-slate-500 font-semibold mt-1 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            Strategic compensation management and financial oversight
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            className="w-48 h-12 rounded-2xl border-white/20 glass shadow-lg font-bold text-slate-700"
          />
          <Button 
            onClick={handleBulkGenerate} 
            disabled={generating}
            className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-900/20 group relative overflow-hidden"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-125 transition-transform" />
                Bulk Generate
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/20 shadow-xl rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Payroll Value</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">
                  ${payrolls.reduce((acc, curr) => acc + parseFloat(curr.net_salary), 0).toLocaleString()}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:rotate-12 transition-transform">
                <Banknote className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[65%]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20 shadow-xl rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Pending Slips</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">
                  {payrolls.filter(p => p.status !== 'paid').length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:rotate-12 transition-transform">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 w-[40%]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20 shadow-xl rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Slips Disbursed</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">
                  {payrolls.filter(p => p.status === 'paid').length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:rotate-12 transition-transform">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[25%]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="glass border-white/20 shadow-2xl rounded-[40px] overflow-hidden border-none ring-1 ring-white/20">
        <CardHeader className="bg-slate-50/50 border-b border-white/20 px-10 py-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Active Payroll Cycles</CardTitle>
            <CardDescription className="font-bold text-slate-400">Manage disbursement and tax compliance across all departments</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-2xl border-slate-200 font-bold text-slate-600 h-10 px-5 gap-2">
              <FileDown className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="hover:bg-transparent border-white/20">
                <TableHead className="px-10 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Employee Profile</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">Basic Salary</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">Allowances</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">Deductions</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">Net Payable</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">Disbursement Status</TableHead>
                <TableHead className="pr-10 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Simulating Payment Calculations...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-5 bg-slate-50 rounded-full border border-slate-100">
                        <AlertCircle className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs tracking-widest">No payroll data found for this period</p>
                      <Button onClick={handleBulkGenerate} variant="link" className="font-black text-primary text-xs uppercase underline decoration-2 underline-offset-4">Initialize Batch Cycle</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map((payroll) => (
                  <TableRow key={payroll.id} className="group border-white/10 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center font-black text-slate-500 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                          {payroll.employee?.photo ? (
                                <img src={payroll.employee.photo} alt={payroll.employee.name} className="w-full h-full object-cover" />
                            ) : (
                                payroll.employee?.name?.charAt(0)
                            )}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-base leading-tight tracking-tight">
                            {payroll.employee?.name}
                          </div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                             {payroll.employee?.designation?.name}
                             <span className="w-1 h-1 bg-slate-300 rounded-full" />
                             {payroll.employee?.department?.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-slate-600">${payroll.basic_salary}</TableCell>
                    <TableCell className="font-black text-emerald-600">+${payroll.allowances}</TableCell>
                    <TableCell className="font-black text-rose-500">-${payroll.deductions}</TableCell>
                    <TableCell className="font-black text-slate-900 text-lg tracking-tighter">
                       ${payroll.net_salary}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payroll.status)}
                    </TableCell>
                    <TableCell className="pr-10 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "h-10 w-10 p-0 rounded-xl hover:bg-slate-100 focus:outline-none")}>
                          <MoreVertical className="w-5 h-5 text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 glass shadow-2xl">
                          <DropdownMenuItem className="rounded-xl font-bold gap-3 py-3 text-slate-600">
                            <Eye className="w-4 h-4" /> View payslip details
                          </DropdownMenuItem>
                          {payroll.status !== 'paid' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(payroll.id, 'paid')}
                                className="rounded-xl font-bold gap-3 py-3 text-emerald-600 bg-emerald-50/50"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Mark as disbursed
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-100" />
                              <DropdownMenuItem className="rounded-xl font-bold gap-3 py-3 text-slate-600">
                                <Plus className="w-4 h-4" /> Add custom adjustment
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Footer Branding */}
      <div className="pt-12 pb-6 text-center border-t border-slate-100">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
            Powered by Appan Information Architecture System v4.0.1
         </p>
      </div>
    </div>
  );
}
