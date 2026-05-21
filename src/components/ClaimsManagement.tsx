import React, { useState, useMemo, useEffect } from 'react';
import { RefugeeCase, MedicalClaim, Priority, User as AppUser, ClaimStatus, HistoryEntry } from '../types';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Plus, 
  User, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  ArrowUpDown,
  FileText,
  Trash2,
  Bell,
  CheckSquare,
  Square,
  ChevronRight,
  Info,
  PlusCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface ClaimsManagementProps {
  cases: RefugeeCase[];
  onUpdateCase: (updated: RefugeeCase) => void;
  currentUser: AppUser;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  date: string;
}

export default function ClaimsManagement({ cases, onUpdateCase, currentUser }: ClaimsManagementProps) {
  const isFinancialAuthorized = currentUser.role === 'admin' || currentUser.role === 'financial';
  const [searchQuery, setSearchQuery] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('app_doctors');
    if (saved) {
      try {
        setAvailableDoctors(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'date' | 'patientName' | 'status' | 'netAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedClaimWithHistory, setSelectedClaimWithHistory] = useState<(MedicalClaim & { patientName: string; caseId: string }) | null>(null);
  const [editingClaimDetails, setEditingClaimDetails] = useState<(MedicalClaim & { patientName: string; caseId: string }) | null>(null);
  const [newClaimFollowUp, setNewClaimFollowUp] = useState('');
  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditForm, setInlineEditForm] = useState<Partial<MedicalClaim>>({});
  
  const [statusUpdatePending, setStatusUpdatePending] = useState<{ caseId: string; claimId: string; newStatus: ClaimStatus } | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  
  const [claimForm, setClaimForm] = useState({
    serviceName: '',
    provider: '',
    totalAmount: 0,
    discountPercentage: 0,
    includedServices: '',
    status: 'Registered' as ClaimStatus
  });

  const [lineItemForm, setLineItemForm] = useState({ name: '', cost: 0, discount: 0 });

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      date: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  const allClaims = useMemo(() => {
    const claims: (MedicalClaim & { patientName: string; caseId: string })[] = [];
    cases.forEach(c => {
      if (c.medicalClaims) {
        c.medicalClaims.forEach(claim => {
          claims.push({ ...claim, patientName: c.fullName, caseId: c.id });
        });
      }
    });
    return claims.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [cases]);

  const filteredClaims = useMemo(() => {
    const filtered = allClaims.filter(claim => {
      const matchesSearch = 
        claim.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.provider.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      } else if (sortField === 'patientName' || sortField === 'status') {
        comparison = (a[sortField] || '').localeCompare(b[sortField] || '');
      } else if (sortField === 'netAmount') {
        comparison = a.netAmount - b.netAmount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allClaims, searchQuery, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddClaim = () => {
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    if (selectedCase && claimForm.serviceName && claimForm.provider) {
      const net = claimForm.totalAmount * (1 - claimForm.discountPercentage / 100);
      const claimHistory: HistoryEntry[] = [{
        date: new Date().toISOString(),
        action: 'تسجيل المطالبة',
        details: 'تم تسجيل المطالبة لأول مرة في النظام',
        user: currentUser.name
      }];

      const newClaim: MedicalClaim = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        serviceName: claimForm.serviceName,
        provider: claimForm.provider,
        totalAmount: claimForm.totalAmount,
        discountPercentage: claimForm.discountPercentage,
        netAmount: net,
        status: claimForm.status,
        includedServices: claimForm.includedServices.split(',').map(s => s.trim()),
        history: claimHistory,
        lineItems: []
      };

      if (claimForm.status === 'Pending Approval') {
        addNotification(`مطالبة جديدة في انتظار الموافقة لـ ${selectedCase.fullName}`, 'warning');
      }

      const historyEntry = {
        date: new Date().toISOString(),
        action: 'إضافة مطالبة مالية',
        details: `تمت إضافة مطالبة جديدة لخدمة ${claimForm.serviceName} بقيمة ${net.toLocaleString()} EGP`,
        user: currentUser.name
      };

      const updatedCase: RefugeeCase = {
        ...selectedCase,
        medicalClaims: [...(selectedCase.medicalClaims || []), newClaim],
        history: [historyEntry, ...(selectedCase.history || [])]
      };

      onUpdateCase(updatedCase);
      setShowAddModal(false);
      setClaimForm({
        serviceName: '',
        provider: '',
        totalAmount: 0,
        discountPercentage: 0,
        includedServices: '',
        status: 'Registered'
      });
      setSelectedCaseId('');
    }
  };

  const handleAddLineItem = () => {
    if (!editingClaimDetails || !lineItemForm.name || lineItemForm.cost <= 0) return;

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...lineItemForm
    };

    const updatedLineItems = [...(editingClaimDetails.lineItems || []), newItem];
    const totalAmount = updatedLineItems.reduce((sum, item) => sum + item.cost, 0);
    const netAmount = updatedLineItems.reduce((sum, item) => sum + (item.cost * (1 - item.discount / 100)), 0);

    const updatedClaim: MedicalClaim = {
      ...editingClaimDetails,
      lineItems: updatedLineItems,
      totalAmount,
      netAmount,
      status: (editingClaimDetails.status === 'Registered' || editingClaimDetails.status === 'Pending Approval') ? 'Under Review' : editingClaimDetails.status,
      includedServices: updatedLineItems.map(item => `${item.name} (${item.cost} EGP)`)
    };

    const targetCase = cases.find(c => c.id === editingClaimDetails.caseId);
    if (targetCase) {
      const updatedCase: RefugeeCase = {
        ...targetCase,
        medicalClaims: (targetCase.medicalClaims || []).map(cl => cl.id === updatedClaim.id ? updatedClaim : cl)
      };
      onUpdateCase(updatedCase);
      setEditingClaimDetails({ ...updatedClaim, patientName: editingClaimDetails.patientName, caseId: editingClaimDetails.caseId });
      setLineItemForm({ name: '', cost: 0, discount: 0 });
    }
  };

  const handleRemoveLineItem = (itemId: string) => {
    if (!editingClaimDetails) return;

    const updatedLineItems = (editingClaimDetails.lineItems || []).filter(item => item.id !== itemId);
    const totalAmount = updatedLineItems.reduce((sum, item) => sum + item.cost, 0);
    const netAmount = updatedLineItems.reduce((sum, item) => sum + (item.cost * (1 - item.discount / 100)), 0);

    const updatedClaim: MedicalClaim = {
      ...editingClaimDetails,
      lineItems: updatedLineItems,
      totalAmount,
      netAmount,
      includedServices: updatedLineItems.map(item => `${item.name} (${item.cost} EGP)`)
    };

    const targetCase = cases.find(c => c.id === editingClaimDetails.caseId);
    if (targetCase) {
      const updatedCase: RefugeeCase = {
        ...targetCase,
        medicalClaims: (targetCase.medicalClaims || []).map(cl => cl.id === updatedClaim.id ? updatedClaim : cl)
      };
      onUpdateCase(updatedCase);
      setEditingClaimDetails({ ...updatedClaim, patientName: editingClaimDetails.patientName, caseId: editingClaimDetails.caseId });
    }
  };
  
  const handleAddClaimFollowUp = () => {
    if (!editingClaimDetails || !newClaimFollowUp) return;

    const followUp = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      comment: newClaimFollowUp,
      user: currentUser.name
    };

    const updatedClaim: MedicalClaim = {
      ...editingClaimDetails,
      followUps: [followUp, ...(editingClaimDetails.followUps || [])]
    };

    const targetCase = cases.find(c => c.id === editingClaimDetails.caseId);
    if (targetCase) {
      const updatedCase: RefugeeCase = {
        ...targetCase,
        medicalClaims: (targetCase.medicalClaims || []).map(cl => cl.id === updatedClaim.id ? updatedClaim : cl)
      };
      onUpdateCase(updatedCase);
      setEditingClaimDetails({ ...updatedClaim, patientName: editingClaimDetails.patientName, caseId: editingClaimDetails.caseId });
      setNewClaimFollowUp('');
    }
  };

  const handleUpdateClaimStatus = (caseId: string, claimId: string, newStatus: ClaimStatus, notes?: string) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase) {
      const updatedClaims = (targetCase.medicalClaims || []).map(cl => {
        if (cl.id === claimId) {
          const claimHistoryEntry: HistoryEntry = {
            date: new Date().toISOString(),
            action: 'تغيير حالة المطالبة',
            details: `تغيير الحالة من ${cl.status} إلى ${newStatus}${notes ? ` - ملاحظات: ${notes}` : ''}`,
            user: currentUser.name
          };
          return { 
            ...cl, 
            status: newStatus,
            history: [claimHistoryEntry, ...(cl.history || [])]
          };
        }
        return cl;
      });
      
      if (newStatus === 'Pending Approval') {
        addNotification(`تحديث: مطالبة بانتظار الموافقة لـ ${targetCase.fullName}`, 'warning');
      }

      const historyEntry = {
        date: new Date().toISOString(),
        action: 'تحديث حالة المطالبة',
        details: `تم تحديث حالة المطالبة لـ ${targetCase.fullName} إلى ${newStatus}${notes ? ` - ملاحظات: ${notes}` : ''}`,
        user: currentUser.name
      };

      onUpdateCase({
        ...targetCase,
        medicalClaims: updatedClaims,
        history: [historyEntry, ...(targetCase.history || [])]
      });
      
      setStatusUpdatePending(null);
      setStatusNotes('');
    }
  };

  const handleBulkStatusUpdate = (newStatus: ClaimStatus) => {
    if (selectedClaimIds.size === 0) return;
    
    // Group selected claim IDs by caseId for efficient updating
    const claimsByCase = new Map<string, string[]>();
    allClaims.forEach(c => {
      if (selectedClaimIds.has(c.id)) {
        const existing = claimsByCase.get(c.caseId) || [];
        claimsByCase.set(c.caseId, [...existing, c.id]);
      }
    });

    claimsByCase.forEach((claimIds, caseId) => {
      const targetCase = cases.find(c => c.id === caseId);
      if (targetCase) {
        const updatedClaims = (targetCase.medicalClaims || []).map(cl => {
          if (claimIds.includes(cl.id)) {
            const claimHistoryEntry: HistoryEntry = {
              date: new Date().toISOString(),
              action: 'تحديث حالة (تغيير جماعي)',
              details: `تغيير الحالة إلى ${newStatus}`,
              user: currentUser.name
            };
            return { 
              ...cl, 
              status: newStatus,
              history: [claimHistoryEntry, ...(cl.history || [])]
            };
          }
          return cl;
        });

        onUpdateCase({
          ...targetCase,
          medicalClaims: updatedClaims,
          history: [{
            date: new Date().toISOString(),
            action: 'تحديث جماعي للمطالبات',
            details: `تم تحديث ${claimIds.length} مطالبات إلى ${newStatus}`,
            user: currentUser.name
          }, ...(targetCase.history || [])]
        });
      }
    });

    addNotification(`تم تحديث ${selectedClaimIds.size} مطالبات بنجاح`, 'success');
    setSelectedClaimIds(new Set());
  };

  const toggleSelectClaim = (id: string) => {
    const newSet = new Set(selectedClaimIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedClaimIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedClaimIds.size === filteredClaims.length) {
      setSelectedClaimIds(new Set());
    } else {
      setSelectedClaimIds(new Set(filteredClaims.map(c => c.id)));
    }
  };

  const handleDeleteClaim = (caseId: string, claimId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المطالبة؟')) return;
    
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase) {
      const updatedClaims = (targetCase.medicalClaims || []).filter(cl => cl.id !== claimId);
      
      onUpdateCase({
        ...targetCase,
        medicalClaims: updatedClaims
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Real-time Notifications Toast */}
      <div className="fixed top-24 left-6 z-[300] flex flex-col gap-2 pointer-events-none">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={cn(
              "p-4 rounded shadow-lg animate-in slide-in-from-left-8 duration-300 pointer-events-auto border-l-4 flex items-start gap-3 min-w-[300px]",
              notif.type === 'success' ? "bg-emerald-50 border-emerald-500 text-emerald-800" :
              notif.type === 'warning' ? "bg-amber-50 border-amber-500 text-amber-800" : "bg-blue-50 border-blue-500 text-blue-800"
            )}
          >
            <Bell size={18} className="mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest">{notif.type}</span>
              <span className="text-sm font-medium">{notif.message}</span>
              <span className="text-[9px] opacity-60 mt-1">{format(new Date(notif.date), 'HH:mm:ss')}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">المطالبات الطبية</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Financial Claims & Medical Settlement Records</p>
      </div>

      {!isFinancialAuthorized && (
        <div className="bg-amber-50 rounded-xl border border-dashed border-amber-205 p-4 text-amber-900 text-xs flex items-start gap-3 justify-start text-right">
          <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-850">🔒 تنبيه الصلاحيات والوصول المقيد (حالة قراءة فقط):</p>
            <p className="leading-relaxed text-slate-600 font-medium">
              أنت مسجل حالياً بدور <span className="text-amber-700 font-black">{currentUser.role === 'clinical' ? 'منسق طبي' : 'موظف تسجيل'}</span>. هذا التبويب للمراجعة والمطالبات المالية متاح لك <b>للقراءة والاطلاع فقط</b>. كافة إجراءات إصدار المطالبات الطبية، تسوية الحسابات وصرف الفواتير تتطلب حساب <b>مسؤول مالي (Financial Officer)</b> أو <b>مدير النظام</b>.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards and Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 bg-white border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المطالبات</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{filteredClaims.length}</p>
            <span className="text-[9px] text-slate-400 font-bold">من إجمالي {allClaims.length}</span>
          </div>
        </div>
        <div className="glass-card p-6 bg-white border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">في انتظار الموافقة</p>
          <p className="text-2xl font-black text-amber-600 tracking-tight">
            {filteredClaims.filter(c => c.status === 'Pending Approval' || c.status === 'Under Review').reduce((sum, c) => sum + c.netAmount, 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span>
          </p>
        </div>
        <div className="glass-card p-6 bg-white border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المدفوع (Paid)</p>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            {filteredClaims.filter(c => c.status === 'Paid').reduce((sum, c) => sum + c.netAmount, 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span>
          </p>
        </div>
        <div className="glass-card p-6 bg-white border-l-4 border-l-slate-900">
          <button 
            onClick={() => {
              if (!isFinancialAuthorized) {
                alert('عفواً، لا تملك الصلاحية المالية لإدراج مطالبات طبية جديدة. يرجى الدخول بصفة مسؤول مالي أو مدير النظام.');
                return;
              }
              setShowAddModal(true);
            }}
            className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-2 transition-colors",
              isFinancialAuthorized ? "hover:bg-slate-50 cursor-pointer" : "opacity-48 cursor-not-allowed bg-slate-50"
            )}
          >
            <Plus className={cn(isFinancialAuthorized ? "text-brand-primary" : "text-slate-400")} size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">إضافة مطالبة جديدة</span>
          </button>
        </div>
      </div>

      {/* search, filter and bulk actions */}
      <div className="glass-card p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="بحث باسم المريض أو الخدمة..." 
              className="input-field pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <select 
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">جميع الحالات / All Status</option>
              <option value="Registered">مسجلة / Registered</option>
              <option value="Pending Approval">في انتظار الموافقة</option>
              <option value="Under Review">قيد المراجعة</option>
              <option value="Financial Review">المراجعة المالية</option>
              <option value="Processed">تمت المعالجة</option>
              <option value="Paid">مدفوعة / Paid</option>
              <option value="Cancelled">ملغاة / Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions (visible only when items selected and user is admin) */}
        {selectedClaimIds.size > 0 && currentUser.role === 'admin' && (
          <div className="flex items-center gap-4 p-3 bg-slate-900 text-white rounded-sm animate-in fade-in zoom-in-95 duration-200">
            <span className="text-[10px] font-black uppercase tracking-widest mr-2">
              {selectedClaimIds.size} مطالبات مختارة
            </span>
            <div className="h-4 w-px bg-slate-700 mx-2" />
            <button 
              onClick={() => handleBulkStatusUpdate('Paid')}
              className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
            >
              <CheckCircle2 size={12} />
              صرف جماعي (Paid)
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('Processed')}
              className="text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
            >
              <CheckSquare size={12} />
              معالجة جماعية
            </button>
            <button 
              onClick={() => setSelectedClaimIds(new Set())}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              إلغاء التحديد
            </button>
          </div>
        )}
      </div>

      {/* Claims Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold">
              <th className="px-4 py-4 w-10">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white transition-colors">
                  {selectedClaimIds.size === filteredClaims.length && filteredClaims.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th 
                className="px-6 py-4 font-black tracking-widest text-right cursor-pointer hover:bg-slate-800"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center justify-end gap-1">
                  التاريخ
                  {sortField === 'date' && <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                </div>
              </th>
              <th 
                className="px-6 py-4 font-black tracking-widest text-right cursor-pointer hover:bg-slate-800"
                onClick={() => toggleSort('patientName')}
              >
                <div className="flex items-center justify-end gap-1">
                  المريض
                  {sortField === 'patientName' && <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                </div>
              </th>
              <th className="px-6 py-4 font-black tracking-widest text-right">الخدمة</th>
              <th className="px-6 py-4 font-black tracking-widest text-right">المزود</th>
              <th className="px-6 py-4 font-black tracking-widest text-right">القيمة</th>
              <th 
                className="px-6 py-4 font-black tracking-widest text-right cursor-pointer hover:bg-slate-800"
                onClick={() => toggleSort('netAmount')}
              >
                <div className="flex items-center justify-end gap-1">
                  الصافي
                  {sortField === 'netAmount' && <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                </div>
              </th>
              <th 
                className="px-6 py-4 font-black tracking-widest text-center cursor-pointer hover:bg-slate-800"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  الحالة
                  {sortField === 'status' && <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                </div>
              </th>
              <th className="px-6 py-4 font-black tracking-widest text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClaims.map((claim) => {
              const targetCase = cases.find(c => c.id === claim.caseId);
              const relatedService = targetCase?.serviceSchedule?.find(s => claim.includedServices.includes(s.serviceName) || claim.serviceName === s.serviceName);
              const isReminding = claim.reminderDate && new Date(claim.reminderDate) <= new Date();

              return (
                <tr key={claim.id} className={cn(
                  "group hover:bg-slate-50 transition-colors",
                  selectedClaimIds.has(claim.id) && "bg-blue-50/50",
                  isReminding && "bg-rose-50/30"
                )}>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => toggleSelectClaim(claim.id)}
                      className={cn(
                        "transition-colors",
                        selectedClaimIds.has(claim.id) ? "text-blue-600" : "text-slate-200 hover:text-slate-400"
                      )}
                    >
                      {selectedClaimIds.has(claim.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                    <div className="flex flex-col gap-1">
                      <span>{claim.date ? format(new Date(claim.date), 'dd/MM/yyyy') : 'N/A'}</span>
                      {claim.reminderDate && (
                        <div className={cn(
                          "flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-full w-fit font-black uppercase",
                          isReminding ? "bg-rose-500 text-white animate-bounce" : "bg-slate-100 text-slate-500"
                        )}>
                          <Bell size={8} />
                          تذكير: {format(new Date(claim.reminderDate), 'dd/MM')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">{claim.patientName}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{claim.caseId}</span>
                      {relatedService && (
                        <div className={cn(
                          "mt-1 flex items-center gap-1 text-[8px] font-black uppercase",
                          relatedService.status === 'Completed' ? "text-emerald-500" : "text-amber-500"
                        )}>
                          <CheckCircle2 size={8} />
                          الخدمة: {relatedService.status}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {inlineEditingId === claim.id ? (
                      <input 
                        type="text" 
                        className="input-field text-xs py-1" 
                        value={inlineEditForm.serviceName || ''} 
                        onChange={(e) => setInlineEditForm({...inlineEditForm, serviceName: e.target.value})}
                      />
                    ) : (
                      <span className="font-medium text-xs text-slate-600">{claim.serviceName}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {inlineEditingId === claim.id ? (
                      <input 
                        type="text" 
                        className="input-field text-xs py-1" 
                        value={inlineEditForm.provider || ''} 
                        onChange={(e) => setInlineEditForm({...inlineEditForm, provider: e.target.value})}
                      />
                    ) : (
                      <span className="font-medium text-xs text-slate-600">{claim.provider}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {inlineEditingId === claim.id ? (
                      <input 
                        type="number" 
                        className="input-field text-xs py-1" 
                        value={inlineEditForm.totalAmount || 0} 
                        onChange={(e) => {
                          const total = parseFloat(e.target.value) || 0;
                          const disc = inlineEditForm.discountPercentage || 0;
                          setInlineEditForm({...inlineEditForm, totalAmount: total, netAmount: total * (1 - disc / 100)});
                        }}
                      />
                    ) : (
                      <span className="text-xs text-slate-400 line-through">{claim.totalAmount.toLocaleString()} EGP</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {inlineEditingId === claim.id ? (
                      <div className="flex flex-col gap-1">
                        <input 
                          type="number" 
                          className="input-field text-xs py-1 text-rose-500 font-bold" 
                          placeholder="الخصم %"
                          value={inlineEditForm.discountPercentage || 0} 
                          onChange={(e) => {
                            const disc = parseFloat(e.target.value) || 0;
                            const total = inlineEditForm.totalAmount || 0;
                            setInlineEditForm({...inlineEditForm, discountPercentage: disc, netAmount: total * (1 - disc / 100)});
                          }}
                        />
                        <span className="text-[10px] font-black text-emerald-600">{(inlineEditForm.netAmount || 0).toLocaleString()} EGP</span>
                      </div>
                    ) : (
                      <span className="font-black text-emerald-600 text-sm">{claim.netAmount.toLocaleString()} EGP</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <select 
                        className={cn(
                          "text-[8px] font-black uppercase px-2 py-1 rounded border-none focus:ring-0 cursor-pointer transition-colors",
                          claim.status === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                          claim.status === 'Under Review' ? "bg-amber-100 text-amber-700" :
                          claim.status === 'Financial Review' ? "bg-blue-600 text-white" :
                          claim.status === 'Pending Approval' ? "bg-rose-100 text-rose-700 animate-pulse" :
                          claim.status === 'Processed' ? "bg-blue-100 text-blue-700" : 
                          claim.status === 'Cancelled' ? "bg-slate-500 text-white" : "bg-slate-100 text-slate-500"
                        )}
                        value={claim.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as ClaimStatus;
                          if (newStatus === 'Pending Approval' || newStatus === 'Under Review') {
                            setStatusUpdatePending({ caseId: claim.caseId, claimId: claim.id, newStatus });
                          } else {
                            handleUpdateClaimStatus(claim.caseId, claim.id, newStatus);
                          }
                        }}
                      >
                        <option value="Registered">Registered</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Financial Review">Financial Review</option>
                        <option value="Processed">Processed</option>
                        <option value="Paid">Paid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      
                      {(claim.status === 'Pending Approval' || claim.status === 'Under Review') && (
                        <input 
                          type="date" 
                          className="text-[8px] border-none bg-slate-50 p-1 rounded font-bold cursor-pointer hover:bg-slate-100 focus:ring-0"
                          title="Set Reminder Date"
                          value={claim.reminderDate ? format(new Date(claim.reminderDate), 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = e.target.value;
                            const targetCase = cases.find(c => c.id === claim.caseId);
                            if (targetCase) {
                              const updatedClaims = (targetCase.medicalClaims || []).map(cl => cl.id === claim.id ? { ...cl, reminderDate: date } : cl);
                              onUpdateCase({ ...targetCase, medicalClaims: updatedClaims });
                            }
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {inlineEditingId === claim.id ? (
                        <>
                          <button 
                            onClick={() => {
                              const targetCase = cases.find(c => c.id === claim.caseId);
                              if (targetCase) {
                                const updatedClaims = (targetCase.medicalClaims || []).map(cl => cl.id === claim.id ? { ...cl, ...inlineEditForm } : cl);
                                onUpdateCase({ ...targetCase, medicalClaims: updatedClaims });
                                setInlineEditingId(null);
                                addNotification('تم تحديث بيانات المطالبة بنجاح', 'success');
                              }
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Save Changes"
                          >
                            <CheckSquare size={16} />
                          </button>
                          <button 
                            onClick={() => setInlineEditingId(null)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Cancel"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setInlineEditingId(claim.id);
                              setInlineEditForm({
                                serviceName: claim.serviceName,
                                provider: claim.provider,
                                totalAmount: claim.totalAmount,
                                discountPercentage: claim.discountPercentage,
                                netAmount: claim.netAmount
                              });
                            }}
                            className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors"
                            title="Quick Edit"
                          >
                            <FileText size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingClaimDetails(claim)}
                            className="p-1.5 text-slate-300 hover:text-emerald-500 transition-colors"
                            title="Manage Detailed Line Items"
                          >
                            <PlusCircle size={16} />
                          </button>
                          <button 
                            onClick={() => setSelectedClaimWithHistory(claim)}
                            className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"
                            title="View Claim History"
                          >
                            <Clock size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredClaims.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <ClipboardList size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-bold uppercase tracking-widest">No Claims Found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Line Item / Detailed Breakdown Modal (Enhanced) */}
      {editingClaimDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary rounded shadow-lg">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter uppercase">إدارة تفاصيل المطالبة (Claim Detail Control)</h3>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Patient: {editingClaimDetails.patientName}</span>
                    <span>•</span>
                    <span>Service: {editingClaimDetails.serviceName}</span>
                    <span>•</span>
                    <span>Status: {editingClaimDetails.status}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setEditingClaimDetails(null)}
                className="p-2 hover:bg-white/10 rounded transition-colors text-white/60"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Financial Breakdown */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b-2 border-brand-primary pb-1">تفاصيل بنود الخدمة والتكاليف</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">STATUS:</span>
                        <select 
                          className={cn(
                            "text-[10px] font-black uppercase px-3 py-1 rounded border-none focus:ring-0 cursor-pointer transition-colors shadow-sm",
                            editingClaimDetails.status === 'Paid' ? "bg-emerald-600 text-white" :
                            editingClaimDetails.status === 'Under Review' ? "bg-amber-500 text-white" :
                            editingClaimDetails.status === 'Financial Review' ? "bg-blue-700 text-white" :
                            editingClaimDetails.status === 'Pending Approval' ? "bg-rose-500 text-white animate-pulse" :
                            editingClaimDetails.status === 'Processed' ? "bg-blue-600 text-white" : 
                            editingClaimDetails.status === 'Cancelled' ? "bg-slate-500 text-white" : "bg-slate-200 text-slate-700"
                          )}
                          value={editingClaimDetails.status}
                          onChange={(e) => handleUpdateClaimStatus(editingClaimDetails.caseId, editingClaimDetails.id, e.target.value as ClaimStatus)}
                        >
                          <option value="Registered">Registered</option>
                          <option value="Pending Approval">Pending Approval</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Financial Review">Financial Review</option>
                          <option value="Processed">Processed</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="label-caps mb-1 block">اسم البند / الخدمة</label>
                          <input 
                            type="text" className="input-field shadow-sm" 
                            placeholder="مثال: تحليل مخبري، صورة أشعة..."
                            value={lineItemForm.name}
                            onChange={(e) => setLineItemForm({...lineItemForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="label-caps mb-1 block">التكلفة (EGP)</label>
                          <input 
                            type="number" className="input-field shadow-sm" 
                            value={lineItemForm.cost || ''}
                            onChange={(e) => setLineItemForm({...lineItemForm, cost: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <label className="label-caps mb-1 block">الخصم %</label>
                          <input 
                            type="number" className="input-field shadow-sm" 
                            value={lineItemForm.discount || ''}
                            onChange={(e) => setLineItemForm({...lineItemForm, discount: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleAddLineItem}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Plus size={16} />
                        إضافة بند مالي جديد للمطالبة
                      </button>
                    </div>

                    <div className="overflow-hidden border border-slate-100 rounded">
                      <table className="w-full text-right text-[12px] border-collapse">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="p-4 border border-slate-700">البند</th>
                            <th className="p-4 border border-slate-700 text-center">التكلفة</th>
                            <th className="p-4 border border-slate-700 text-center">الخصم</th>
                            <th className="p-4 border border-slate-700 text-center">الصافي</th>
                            <th className="p-4 border border-slate-700"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(editingClaimDetails.lineItems || []).map(item => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold text-slate-800">{item.name}</td>
                              <td className="p-4 text-center text-slate-500">{item.cost.toLocaleString()} EGP</td>
                              <td className="p-4 text-center text-rose-500 font-bold">%{item.discount}</td>
                              <td className="p-4 text-center text-emerald-600 font-black">
                                {(item.cost * (1 - item.discount / 100)).toLocaleString()} EGP
                              </td>
                              <td className="p-4 text-center">
                                <button onClick={() => handleRemoveLineItem(item.id)} className="text-slate-300 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!editingClaimDetails.lineItems || editingClaimDetails.lineItems.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest opacity-50 italic bg-white">
                                <ClipboardList className="mx-auto mb-2 opacity-20" size={32} />
                                لم يتم إضافة أي بنود مالية لهذه المطالبة بعد
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-900">
                          <tr className="font-black text-slate-900">
                            <td className="p-4">إجمالي المطالبة النهائي</td>
                            <td className="p-4 text-center text-slate-400 line-through">
                              {(editingClaimDetails.lineItems || []).reduce((sum, item) => sum + item.cost, 0).toLocaleString()} EGP
                            </td>
                            <td className="p-4 text-center text-rose-500">
                              {editingClaimDetails.totalAmount > 0 
                                ? Math.round((1 - (editingClaimDetails.netAmount / editingClaimDetails.totalAmount)) * 100) 
                                : 0}% AVG
                            </td>
                            <td className="p-4 text-center text-emerald-600 text-lg">
                              {editingClaimDetails.netAmount.toLocaleString()} EGP
                            </td>
                            <td className="p-4"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column: Follow-up & History */}
                <div className="space-y-8">
                  <div className="bg-slate-900 text-white p-6 rounded shadow-xl space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2 flex items-center justify-between">
                       سجل المتابعات والتعليقات
                       <Clock size={14} className="text-brand-primary" />
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <textarea 
                          className="w-full bg-white/5 border border-white/20 rounded p-3 text-xs outline-none focus:border-brand-primary transition-colors resize-none h-24"
                          placeholder="أضف تعليق متابعة أو تحديث للمطالبة..."
                          value={newClaimFollowUp}
                          onChange={(e) => setNewClaimFollowUp(e.target.value)}
                        />
                        <button 
                          onClick={handleAddClaimFollowUp}
                          disabled={!newClaimFollowUp}
                          className="w-full btn-primary py-2 text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                        >
                          حفظ الملاحظة
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto pl-2 custom-scrollbar">
                        {(editingClaimDetails.followUps || []).map((fu) => (
                          <div key={fu.id} className="bg-white/5 border-r-2 border-brand-primary p-4 space-y-2 text-right">
                            <div className="flex justify-between items-center opacity-60 text-[8px] font-black mb-1">
                              <span>{format(new Date(fu.date), 'dd/MM HH:mm')}</span>
                              <span>بواسطة: {fu.user}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-200">{fu.comment}</p>
                          </div>
                        ))}
                        {(!editingClaimDetails.followUps || editingClaimDetails.followUps.length === 0) && (
                          <p className="text-center text-[9px] font-bold text-white/30 uppercase tracking-widest py-8">لا توجد متابعات مسجلة</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 pb-2">سجل الحركات (Transaction History)</h4>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                      {(editingClaimDetails.history || []).map((entry, idx) => (
                        <div key={idx} className="relative pl-6 pb-4 border-l border-slate-100 last:pb-0">
                          <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-slate-200 rounded-full ring-2 ring-white" />
                          <div className="flex flex-col gap-0.5">
                             <div className="flex justify-between items-center text-[9px]">
                               <span className="font-black text-slate-800 uppercase tracking-tight">{entry.action}</span>
                               <span className="text-slate-400">{format(new Date(entry.date), 'dd/MM HH:mm')}</span>
                             </div>
                             <p className="text-[10px] text-slate-500 font-medium leading-normal">{entry.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-100 flex justify-end">
              <button 
                onClick={() => setEditingClaimDetails(null)}
                className="bg-slate-900 text-white px-12 py-3 font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-slate-800 transition-colors"
              >
                إنهاء وإغلاق الإدارة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Notes Modal */}
      {statusUpdatePending && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 rounded shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Info size={24} />
              <h3 className="text-lg font-black uppercase tracking-tighter">إضافة ملاحظات للموافقة</h3>
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              يرجى إضافة أي تعليمات أو سياق إضافي للمراجعة المالية بخصوص هذه المطالبة.
            </p>
            <textarea
              className="input-field min-h-[100px] text-xs py-3"
              placeholder="اكتب ملاحظاتك هنا (اختياري)..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateClaimStatus(statusUpdatePending.caseId, statusUpdatePending.claimId, statusUpdatePending.newStatus, statusNotes)}
                className="flex-1 btn-primary py-3 font-black uppercase tracking-widest text-[10px]"
              >
                تحديث الحالة وإرسال
              </button>
              <button
                onClick={() => setStatusUpdatePending(null)}
                className="flex-1 btn-secondary py-3 font-black uppercase tracking-widest text-[10px]"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim History Modal */}
      {selectedClaimWithHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary rounded shadow-lg">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase">سجل حركات ومتابعات المطالبة</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complete Audit & Communication Trail</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedClaimWithHistory(null)}
                className="p-2 hover:bg-white/10 rounded transition-colors text-white/60"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 font-sans">
              <div className="bg-white p-4 rounded-sm space-y-2 border border-slate-100 mb-8 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">المريض:</span>
                  <span className="font-black text-slate-800">{selectedClaimWithHistory.patientName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest">الخدمة:</span>
                  <span className="font-black text-slate-800">{selectedClaimWithHistory.serviceName}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Transaction History */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 pb-2">سجل حركات النظام</h4>
                  <div className="space-y-4 pr-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {(selectedClaimWithHistory.history || []).map((entry, idx) => (
                      <div key={idx} className="relative pl-6 pb-6 border-l border-slate-100 last:pb-0">
                        <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-brand-primary rounded-full ring-2 ring-white" />
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{entry.action}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{format(new Date(entry.date), 'dd/MM HH:mm')}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{entry.details}</p>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">بواسطة: {entry.user}</span>
                        </div>
                      </div>
                    ))}
                    {(!selectedClaimWithHistory.history || selectedClaimWithHistory.history.length === 0) && (
                      <div className="text-center py-10 opacity-40">
                        <Clock size={32} className="mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">لا يوجد سجل حركات</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Follow-up Log (Matching Cash Management) */}
                <div className="bg-slate-900 text-white p-6 rounded shadow-xl space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2 flex items-center justify-between">
                    سجل المتابعات والتعليقات
                    <Clock size={14} className="text-brand-primary" />
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <textarea 
                        className="w-full bg-white/5 border border-white/20 rounded p-3 text-xs outline-none focus:border-brand-primary transition-colors resize-none h-24"
                        placeholder="أضف تعليق متابعة..."
                        value={newClaimFollowUp}
                        onChange={(e) => setNewClaimFollowUp(e.target.value)}
                      />
                      <button 
                        onClick={() => {
                          if (!selectedClaimWithHistory || !newClaimFollowUp) return;
                          const followUp = {
                            id: Math.random().toString(36).substr(2, 9),
                            date: new Date().toISOString(),
                            comment: newClaimFollowUp,
                            user: currentUser.name
                          };
                          const updatedClaim: MedicalClaim = {
                            ...selectedClaimWithHistory,
                            followUps: [followUp, ...(selectedClaimWithHistory.followUps || [])]
                          };
                          const targetCase = cases.find(c => c.id === selectedClaimWithHistory.caseId);
                          if (targetCase) {
                            onUpdateCase({
                              ...targetCase,
                              medicalClaims: (targetCase.medicalClaims || []).map(cl => cl.id === updatedClaim.id ? updatedClaim : cl)
                            });
                            setSelectedClaimWithHistory({ ...updatedClaim, patientName: selectedClaimWithHistory.patientName, caseId: selectedClaimWithHistory.caseId });
                            setNewClaimFollowUp('');
                          }
                        }}
                        disabled={!newClaimFollowUp}
                        className="w-full btn-primary py-2 text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                      >
                        حفظ الملاحظة
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[30vh] overflow-y-auto pl-2 custom-scrollbar">
                      {(selectedClaimWithHistory.followUps || []).map((fu) => (
                        <div key={fu.id} className="bg-white/5 border-r-2 border-brand-primary p-4 space-y-2 text-right">
                          <div className="flex justify-between items-center opacity-60 text-[8px] font-black mb-1">
                            <span>{format(new Date(fu.date), 'dd/MM HH:mm')}</span>
                            <span>بواسطة: {fu.user}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-200">{fu.comment}</p>
                        </div>
                      ))}
                      {(!selectedClaimWithHistory.followUps || selectedClaimWithHistory.followUps.length === 0) && (
                        <p className="text-center text-[9px] font-bold text-white/30 uppercase tracking-widest py-8">لا توجد متابعات مسجلة</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedClaimWithHistory(null)}
                className="bg-slate-900 text-white px-12 py-3 font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-slate-800 transition-colors"
              >
                إغلاق السجل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Claim Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl p-8 rounded shadow-2xl space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">إضافة مطالبة مالية جديدة</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Register New Medical Service Claim</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded transition-colors text-slate-400"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label-caps mb-1 block">اختر المريض</label>
                <select 
                  className="input-field"
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                >
                  <option value="">اختر من القائمة...</option>
                  {cases.filter(c => c.paymentType === 'Claim').map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.unhcrId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-caps mb-1 block">اسم الخدمة</label>
                <input 
                  type="text" className="input-field" 
                  placeholder="مثال: جراحة العظام"
                  value={claimForm.serviceName}
                  onChange={(e) => setClaimForm({...claimForm, serviceName: e.target.value})}
                />
              </div>

               <div>
                <label className="label-caps mb-1 block">المقدم / المؤسسة</label>
                <input 
                  type="text" className="input-field" 
                  placeholder="اسم المستشفى أو الطبيب"
                  value={claimForm.provider}
                  onChange={(e) => setClaimForm({...claimForm, provider: e.target.value})}
                  list="claims-providers-list"
                />
                <datalist id="claims-providers-list">
                  {availableDoctors.map((doc, idx) => (
                    <option key={idx} value={`${doc.name} (${doc.hospital})`} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="label-caps mb-1 block">القيمة الإجمالية</label>
                <input 
                  type="number" className="input-field" 
                  value={claimForm.totalAmount || ''}
                  onChange={(e) => setClaimForm({...claimForm, totalAmount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div>
                <label className="label-caps mb-1 block">نسبة الخصم %</label>
                <input 
                  type="number" className="input-field" 
                  value={claimForm.discountPercentage || ''}
                  onChange={(e) => setClaimForm({...claimForm, discountPercentage: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="md:col-span-2 bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">صافي القيمة المستحقة</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {(claimForm.totalAmount * (1 - (claimForm.discountPercentage / 100))).toLocaleString()} EGP
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">توفير بقيمة</span>
                  <span className="text-sm font-bold text-slate-600">
                    {(claimForm.totalAmount * (claimForm.discountPercentage / 100)).toLocaleString()} EGP
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="label-caps mb-1 block">الخدمات المتضمنة (افصل بفاصلة)</label>
                <input 
                  type="text" className="input-field" 
                  placeholder="تخدير، غرفة عمليات، مستلزمات..."
                  value={claimForm.includedServices}
                  onChange={(e) => setClaimForm({...claimForm, includedServices: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                onClick={handleAddClaim}
                disabled={!selectedCaseId || !claimForm.serviceName || !claimForm.provider}
                className="flex-1 btn-primary py-3 font-black uppercase tracking-widest disabled:opacity-50"
              >
                تسجيل المطالبة
              </button>
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn-secondary py-3 font-black uppercase tracking-widest"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
