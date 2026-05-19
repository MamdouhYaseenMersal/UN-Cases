import React, { useState, useMemo } from 'react';
import { RefugeeCase, CashPayment, Priority, User as AppUser, HistoryEntry, FollowUp } from '../types';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  User, 
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
  PlusCircle,
  ClipboardList
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface CashManagementProps {
  cases: RefugeeCase[];
  onUpdateCase: (updated: RefugeeCase) => void;
  currentUser: AppUser;
}

export default function CashManagement({ cases, onUpdateCase, currentUser }: CashManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'date' | 'patientName' | 'status' | 'netAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [editingCashDetails, setEditingCashDetails] = useState<(CashPayment & { patientName: string; caseId: string }) | null>(null);
  const [newCashFollowUp, setNewCashFollowUp] = useState('');
  const [addModalLineItems, setAddModalLineItems] = useState<{id: string, name: string, cost: number, discount: number}[]>([]);
  const [addModalLineForm, setAddModalLineForm] = useState({ name: '', cost: 0, discount: 0 });

  const [cashForm, setCashForm] = useState({
    serviceName: '',
    provider: '',
    totalAmount: 0,
    discountPercentage: 0,
    includedServices: '',
    status: 'Registered' as any
  });

  const [lineItemForm, setLineItemForm] = useState({ name: '', cost: 0, discount: 0 });

  const allCashPayments = useMemo(() => {
    const payments: (CashPayment & { patientName: string; caseId: string })[] = [];
    cases.forEach(c => {
      if (c.cashPayments) {
        c.cashPayments.forEach(payment => {
          payments.push({ ...payment, patientName: c.fullName, caseId: c.id });
        });
      }
    });
    return payments.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [cases]);

  const filteredPayments = useMemo(() => {
    const filtered = allCashPayments.filter(p => {
      const matchesSearch = 
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.provider.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      
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
  }, [allCashPayments, searchQuery, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddPayment = () => {
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    if (selectedCase && cashForm.serviceName) {
      const finalLineItems = addModalLineItems.length > 0 ? addModalLineItems : [];
      let totalAmount = cashForm.totalAmount;
      let netAmount = cashForm.totalAmount * (1 - cashForm.discountPercentage / 100);

      if (finalLineItems.length > 0) {
        totalAmount = finalLineItems.reduce((sum, item) => sum + item.cost, 0);
        netAmount = finalLineItems.reduce((sum, item) => sum + (item.cost * (1 - item.discount / 100)), 0);
      }

      const history: HistoryEntry[] = [{
        date: new Date().toISOString(),
        action: 'تسجيل دفع كاش',
        details: 'تم تسجيل معاملة كاش جديدة في النظام',
        user: currentUser.name
      }];

      const newPayment: CashPayment = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        serviceName: cashForm.serviceName,
        provider: cashForm.provider || 'N/A',
        totalAmount,
        discountPercentage: cashForm.discountPercentage,
        netAmount,
        status: cashForm.status,
        includedServices: finalLineItems.length > 0 
          ? finalLineItems.map(item => `${item.name} (${item.cost} EGP)`)
          : cashForm.includedServices.split(',').map(s => s.trim()),
        history: history,
        followUps: [],
        lineItems: finalLineItems
      };

      const updatedCase: RefugeeCase = {
        ...selectedCase,
        cashPayments: [...(selectedCase.cashPayments || []), newPayment],
        history: [{
          date: new Date().toISOString(),
          action: 'إضافة معاملة كاش',
          details: `إضافة معاملة كاش لخدمة ${cashForm.serviceName} بقيمة ${netAmount.toLocaleString()} EGP`,
          user: currentUser.name
        }, ...(selectedCase.history || [])]
      };

      onUpdateCase(updatedCase);
      setShowAddModal(false);
      setCashForm({
        serviceName: '',
        provider: '',
        totalAmount: 0,
        discountPercentage: 0,
        includedServices: '',
        status: 'Registered'
      });
      setAddModalLineItems([]);
      setSelectedCaseId('');
    }
  };

  const handleAddModalLineItem = () => {
    if (!addModalLineForm.name || addModalLineForm.cost <= 0) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...addModalLineForm
    };
    setAddModalLineItems([...addModalLineItems, newItem]);
    setAddModalLineForm({ name: '', cost: 0, discount: 0 });
  };

  const handleAddLineItem = () => {
    if (!editingCashDetails || !lineItemForm.name || lineItemForm.cost <= 0) return;

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...lineItemForm
    };

    const updatedLineItems = [...(editingCashDetails.lineItems || []), newItem];
    const totalAmount = updatedLineItems.reduce((sum, item) => sum + item.cost, 0);
    const netAmount = updatedLineItems.reduce((sum, item) => sum + (item.cost * (1 - item.discount / 100)), 0);

    const updatedPayment: CashPayment = {
      ...editingCashDetails,
      lineItems: updatedLineItems,
      totalAmount,
      netAmount,
      status: (editingCashDetails.status === 'Registered') ? 'Under Review' : editingCashDetails.status,
      includedServices: updatedLineItems.map(item => `${item.name} (${item.cost} EGP)`)
    };

    const targetCase = cases.find(c => c.id === editingCashDetails.caseId);
    if (targetCase) {
      const updatedCase: RefugeeCase = {
        ...targetCase,
        cashPayments: (targetCase.cashPayments || []).map(p => p.id === updatedPayment.id ? updatedPayment : p)
      };
      onUpdateCase(updatedCase);
      setEditingCashDetails({ ...updatedPayment, patientName: editingCashDetails.patientName, caseId: editingCashDetails.caseId });
      setLineItemForm({ name: '', cost: 0, discount: 0 });
    }
  };

  const handleRemoveLineItem = (itemId: string) => {
    if (!editingCashDetails) return;

    const updatedLineItems = (editingCashDetails.lineItems || []).filter(item => item.id !== itemId);
    const totalAmount = updatedLineItems.reduce((sum, item) => sum + item.cost, 0);
    const netAmount = updatedLineItems.reduce((sum, item) => sum + (item.cost * (1 - item.discount / 100)), 0);

    const updatedPayment: CashPayment = {
      ...editingCashDetails,
      lineItems: updatedLineItems,
      totalAmount,
      netAmount,
      includedServices: updatedLineItems.map(item => `${item.name} (${item.cost} EGP)`)
    };

    const targetCase = cases.find(c => c.id === editingCashDetails.caseId);
    if (targetCase) {
      const updatedCase: RefugeeCase = {
        ...targetCase,
        cashPayments: (targetCase.cashPayments || []).map(p => p.id === updatedPayment.id ? updatedPayment : p)
      };
      onUpdateCase(updatedCase);
      setEditingCashDetails({ ...updatedPayment, patientName: editingCashDetails.patientName, caseId: editingCashDetails.caseId });
    }
  };

  const handleAddCashFollowUp = () => {
    if (!editingCashDetails || !newCashFollowUp) return;

    const followUp = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      comment: newCashFollowUp,
      user: currentUser.name
    };

    const updatedPayment: CashPayment = {
      ...editingCashDetails,
      followUps: [followUp, ...(editingCashDetails.followUps || [])]
    };

    const targetCase = cases.find(c => c.id === editingCashDetails.caseId);
    if (targetCase) {
      const updatedCase: RefugeeCase = {
        ...targetCase,
        cashPayments: (targetCase.cashPayments || []).map(p => p.id === updatedPayment.id ? updatedPayment : p)
      };
      onUpdateCase(updatedCase);
      setEditingCashDetails({ ...updatedPayment, patientName: editingCashDetails.patientName, caseId: editingCashDetails.caseId });
      setNewCashFollowUp('');
    }
  };

  const handleUpdatePaymentStatus = (caseId: string, paymentId: string, newStatus: any) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase) {
      const updatedPayments = (targetCase.cashPayments || []).map(p => {
        if (p.id === paymentId) {
          const entry: HistoryEntry = {
            date: new Date().toISOString(),
            action: 'تحديث حالة دفع كاش',
            details: `تغيير الحالة من ${p.status} إلى ${newStatus}`,
            user: currentUser.name
          };
          return { 
            ...p, 
            status: newStatus,
            history: [entry, ...(p.history || [])]
          };
        }
        return p;
      });

      onUpdateCase({
        ...targetCase,
        cashPayments: updatedPayments
      });
      
      if (editingCashDetails) {
        setEditingCashDetails(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const handleDeletePayment = (caseId: string, paymentId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase) {
      onUpdateCase({
        ...targetCase,
        cashPayments: (targetCase.cashPayments || []).filter(p => p.id !== paymentId)
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">إدارة معاملات الكاش</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Cash Payment Management & Tracking</p>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 bg-white border-l-4 border-l-brand-primary">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المعاملات</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-black text-slate-800 tracking-tight">{filteredPayments.length}</p>
            <span className="text-[9px] text-slate-400 font-bold">من إجمالي {allCashPayments.length}</span>
          </div>
        </div>
          <div className="glass-card p-6 bg-white border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تحت المراجعة / Review</p>
          <p className="text-2xl font-black text-amber-600 tracking-tight">
            {filteredPayments.filter(p => p.status === 'Under Review' || p.status === 'Financial Review').reduce((sum, p) => sum + p.netAmount, 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span>
          </p>
        </div>
        <div className="glass-card p-6 bg-white border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المدفوع كاش</p>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            {filteredPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netAmount, 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span>
          </p>
        </div>
        <div className="glass-card p-6 bg-white border-l-4 border-l-slate-900">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Plus className="text-brand-primary" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">إضافة معاملة كاش</span>
          </button>
        </div>
      </div>

      {/* search and filter */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="بحث باسم المريض أو الخدمة الكاش..." 
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
            <option value="Under Review">قيد المراجعة / Under Review</option>
            <option value="Financial Review">المراجعة المالية</option>
            <option value="Processed">معالجة / Processed</option>
            <option value="Paid">مدفوع / Paid</option>
            <option value="Cancelled">ملغي / Cancelled</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold">
              <th className="px-6 py-4 font-black tracking-widest text-right cursor-pointer hover:bg-slate-800" onClick={() => toggleSort('date')}>التاريخ</th>
              <th className="px-6 py-4 font-black tracking-widest text-right cursor-pointer hover:bg-slate-800" onClick={() => toggleSort('patientName')}>المريض</th>
              <th className="px-6 py-4 font-black tracking-widest text-right">الخدمة</th>
              <th className="px-6 py-4 font-black tracking-widest text-right">المزود</th>
              <th className="px-6 py-4 font-black tracking-widest text-right">الصافي</th>
              <th className="px-6 py-4 font-black tracking-widest text-center cursor-pointer hover:bg-slate-800" onClick={() => toggleSort('status')}>الحالة</th>
              <th className="px-6 py-4 font-black tracking-widest text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPayments.map((p) => {
              const targetCase = cases.find(c => c.id === p.caseId);
              const relatedService = targetCase?.serviceSchedule?.find(s => p.includedServices.includes(s.serviceName) || p.serviceName === s.serviceName);
              const isReminding = p.reminderDate && new Date(p.reminderDate) <= new Date();

              return (
                <tr key={p.id} className={cn(
                  "group hover:bg-slate-50 transition-colors",
                  isReminding && "bg-rose-50/30"
                )}>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                    <div className="flex flex-col gap-1">
                      <span>{p.date ? format(new Date(p.date), 'dd/MM/yyyy') : 'N/A'}</span>
                      {p.reminderDate && (
                        <div className={cn(
                          "flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-full w-fit font-black uppercase",
                          isReminding ? "bg-rose-500 text-white animate-bounce" : "bg-slate-100 text-slate-500"
                        )}>
                          <Bell size={8} />
                          تذكير: {format(new Date(p.reminderDate), 'dd/MM')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">{p.patientName}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{p.caseId}</span>
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
                  <td className="px-6 py-4 font-medium text-xs text-slate-600">{p.serviceName}</td>
                  <td className="px-6 py-4 font-medium text-xs text-slate-600">{p.provider}</td>
                  <td className="px-6 py-4 font-black text-emerald-600 text-sm">{p.netAmount.toLocaleString()} EGP</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-1 rounded",
                        p.status === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                        p.status === 'Under Review' ? "bg-amber-100 text-amber-700" :
                        p.status === 'Financial Review' ? "bg-blue-600 text-white" :
                        p.status === 'Processed' ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {p.status}
                      </span>
                      {(p.status === 'Under Review' || p.status === 'Financial Review') && (
                        <input 
                          type="date" 
                          className="text-[8px] border-none bg-slate-50 p-1 rounded font-bold cursor-pointer hover:bg-slate-100 focus:ring-0"
                          title="Set Reminder Date"
                          value={p.reminderDate ? format(new Date(p.reminderDate), 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = e.target.value;
                            const targetCase = cases.find(c => c.id === p.caseId);
                            if (targetCase) {
                              const updatedPayments = (targetCase.cashPayments || []).map(pay => pay.id === p.id ? { ...pay, reminderDate: date } : pay);
                              onUpdateCase({ ...targetCase, cashPayments: updatedPayments });
                            }
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setEditingCashDetails(p)} className="p-1.5 text-slate-300 hover:text-emerald-500 transition-colors"><PlusCircle size={16} /></button>
                      <button onClick={() => handleDeletePayment(p.caseId, p.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Cash Detail Modal */}
      {editingCashDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-emerald-900 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded shadow-lg text-white">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter uppercase">إدارة حركات الكاش (Cash Transaction Detail)</h3>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-300 uppercase tracking-widest">
                    <span>Patient: {editingCashDetails.patientName}</span>
                    <span>•</span>
                    <span>Service: {editingCashDetails.serviceName}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setEditingCashDetails(null)} className="p-2 hover:bg-white/10 rounded transition-colors text-white/60">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b-2 border-emerald-500 pb-1">إعدادات الدفع الكلي</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <label className="text-[8px] font-black uppercase text-slate-400">الحالة</label>
                          <select 
                            className={cn(
                              "text-[10px] font-black uppercase px-3 py-1 rounded border-none focus:ring-0 cursor-pointer shadow-sm",
                              editingCashDetails.status === 'Paid' ? "bg-emerald-600 text-white" :
                              editingCashDetails.status === 'Under Review' ? "bg-amber-500 text-white" :
                              editingCashDetails.status === 'Financial Review' ? "bg-blue-600 text-white" :
                              editingCashDetails.status === 'Processed' ? "bg-blue-100 text-slate-800" : "bg-rose-500 text-white"
                            )}
                            value={editingCashDetails.status}
                            onChange={(e) => handleUpdatePaymentStatus(editingCashDetails.caseId, editingCashDetails.id, e.target.value)}
                          >
                            <option value="Registered">Registered</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Financial Review">Financial Review</option>
                            <option value="Processed">Processed</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded border border-slate-200">
                      <div>
                        <label className="label-caps mb-1 block">إجمالي المبلغ (Total)</label>
                        <input 
                          type="number" 
                          className="input-field font-black" 
                          value={editingCashDetails.totalAmount || 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = {
                              ...editingCashDetails,
                              totalAmount: val,
                              netAmount: val * (1 - (editingCashDetails.discountPercentage / 100))
                            };
                            setEditingCashDetails(updated);
                            
                            const targetCase = cases.find(c => c.id === editingCashDetails.caseId);
                            if (targetCase) {
                              onUpdateCase({
                                ...targetCase,
                                cashPayments: (targetCase.cashPayments || []).map(p => p.id === updated.id ? updated : p)
                              });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="label-caps mb-1 block">نسبة الخصم الكلية %</label>
                        <input 
                          type="number" 
                          className="input-field font-bold text-rose-500" 
                          value={editingCashDetails.discountPercentage || 0} 
                          onChange={(e) => {
                            const disc = parseFloat(e.target.value) || 0;
                            const updated = {
                              ...editingCashDetails,
                              discountPercentage: disc,
                              netAmount: editingCashDetails.totalAmount * (1 - disc / 100)
                            };
                            setEditingCashDetails(updated);
                            
                            const targetCase = cases.find(c => c.id === editingCashDetails.caseId);
                            if (targetCase) {
                              onUpdateCase({
                                ...targetCase,
                                cashPayments: (targetCase.cashPayments || []).map(p => p.id === updated.id ? updated : p)
                              });
                            }
                          }} 
                        />
                      </div>
                      <div className="flex flex-col justify-center items-center bg-emerald-600 text-white rounded shadow-lg p-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">المبلغ الصافي (Net)</span>
                        <span className="text-xl font-black">{editingCashDetails.netAmount.toLocaleString()} EGP</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                         تفاصيل بنود الخدمة (Line Items)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border border-slate-100">
                        <div className="md:col-span-2">
                          <label className="label-caps mb-1 block">اسم البند</label>
                          <input type="text" className="input-field" value={lineItemForm.name} onChange={(e) => setLineItemForm({...lineItemForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="label-caps mb-1 block">التكلفة</label>
                          <input type="number" className="input-field" value={lineItemForm.cost || ''} onChange={(e) => setLineItemForm({...lineItemForm, cost: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                          <label className="label-caps mb-1 block">الخصم %</label>
                          <input type="number" className="input-field" value={lineItemForm.discount || ''} onChange={(e) => setLineItemForm({...lineItemForm, discount: parseFloat(e.target.value) || 0})} />
                        </div>
                      </div>
                      <button 
                        onClick={handleAddLineItem} 
                        className="btn-primary w-full py-3 bg-slate-900 border-none shadow-none hover:bg-slate-800"
                      >
                        إضافة بند مالي جديد للقائمة
                      </button>
                    </div>

                    <div className="overflow-hidden border border-slate-100 rounded bg-white">
                      <table className="w-full text-right text-[12px] border-collapse">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="p-4">البند</th>
                            <th className="p-4 text-center">التكلفة</th>
                            <th className="p-4 text-center">الصافي</th>
                            <th className="p-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(editingCashDetails.lineItems || []).map(item => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold">{item.name}</td>
                              <td className="p-4 text-center text-slate-500">{item.cost.toLocaleString()} EGP</td>
                              <td className="p-4 text-center text-emerald-600 font-black">{(item.cost * (1 - item.discount / 100)).toLocaleString()} EGP</td>
                              <td className="p-4 text-center"><button onClick={() => handleRemoveLineItem(item.id)} className="text-rose-400 hover:text-rose-600 p-2"><Trash2 size={16} /></button></td>
                            </tr>
                          ))}
                          {(!editingCashDetails.lineItems || editingCashDetails.lineItems.length === 0) && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-300 font-bold uppercase tracking-widest italic" >لا توجد بنود تفصيلية مسجلة</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-emerald-900 text-white p-6 rounded shadow-xl space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2">سجل المتابعات والتعليقات</h4>
                    <div className="space-y-4">
                      <textarea className="w-full bg-white/5 border border-white/20 rounded p-3 text-xs outline-none focus:border-white/40 h-24" placeholder="أضف ملاحظة حول الدفع الكاش..." value={newCashFollowUp} onChange={(e) => setNewCashFollowUp(e.target.value)} />
                      <button onClick={handleAddCashFollowUp} className="w-full bg-emerald-500 text-white py-2 text-[10px] font-black uppercase rounded shadow-lg">حفظ الملاحظة</button>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pl-2 custom-scrollbar">
                        {(editingCashDetails.followUps || []).map((fu) => (
                          <div key={fu.id} className="bg-white/5 border-r-2 border-emerald-400 p-4 text-right">
                            <div className="flex justify-between items-center opacity-60 text-[8px] font-black mb-1">
                              <span>{format(new Date(fu.date), 'dd/MM HH:mm')}</span>
                              <span>بواسطة: {fu.user}</span>
                            </div>
                            <p className="text-[11px] text-slate-200">{fu.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-100 flex justify-end">
              <button onClick={() => setEditingCashDetails(null)} className="bg-emerald-900 text-white px-12 py-3 font-black uppercase tracking-widest text-sm shadow-2xl">إنهاء وإغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl p-8 rounded shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">تسجيل معاملة كاش جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded text-slate-400"><Plus className="rotate-45" size={24} /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label-caps mb-1 block">اختر المريض</label>
                <select className="input-field" value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
                  <option value="">اختر من القائمة...</option>
                  {cases.filter(c => c.paymentType === 'Cash').map(c => <option key={c.id} value={c.id}>{c.fullName} ({c.unhcrId})</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label-caps mb-1 block">اسم الخدمة</label>
                <input type="text" className="input-field" placeholder="مثال: شراء أدوية عاجلة" value={cashForm.serviceName} onChange={(e) => setCashForm({...cashForm, serviceName: e.target.value})} />
              </div>
              <div>
                <label className="label-caps mb-1 block">المزود (اختياري)</label>
                <input type="text" className="input-field" placeholder="مثال: صيدلية كير" value={cashForm.provider} onChange={(e) => setCashForm({...cashForm, provider: e.target.value})} />
              </div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2 mb-2">
                  <ClipboardList size={14} className="text-emerald-500" />
                  تفاصيل بنود الخدمة (Line Items)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border border-slate-100">
                  <div className="md:col-span-2">
                    <label className="label-caps mb-1 block text-[8px]">اسم البند</label>
                    <input type="text" className="input-field py-1.5 text-xs" value={addModalLineForm.name} onChange={(e) => setAddModalLineForm({...addModalLineForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-caps mb-1 block text-[8px]">التكلفة</label>
                    <input type="number" className="input-field py-1.5 text-xs" value={addModalLineForm.cost || ''} onChange={(e) => setAddModalLineForm({...addModalLineForm, cost: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="label-caps mb-1 block text-[8px]">الخصم %</label>
                    <input type="number" className="input-field py-1.5 text-xs" value={addModalLineForm.discount || ''} onChange={(e) => setAddModalLineForm({...addModalLineForm, discount: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <button 
                  onClick={handleAddModalLineItem} 
                  className="w-full py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors rounded shadow-sm"
                >
                  إضافة البند
                </button>

                {addModalLineItems.length > 0 && (
                  <div className="overflow-hidden border border-slate-100 rounded bg-white">
                    <table className="w-full text-right text-[11px] border-collapse">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="p-3">البند</th>
                          <th className="p-3 text-center">التكلفة</th>
                          <th className="p-3 text-center">الخصم %</th>
                          <th className="p-3 text-center">الصافي</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {addModalLineItems.map(item => (
                          <tr key={item.id} className="border-b border-slate-50">
                            <td className="p-3 font-bold">{item.name}</td>
                            <td className="p-3 text-center">{item.cost.toLocaleString()}</td>
                            <td className="p-3 text-center text-rose-500">{item.discount}%</td>
                            <td className="p-3 text-center text-emerald-600 font-bold">{(item.cost * (1 - item.discount / 100)).toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => setAddModalLineItems(addModalLineItems.filter(i => i.id !== item.id))} className="text-rose-400 hover:text-rose-600"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {addModalLineItems.length === 0 && (
                <>
                  <div>
                    <label className="label-caps mb-1 block">القيمة الإجمالية (EGP)</label>
                    <input type="number" className="input-field" value={cashForm.totalAmount || ''} onChange={(e) => setCashForm({...cashForm, totalAmount: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="label-caps mb-1 block font-bold text-rose-500">نسبة الخصم %</label>
                    <input type="number" className="input-field text-rose-500 font-bold" value={cashForm.discountPercentage || ''} onChange={(e) => setCashForm({...cashForm, discountPercentage: parseFloat(e.target.value) || 0})} />
                  </div>
                </>
              )}

              <div className="md:col-span-2 bg-emerald-50 p-4 rounded border border-emerald-100 flex justify-between items-center shadow-inner">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">إجمالي المبلغ الصافي (Total Net):</span>
                <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                  {addModalLineItems.length > 0 
                    ? addModalLineItems.reduce((sum, item) => sum + (item.cost * (1 - item.discount / 100)), 0).toLocaleString()
                    : (cashForm.totalAmount * (1 - cashForm.discountPercentage / 100)).toLocaleString()} EGP
                </span>
              </div>
            </div>
            <button onClick={handleAddPayment} disabled={!selectedCaseId || (!cashForm.serviceName && addModalLineItems.length === 0)} className="w-full bg-slate-900 text-white py-4 font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-800 transition-colors shadow-xl">تأكيد وتسجيل المعاملة</button>
          </div>
        </div>
      )}
    </div>
  );
}
