/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Users, 
  Search, 
  Settings, 
  LogOut, 
  Bell,
  Menu,
  X,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  CalendarCheck,
  DollarSign
} from 'lucide-react';
import { RefugeeCase, CaseType, CaseStatus, User } from './types';
import Dashboard from './components/Dashboard';
import CaseForm from './components/CaseForm';
import CaseList from './components/CaseList';
import ClaimsManagement from './components/ClaimsManagement';
import CashManagement from './components/CashManagement';
import SettingsManagement from './components/SettingsManagement';
import MonthlyReportExport from './components/MonthlyReportExport';
import { cn } from './lib/utils';
import { ClipboardList } from 'lucide-react';

type View = 'dashboard' | 'new-case' | 'case-list' | 'claims' | 'cash' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [cases, setCases] = useState<RefugeeCase[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User>({
    id: '1',
    name: 'أحمد الفارسي',
    role: 'admin',
    email: 'ahmed@example.com'
  });

  // Load cases from localStorage on mount
  useEffect(() => {
    const savedCases = localStorage.getItem('refugee_cases');
    if (savedCases) {
      try {
        setCases(JSON.parse(savedCases));
      } catch (e) {
        console.error('Failed to parse saved cases', e);
      }
    }
  }, []);

  // Save cases to localStorage when they change
  useEffect(() => {
    localStorage.setItem('refugee_cases', JSON.stringify(cases));
  }, [cases]);

  const stats = useMemo(() => {
    const total = cases.length;
    const emergency = cases.filter(c => c.type === 'emergency').length;
    const scheduled = cases.filter(c => c.type === 'scheduled').length;
    const totalEstimatedCost = cases.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);
    
    // Total Real Cost is the sum of all claims and cash payments across all cases
    const totalRealCost = cases.reduce((acc, curr) => {
      const claimsTotal = (curr.medicalClaims || []).reduce((sum, cl) => sum + (cl.netAmount || 0), 0);
      const cashTotal = (curr.cashPayments || []).reduce((sum, cp) => sum + (cp.netAmount || 0), 0);
      return acc + claimsTotal + cashTotal;
    }, 0);

    // Detailed Cost Stats
    const costInProgress = cases.reduce((acc, curr) => {
      const claims = (curr.medicalClaims || []).filter(cl => ['Registered', 'Under Review'].includes(cl.status)).reduce((sum, cl) => sum + cl.netAmount, 0);
      const cash = (curr.cashPayments || []).filter(cp => ['Registered', 'Under Review'].includes(cp.status)).reduce((sum, cp) => sum + cp.netAmount, 0);
      return acc + claims + cash;
    }, 0);

    const costPaid = cases.reduce((acc, curr) => {
      const claims = (curr.medicalClaims || []).filter(cl => cl.status === 'Paid').reduce((sum, cl) => sum + cl.netAmount, 0);
      const cash = (curr.cashPayments || []).filter(cp => cp.status === 'Paid').reduce((sum, cp) => sum + cp.netAmount, 0);
      return acc + claims + cash;
    }, 0);

    const costPendingPayment = cases.reduce((acc, curr) => {
      const claims = (curr.medicalClaims || []).filter(cl => ['Financial Review', 'Processed'].includes(cl.status)).reduce((sum, cl) => sum + cl.netAmount, 0);
      const cash = (curr.cashPayments || []).filter(cp => ['Financial Review', 'Processed'].includes(cp.status)).reduce((sum, cp) => sum + cp.netAmount, 0);
      return acc + claims + cash;
    }, 0);

    return { total, emergency, scheduled, totalEstimatedCost, totalRealCost, costInProgress, costPaid, costPendingPayment };
  }, [cases]);

  const handleAddCase = (newCase: RefugeeCase) => {
    setCases(prev => [newCase, ...prev]);
    setView('case-list');
  };

  const handleDeleteCase = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('عفواً، لا تملك الصلاحية لإتمام هذا الإجراء');
      return;
    }
    setCases(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateStatus = (id: string, status: CaseStatus, details?: string) => {
    setCases(prev => prev.map(c => {
      if (c.id === id) {
        const historyEntry = {
          date: new Date().toISOString(),
          action: `تحديث الحالة إلى ${status}`,
          details: details || `تم تغيير حالة الطلب من ${c.status} إلى ${status}`,
          user: currentUser.name
        };
        return { 
          ...c, 
          status,
          history: [historyEntry, ...(c.history || [])]
        };
      }
      return c;
    }));
  };

  const handleUpdateCase = (updatedCase: RefugeeCase) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'new-case', label: 'تسجيل حالة جديدة', icon: PlusCircle },
    { id: 'case-list', label: 'إدارة الحالات', icon: Users },
    { id: 'claims', label: 'المطالبات الطبية', icon: ClipboardList },
    { id: 'cash', label: 'إدارة الكاش', icon: DollarSign },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex text-right geometric-bg overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-l border-slate-200 transition-all duration-300 flex flex-col z-50 shadow-sm",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-brand-primary rounded flex items-center justify-center flex-shrink-0 font-bold text-white text-xl">
            {currentUser.name[0]}
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <h1 className="font-bold text-slate-800 tracking-tight truncate">{currentUser.name}</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentUser.role === 'admin' ? 'مدير النظام' : 'موظف'}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded transition-all group relative",
                view === item.id 
                  ? "bg-slate-100 text-brand-primary border-r-4 border-brand-primary" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", view === item.id ? "text-brand-primary" : "group-hover:text-slate-900")} />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
              {!isSidebarOpen && (
                <div className="absolute right-full mr-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-slate-900 transition-all">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-brand-primary h-16 flex items-center justify-between px-8 z-40 shadow-lg text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex flex-col">
              <h2 className="font-bold text-sm tracking-tight">بوابة دعم اللاجئين ومتابعة الحالات</h2>
              <span className="text-[10px] opacity-75 font-medium uppercase tracking-widest">UNHCR Support Portal</span>
            </div>
            <div className="relative group hidden lg:block mr-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4 group-focus-within:text-white" />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="pr-10 pl-4 py-1.5 bg-white/10 border-none rounded text-sm text-white placeholder:text-white/40 focus:ring-1 focus:ring-white outline-none w-48 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-black tracking-wider transition-all border border-white/25 hover:border-white/50"
            >
              <ClipboardList size={14} className="text-yellow-300" />
              <span>المدقق الشهري / Reports</span>
            </button>
            <div className="hidden md:flex flex-col items-start text-xs text-left">
              <span className="font-bold">{currentUser.name}</span>
              <span className="opacity-75">{currentUser.role === 'admin' ? 'Administrator' : 'Staff Member'}</span>
            </div>
            <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
              <Bell size={20} className="text-white" />
              <span className="absolute top-2 left-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-brand-primary"></span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && (
                <Dashboard 
                  cases={cases} 
                  stats={stats} 
                  onUpdateCase={handleUpdateCase}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
              {view === 'new-case' && <CaseForm onSubmit={handleAddCase} currentUser={currentUser} />}
              {view === 'case-list' && (
                <CaseList 
                  cases={cases} 
                  onDelete={handleDeleteCase} 
                  onUpdateStatus={handleUpdateStatus} 
                  onUpdateCase={handleUpdateCase}
                  searchQuery={searchQuery}
                  currentUser={currentUser}
                />
              )}
              {view === 'claims' && <ClaimsManagement cases={cases} onUpdateCase={handleUpdateCase} currentUser={currentUser} />}
              {view === 'cash' && <CashManagement cases={cases} onUpdateCase={handleUpdateCase} currentUser={currentUser} />}
              {view === 'settings' && (
                <SettingsManagement 
                  currentUser={currentUser} 
                  onSwitchUser={(user) => setCurrentUser(user)}
                  onUpdateCurrentUser={(user) => setCurrentUser(user)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Monthly Report Export Modal */}
        <MonthlyReportExport 
          isOpen={isReportOpen} 
          onClose={() => setIsReportOpen(false)} 
          cases={cases}
          currentUser={currentUser}
        />
      </main>
    </div>
  );
}
