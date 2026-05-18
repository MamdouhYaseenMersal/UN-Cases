import { useState } from 'react';
import { RefugeeCase, CaseStatus, HistoryEntry, Priority, User as AppUser, Attachment } from '../types';
import { 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileEdit,
  ExternalLink,
  Filter,
  Download,
  Search,
  X,
  History,
  Info,
  DollarSign,
  ArrowUpDown,
  Calendar,
  Building,
  User,
  Stethoscope,
  Plus,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  Loader2,
  Paperclip
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CaseListProps {
  cases: RefugeeCase[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: CaseStatus) => void;
  onUpdateCase?: (updatedCase: RefugeeCase) => void;
  searchQuery: string;
  currentUser: AppUser;
}

type SortField = 'createdAt' | 'fullName' | 'status' | 'nationality' | 'priority';
type SortOrder = 'asc' | 'desc';

export default function CaseList({ cases, onDelete, onUpdateStatus, onUpdateCase, searchQuery, currentUser }: CaseListProps) {
  const [selectedCase, setSelectedCase] = useState<RefugeeCase | null>(null);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'All'>('All');
  const [nationalityFilter, setNationalityFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editCost, setEditCost] = useState<number | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'All' | string>('All');
  const [newService, setNewService] = useState({ type: '', provider: '', notes: '' });
  const [showAddService, setShowAddService] = useState(false);
  const [editingBreakdown, setEditingBreakdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newAttachment, setNewAttachment] = useState({ name: '', url: '' });
  const [showAddAttachment, setShowAddAttachment] = useState(false);

  const handleAddService = () => {
    if (selectedCase && newService.type && newService.provider && onUpdateCase) {
      setIsUpdating(true);
      setTimeout(() => {
        const serviceRecord = {
          id: Math.random().toString(36).substr(2, 9),
          unhcrId: selectedCase.unhcrId,
          ...newService,
          date: new Date().toISOString()
        };
        const historyEntry = {
          date: new Date().toISOString(),
          action: 'إضافة خدمة طبية',
          details: `تم تقديم خدمة: ${newService.type} بواسطة ${newService.provider}`,
          user: currentUser.name
        };
        const updated = {
          ...selectedCase,
          services: [...(selectedCase.services || []), serviceRecord],
          history: [historyEntry, ...(selectedCase.history || [])]
        };
        onUpdateCase(updated);
        setSelectedCase(updated);
        setNewService({ type: '', provider: '', notes: '' });
        setShowAddService(false);
        setIsUpdating(false);
      }, 800);
    }
  };

  const handleAddAttachment = () => {
    if (selectedCase && newAttachment.name && newAttachment.url && onUpdateCase) {
      setIsUpdating(true);
      setTimeout(() => {
        const attachment: Attachment = {
          ...newAttachment,
          date: new Date().toISOString()
        };
        const historyEntry = {
          date: new Date().toISOString(),
          action: 'إضافة مرفق',
          details: `تمت إضافة ملف جديد: ${newAttachment.name}`,
          user: currentUser.name
        };
        const updated = {
          ...selectedCase,
          attachments: [...(selectedCase.attachments || []), attachment],
          history: [historyEntry, ...(selectedCase.history || [])]
        };
        onUpdateCase(updated);
        setSelectedCase(updated);
        setNewAttachment({ name: '', url: '' });
        setShowAddAttachment(false);
        setIsUpdating(false);
      }, 800);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const headers = [
        'UNHCR ID', 'Full Name', 'Type', 'Nationality', 'Gender', 'Age', 'Status', 
        'Priority', 'Hospital', 'Diagnosis', 'Estimated Cost', 'Real Cost', 'Created At'
      ];
      
      const rows = filteredCases.map(c => [
        c.unhcrId,
        c.fullName,
        c.type,
        c.nationality,
        c.gender,
        c.age,
        c.status,
        c.priority,
        c.hospital,
        c.diagnosis.replace(/,/g, ';'), // Prevent CSV breaking
        c.estimatedCost,
        c.realCost,
        format(new Date(c.createdAt), 'yyyy-MM-dd')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `refugee_cases_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 2000);
  };

  const updateCostBreakdown = (field: string, value: number) => {
    if (selectedCase && onUpdateCase) {
      const updatedBreakdown = {
        ...(selectedCase.costBreakdown || { medication: 0, consultation: 0, procedure: 0, other: 0 }),
        [field]: value
      };
      const total = (
        (updatedBreakdown.medication || 0) + 
        (updatedBreakdown.consultation || 0) + 
        (updatedBreakdown.procedure || 0) + 
        (updatedBreakdown.other || 0)
      );
      const updated = {
        ...selectedCase,
        costBreakdown: updatedBreakdown,
        realCost: total
      };
      onUpdateCase(updated);
      setSelectedCase(updated);
    }
  };

  const handleCostUpdate = () => {
    if (selectedCase && editCost !== null && onUpdateCase) {
      setIsUpdating(true);
      setTimeout(() => {
        const historyEntry = {
          date: new Date().toISOString(),
          action: 'تحديث التكلفة الفعلية',
          details: `تم تحديث التكلفة من ${selectedCase.realCost || 0} إلى ${editCost}`,
          user: currentUser.name
        };
        const updated = {
          ...selectedCase,
          realCost: editCost,
          history: [historyEntry, ...(selectedCase.history || [])]
        };
        onUpdateCase(updated);
        setSelectedCase(updated);
        setEditCost(null);
        setIsUpdating(false);
      }, 700);
    }
  };

  const nationalities = Array.from(new Set(cases.map(c => c.nationality)));

  const actionTypes = Array.from(new Set(selectedCase?.history?.map(h => h.action) || []));
  const filteredHistory = selectedCase?.history?.filter(h => 
    historyFilter === 'All' || h.action === historyFilter
  ) || [];

  const filteredCases = cases
    .filter(c => {
      const matchesSearch = 
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.unhcrId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nationality.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesNationality = nationalityFilter === 'All' || c.nationality === nationalityFilter;
      
      return matchesSearch && matchesStatus && matchesNationality;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'priority') {
        const priorityScore = { High: 3, Medium: 2, Low: 1 };
        comparison = (priorityScore[a.priority as Priority] || 0) - (priorityScore[b.priority as Priority] || 0);
      } else if (sortField === 'status' || sortField === 'nationality' || sortField === 'fullName') {
        comparison = (a[sortField] || '').localeCompare(b[sortField] || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const StatusIcon = ({ status }: { status: CaseStatus }) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case 'Cancelled': return <XCircle className="w-3 h-3 text-rose-500" />;
      default: return <Clock className="w-3 h-3 text-amber-500" />;
    }
  };

  const DetailRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
        {Icon && <Icon size={10} />}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-900">{value || 'N/A'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">إدارة قاعدة البيانات</h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 gap-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Active Registry & Case Lifecycle Management</p>
          
          {/* Enhanced Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded">
              <Filter size={12} className="text-slate-400" />
              <select 
                className="text-[10px] font-bold uppercase tracking-widest outline-none bg-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">جميع الحالات</option>
                <option value="Pending">قيد الانتظار</option>
                <option value="Delivered">تم التنفيذ</option>
                <option value="Cancelled">ملغي</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded">
              <User size={12} className="text-slate-400" />
              <select 
                className="text-[10px] font-bold uppercase tracking-widest outline-none bg-transparent"
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
              >
                <option value="All">جميع الجنسيات</option>
                {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select 
                className="text-[10px] font-bold uppercase tracking-widest outline-none bg-transparent"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
              >
                <option value="createdAt">تاريخ التسجيل</option>
                <option value="fullName">الاسم</option>
                <option value="status">الحالة</option>
                <option value="nationality">الجنسية</option>
                <option value="priority">الأولوية</option>
              </select>
            </div>

            <button 
              onClick={handleExportCSV}
              disabled={isExporting}
              className="btn-secondary py-1.5 px-3 text-[10px] uppercase tracking-widest relative"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download size={14} />
                  تصدير
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-none border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900 text-white uppercase">
              <tr>
                <th className="px-6 py-4 font-black tracking-widest">رقم الحالة / ID</th>
                <th 
                  className="px-6 py-4 font-black tracking-widest text-right cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('fullName')}
                >
                  الاسم المسجل
                </th>
                <th className="px-6 py-4 font-black tracking-widest">المسار / Track</th>
                <th className="px-6 py-4 font-black tracking-widest">الجنسية</th>
                <th className="px-6 py-4 font-black tracking-widest text-left">التشخيص</th>
                <th className="px-6 py-4 font-black tracking-widest text-left">التاريخ</th>
                <th className="px-6 py-4 font-black tracking-widest">الحالة</th>
                <th className="px-6 py-4 font-black tracking-widest">المتابعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCases.map((c) => (
                <tr key={c.id} className={cn(
                  "hover:bg-slate-50 transition-colors group",
                  c.type === 'emergency' ? "status-urgent" : "status-scheduled"
                )}>
                  <td className="px-6 py-5 font-mono text-slate-500 font-bold">
                    {c.unhcrId}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <button 
                        onClick={() => setSelectedCase(c)}
                        className="font-black text-slate-900 text-sm tracking-tight hover:text-brand-primary text-right"
                      >
                        {c.fullName}
                      </button>
                      <div className="flex items-center justify-start gap-2 flex-row-reverse">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.gender} • {c.age} YRS</span>
                        {c.priority && (
                          <span className={cn(
                            "text-[8px] px-1 rounded font-black uppercase tracking-tighter",
                            c.priority === 'High' ? "bg-rose-100 text-rose-600" :
                            c.priority === 'Medium' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                          )}>
                            {c.priority}
                          </span>
                        )}
                        {c.assignedTo && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded flex items-center gap-0.5" title="Assigned Staff">
                            <ShieldCheck size={8} />
                            {c.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-[0.1em]",
                      c.type === 'emergency' 
                        ? "bg-rose-100 text-rose-700" 
                        : "bg-blue-100 text-blue-700"
                    )}>
                      {c.type === 'emergency' ? 'urgent' : 'scheduled'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-700 font-bold">{c.nationality}</td>
                  <td className="px-6 py-5 max-w-[150px] truncate font-medium text-slate-500 text-left" title={c.diagnosis}>
                    {c.diagnosis}
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium text-left">
                    {format(new Date(c.createdAt), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest",
                      c.status === 'Delivered' ? "bg-emerald-50 text-emerald-700" : 
                      c.status === 'Cancelled' ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                    )}>
                      <StatusIcon status={c.status} />
                      {c.status === 'Delivered' ? 'Delivered' : c.status === 'Cancelled' ? 'Cancelled' : 'Pending'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onUpdateStatus(c.id, 'Delivered')}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded border border-transparent hover:border-emerald-100 hover:shadow-sm transition-all"
                        title="Mark as Delivered"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button 
                        onClick={() => setSelectedCase(c)}
                        className="p-1.5 hover:bg-blue-50 text-brand-primary rounded border border-transparent hover:border-blue-100 hover:shadow-sm transition-all"
                        title="View Details"
                      >
                        <Info size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(c.id)}
                        disabled={currentUser.role !== 'admin'}
                        className={cn(
                          "p-1.5 rounded border border-transparent transition-all",
                          currentUser.role === 'admin' 
                            ? "hover:bg-rose-50 text-rose-600 hover:border-rose-100 hover:shadow-sm" 
                            : "opacity-30 cursor-not-allowed text-slate-400"
                        )}
                        title={currentUser.role === 'admin' ? "Delete Case" : "Admin access required"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold uppercase tracking-widest">No Cases Found</p>
                      <p className="text-xs font-medium mt-1">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded shadow-2xl relative">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 flex items-center justify-center font-black text-2xl rounded",
                  selectedCase.type === 'emergency' ? "bg-rose-600" : "bg-brand-primary"
                )}>
                  {selectedCase.fullName[0]}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black tracking-tight">{selectedCase.fullName}</h2>
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-75">
                    <span>{selectedCase.unhcrId}</span>
                    <span>•</span>
                    <span>{selectedCase.nationality}</span>
                    <span>•</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-sm",
                      selectedCase.status === 'Delivered' ? "bg-emerald-500/20 text-emerald-400" : 
                      selectedCase.status === 'Cancelled' ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {selectedCase.status}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-8">
                  {/* Personal & Logisitic */}
                  <div className="glass-card p-6 grid grid-cols-2 gap-6 rounded-none">
                    <DetailRow label="الاسم الكامل" value={selectedCase.fullName} icon={User} />
                    <DetailRow label="الجنسية" value={selectedCase.nationality} />
                    <DetailRow label="الأولوية" value={selectedCase.priority} icon={AlertCircle} />
                    <DetailRow label="جهة الحجز" value={selectedCase.bookingEntity} icon={Building} />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">الموافقة الطبية</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit",
                        selectedCase.medicalApprovalStatus === 'Approved' ? "bg-emerald-100 text-emerald-700" :
                        selectedCase.medicalApprovalStatus === 'Rejected' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {selectedCase.medicalApprovalStatus === 'Approved' ? 'تمت الموافقة' : 
                         selectedCase.medicalApprovalStatus === 'Rejected' ? 'مرفوضة' : 'تحت الانتظار'}
                      </span>
                    </div>
                    <DetailRow label="المسؤول المباشر" value={selectedCase.assignedTo} icon={ShieldCheck} />
                    <DetailRow label="العمر" value={`${selectedCase.age} سنة`} />
                    <DetailRow label="النوع" value={selectedCase.gender} />
                    <DetailRow label="رقم الهاتف" value={selectedCase.mobileNumber} />
                    <DetailRow label="الموقع الحالي" value={selectedCase.currentLocation} />
                  </div>

                  {/* Medical Report */}
                  <div className="glass-card p-6 space-y-6 rounded-none text-right">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center justify-end gap-2">
                      التقرير الطبي المفصل
                      <Stethoscope size={14} className="text-brand-primary" />
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">التشخيص الحالي</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed italic">
                          {selectedCase.diagnosis}
                        </p>
                      </div>
                      {selectedCase.treatmentPlan && (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">خطة العلاج</span>
                          <p className="text-sm text-slate-700 bg-blue-50/30 p-3 rounded border border-blue-100/50 leading-relaxed">
                            {selectedCase.treatmentPlan}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-right">
                        <DetailRow label="المرفق الطبي" value={selectedCase.hospital} icon={Building} />
                        <DetailRow label="التدخل" value={selectedCase.intervention} />
                      </div>
                    </div>
                  </div>

                  {/* Services Provided */}
                  <div className="glass-card p-6 space-y-6 rounded-none text-right">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <button 
                        onClick={() => setShowAddService(!showAddService)}
                        className="p-1 hover:bg-slate-100 rounded text-brand-primary transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                        الخدمات المقدمة
                        <ClipboardList size={14} className="text-brand-primary" />
                      </h3>
                    </div>

                    {showAddService && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-4 animate-in slide-in-from-top-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">نوع الخدمة</label>
                            <input 
                              type="text" 
                              className="input-field py-1 h-8 bg-white" 
                              value={newService.type}
                              onChange={(e) => setNewService({...newService, type: e.target.value})}
                              placeholder="مثال: غسيل كلى"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">مقدم الخدمة</label>
                            <input 
                              type="text" 
                              className="input-field py-1 h-8 bg-white" 
                              value={newService.provider}
                              onChange={(e) => setNewService({...newService, provider: e.target.value})}
                              placeholder="اسم الطبيب / المركز"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={handleAddService}
                          disabled={!newService.type || !newService.provider}
                          className="w-full btn-primary py-1.5 text-[10px] font-black tracking-widest disabled:opacity-50"
                        >
                          إضافة السجل
                        </button>
                      </div>
                    )}

                    <div className="space-y-3">
                      {selectedCase.services?.map((service) => (
                        <div key={service.id} className="p-3 bg-white border border-slate-100 rounded flex items-center justify-between shadow-sm">
                          <div className="text-[10px] text-slate-400 font-bold">
                            {format(new Date(service.date), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900">{service.type}</p>
                            <p className="text-[10px] text-slate-500">{service.provider}</p>
                          </div>
                        </div>
                      ))}
                      {(!selectedCase.services || selectedCase.services.length === 0) && (
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase py-4">No services recorded yet</p>
                      )}
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="glass-card p-6 space-y-6 rounded-none text-right">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <button 
                        onClick={() => setShowAddAttachment(!showAddAttachment)}
                        className="p-1 hover:bg-slate-100 rounded text-brand-primary transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                        المرفقات والوثائق
                        <Paperclip size={14} className="text-brand-primary" />
                      </h3>
                    </div>

                    {showAddAttachment && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-4 animate-in slide-in-from-top-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">اسم الملف</label>
                            <input 
                              type="text" 
                              className="input-field py-1 h-8 bg-white" 
                              value={newAttachment.name}
                              onChange={(e) => setNewAttachment({...newAttachment, name: e.target.value})}
                              placeholder="مثال: صورة الهوية"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">الرابط</label>
                            <input 
                              type="text" 
                              className="input-field py-1 h-8 bg-white" 
                              value={newAttachment.url}
                              onChange={(e) => setNewAttachment({...newAttachment, url: e.target.value})}
                              placeholder="URL للملف"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={handleAddAttachment}
                          disabled={!newAttachment.name || !newAttachment.url || isUpdating}
                          className="w-full btn-primary py-1.5 text-[10px] font-black tracking-widest disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : 'حفظ المرفق'}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCase.attachments?.map((att, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-100 rounded flex items-center justify-between shadow-sm">
                          <div className="text-[10px] text-slate-400 font-bold">
                            {format(new Date(att.date), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div className="flex flex-col">
                              <p className="text-xs font-black text-slate-900">{att.name}</p>
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-brand-primary font-bold hover:underline">عرض الملف</a>
                            </div>
                            <div className="p-2 bg-slate-50 rounded">
                              <Paperclip size={12} className="text-slate-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!selectedCase.attachments || selectedCase.attachments.length === 0) && (
                        <p className="col-span-full text-center text-[10px] text-slate-400 font-bold uppercase py-4">لا توجد مرفقات مضافة</p>
                      )}
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="glass-card p-6 bg-brand-primary/5 border-brand-primary/20 rounded-none">
                    <div className="flex items-center justify-between border-b border-brand-primary/10 pb-2 mb-4">
                      <button 
                        onClick={() => setEditingBreakdown(!editingBreakdown)}
                        className="p-1 hover:bg-white/50 rounded text-brand-primary transition-colors"
                      >
                        <FileEdit size={14} />
                      </button>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                        البيانات المالية وتفاصيل التكلفة
                        <DollarSign size={14} className="text-brand-primary" />
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">التكلفة التقديرية</span>
                          <span className="text-xl font-black text-slate-900 tracking-tighter">
                            {selectedCase.estimatedCost?.toLocaleString() || 0} <small className="text-xs font-bold opacity-50">ج.م</small>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">إجمالي التكلفة الفعلية</span>
                          <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                            {selectedCase.realCost?.toLocaleString() || 0} <small className="text-sm font-bold opacity-50 text-slate-400">ج.م</small>
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/50 p-4 border border-brand-primary/10 space-y-3 rounded">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block border-b border-slate-100 pb-1 mb-2">توزيع المصروفات (ج.م)</span>
                        {[
                          { label: 'الأدوية', key: 'medication' },
                          { label: 'الاستشارات', key: 'consultation' },
                          { label: 'الإجراءات الطبيبة', key: 'procedure' },
                          { label: 'أخرى', key: 'other' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between gap-4">
                            {editingBreakdown ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input 
                                  type="number" 
                                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded outline-none focus:border-brand-primary transition-colors font-mono"
                                  value={(selectedCase.costBreakdown as any)?.[item.key] || 0}
                                  onChange={(e) => updateCostBreakdown(item.key, parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-[10px] font-bold text-slate-400">ج.م</span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-900 bg-white/40 px-2 py-1 rounded">
                                {((selectedCase.costBreakdown as any)?.[item.key] || 0).toLocaleString()} <small className="text-[9px] opacity-50 font-medium">ج.م</small>
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-medium w-24 text-right">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: History */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500">
                      <Filter size={10} />
                      <select 
                        className="bg-transparent outline-none"
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                      >
                        <option value="All">الكل</option>
                        {actionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                      سجل المتابعة
                      <History size={14} className="text-brand-primary" />
                    </h3>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {filteredHistory.map((entry, idx) => (
                      <div key={idx} className="relative pb-4 pl-4 border-l border-slate-200 last:border-0 last:pb-0">
                        <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-brand-primary"></div>
                        <div className="bg-white p-3 rounded shadow-sm border border-slate-100 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{entry.action}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{format(new Date(entry.date), 'HH:mm • dd/MM')}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight text-right">{entry.details}</p>
                          <div className="mt-1 pt-1 border-t border-slate-50 flex items-center justify-start">
                            <span className="text-[8px] text-slate-300 font-bold uppercase">بواسطة: {entry.user}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredHistory.length === 0 && (
                      <div className="text-center py-8 bg-white rounded border border-slate-100">
                        <History size={24} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">No records found</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-[9px] text-slate-400 font-mono">
                CASE_UID: {selectedCase.id} // CREATED_AT: {format(new Date(selectedCase.createdAt), 'yyyy-MM-dd HH:mm')}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onUpdateStatus(selectedCase.id, 'Cancelled')}
                  className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded hover:bg-rose-100 transition-colors"
                >
                  Cancel Case
                </button>
                <button 
                  onClick={() => onUpdateStatus(selectedCase.id, 'Delivered')}
                  className="px-6 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Mark as Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
