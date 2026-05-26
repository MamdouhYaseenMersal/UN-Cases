import { useState } from 'react';
import { RefugeeCase, CaseStatus, HistoryEntry, Priority, User as AppUser, Attachment, CaseType } from '../types';
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
  Phone,
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
  Paperclip,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import CaseForm from './CaseForm';
// @ts-ignore
import unhcrIdTemplate from '../assets/images/unhcr_id_template_1779718494955.png';

interface CaseListProps {
  cases: RefugeeCase[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: CaseStatus) => void;
  onUpdateCase?: (updatedCase: RefugeeCase) => void;
  searchQuery: string;
  currentUser: AppUser;
}

type SortField = 'createdAt' | 'fullName' | 'status' | 'nationality' | 'priority' | 'admissionDate' | 'type' | 'estimatedCost';
type SortOrder = 'asc' | 'desc';

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

export default function CaseList({ cases, onDelete, onUpdateStatus, onUpdateCase, searchQuery, currentUser }: CaseListProps) {
  const [selectedCase, setSelectedCase] = useState<RefugeeCase | null>(null);
  const [showIdPreview, setShowIdPreview] = useState<boolean>(false);
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportOptions, setExportOptions] = useState({
    startDate: '',
    endDate: '',
    type: 'All' as CaseType | 'All'
  });
  
  const [statusUpdatePending, setStatusUpdatePending] = useState<{ id: string; status: CaseStatus } | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  
  const [newAttachment, setNewAttachment] = useState<{ name: string; url: string; category: 'Medical' | 'Social' }>({ 
    name: '', 
    url: '', 
    category: 'Medical' 
  });
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState('');
  const [showStayManagement, setShowStayManagement] = useState(false);

  const handleAddFollowUp = () => {
    if (selectedCase && newFollowUp && onUpdateCase) {
      const followUp = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        comment: newFollowUp,
        user: currentUser.name
      };
      
      const updated = {
        ...selectedCase,
        followUps: [followUp, ...(selectedCase.followUps || [])],
        history: [{
          date: new Date().toISOString(),
          action: 'إضافة متابعة دورية',
          details: `تمت إضافة ملاحظة متابعة جديدة: ${newFollowUp}`,
          user: currentUser.name
        }, ...(selectedCase.history || [])]
      };
      onUpdateCase(updated);
      setSelectedCase(updated);
      setNewFollowUp('');
    }
  };

  const toggleServiceStatus = (serviceId: string) => {
    if (selectedCase && onUpdateCase) {
      const updatedSchedule = (selectedCase.serviceSchedule || []).map(s => {
        if (s.id === serviceId) {
          const isCompleting = s.status !== 'Completed';
          return {
            ...s,
            status: isCompleting ? 'Completed' : 'Planned',
            actualDate: isCompleting ? new Date().toISOString() : undefined
          };
        }
        return s;
      });

      const service = (selectedCase.serviceSchedule || []).find(s => s.id === serviceId);
      const isCompleting = service?.status !== 'Completed';

      const updated = {
        ...selectedCase,
        serviceSchedule: updatedSchedule,
        history: [{
          date: new Date().toISOString(),
          action: isCompleting ? 'إتمام خدمة مجدولة' : 'إعادة تعيين خدمة كـ مجدولة',
          details: `تم ${isCompleting ? 'إتمام' : 'إعادة تعيين'} الخدمة: ${service?.serviceName}`,
          user: currentUser.name
        }, ...(selectedCase.history || [])]
      };
      onUpdateCase(updated);
      setSelectedCase(updated);
    }
  };

  const calculateStayDays = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleUpdateField = (field: string, value: any) => {
    if (selectedCase && onUpdateCase) {
      const historyEntry = {
        date: new Date().toISOString(),
        action: 'تعديل بيانات الحالة',
        details: `تم تحديث ${field} من ${selectedCase[field as keyof RefugeeCase]} إلى ${value}`,
        user: currentUser.name
      };
      const updated = {
        ...selectedCase,
        [field]: value,
        history: [historyEntry, ...(selectedCase.history || [])]
      };
      onUpdateCase(updated);
      setSelectedCase(updated);
    }
  };

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
          name: newAttachment.name,
          url: newAttachment.url,
          category: newAttachment.category,
          date: new Date().toISOString()
        };
        const historyEntry = {
          date: new Date().toISOString(),
          action: 'إضافة مرفق',
          details: `تمت إضافة ملف ${newAttachment.category === 'Medical' ? 'طبي' : 'اجتماعي'}: ${newAttachment.name}`,
          user: currentUser.name
        };
        const updated = {
          ...selectedCase,
          attachments: [...(selectedCase.attachments || []), attachment],
          history: [historyEntry, ...(selectedCase.history || [])]
        };
        onUpdateCase(updated);
        setSelectedCase(updated);
        setNewAttachment({ name: '', url: '', category: 'Medical' });
        setShowAddAttachment(false);
        setIsUpdating(false);
      }, 800);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    
    // Simulate generation delay
    setTimeout(() => {
      let casesToExport = filteredCases;
      
      if (exportOptions.startDate) {
        casesToExport = casesToExport.filter(c => new Date(c.createdAt) >= new Date(exportOptions.startDate));
      }
      if (exportOptions.endDate) {
        casesToExport = casesToExport.filter(c => new Date(c.createdAt) <= new Date(exportOptions.endDate));
      }
      if (exportOptions.type !== 'All') {
        casesToExport = casesToExport.filter(c => c.type === exportOptions.type);
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة لتصدير تقرير الـ PDF.');
        setIsExporting(false);
        return;
      }

      const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');
      const tableRows = casesToExport.map(c => {
        const totalClaims = (c.medicalClaims || []).reduce((sum, cl) => sum + (cl.netAmount || 0), 0);
        const totalCash = (c.cashPayments || []).reduce((sum, cp) => sum + (cp.netAmount || 0), 0);
        const totalRealCost = totalClaims + totalCash;
        
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-family: monospace; font-size: 11px;">${c.unhcrId}</td>
            <td style="padding: 10px; font-weight: bold; font-size: 11px;">${c.fullName}</td>
            <td style="padding: 10px; text-transform: uppercase; font-size: 10px;">${c.type}</td>
            <td style="padding: 10px; font-size: 11px;">${c.nationality}</td>
            <td style="padding: 10px; text-align: center; font-size: 11px;">${c.age}</td>
            <td style="padding: 10px; font-weight: bold; font-size: 10px; color: ${c.status === 'Delivered' ? '#10b981' : c.status === 'Cancelled' ? '#f43f5e' : '#f59e0b'};">${c.status}</td>
            <td style="padding: 10px; font-size: 10px;">${c.priority}</td>
            <td style="padding: 10px; text-align: left; font-size: 11px; font-family: monospace;">${c.estimatedCost?.toLocaleString() || 0} ج.م</td>
            <td style="padding: 10px; text-align: left; font-size: 11px; font-family: monospace;">${totalRealCost.toLocaleString()} ج.م</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير حالات رعاية اللاجئين - UNHCR Portal Export</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #0f172a;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-info {
              text-align: right;
            }
            .header-logo {
              text-align: left;
            }
            .title {
              font-size: 22px;
              font-weight: 900;
              margin: 0 0 5px 0;
              color: #0f172a;
            }
            .subtitle {
              font-size: 11px;
              color: #64748b;
              font-weight: bold;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .info-table {
              width: 100%;
              margin-bottom: 25px;
              border-collapse: collapse;
            }
            .info-table td {
              padding: 6px;
              font-size: 11px;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 11px;
            }
            .report-table th {
              background-color: #0f172a;
              color: #ffffff;
              padding: 10px;
              font-weight: 900;
              text-align: right;
              letter-spacing: 0.05em;
            }
            .report-table td {
              border-bottom: 1px solid #e2e8f0;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 9px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
            .btn-print {
              background-color: #0f172a;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 13px;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="no-print" style="text-align: left; margin-bottom: 20px;">
            <button class="btn-print" onclick="window.print()">تأكيد وطباعة التقرير (Print / Save to PDF)</button>
          </div>
          
          <div class="header">
            <div class="header-info">
              <h1 class="title">تقرير مفصل لإدارة حالات الرعاية الطبية للاجئين</h1>
              <p class="subtitle">Refugee Case Management Operational Summary Report</p>
            </div>
            <div class="header-logo" style="text-align: left;">
              <div style="font-weight: 900; font-size: 18px; letter-spacing: 0.1em; color: #004561; font-family: sans-serif;">UNHCR PORTAL</div>
              <div style="font-size: 9px; color: #64748b;">نظام المتابعة الطبية والبرامج الشريكة</div>
            </div>
          </div>

          <table class="info-table">
            <tr>
              <td><strong>تاريخ استخراج التقرير:</strong> ${dateStr}</td>
              <td style="text-align: left;"><strong>الحالات المشمولة:</strong> ${casesToExport.length} حالة لجوء نشطة</td>
            </tr>
            <tr>
              <td><strong>عامل تصفية التواريخ:</strong> ${exportOptions.startDate || 'غير محدد'} إلى ${exportOptions.endDate || 'غير محدد'}</td>
              <td style="text-align: left;"><strong>مسار الحالات المشمول:</strong> ${exportOptions.type === 'All' ? 'الكل' : exportOptions.type === 'emergency' ? 'طوارئ' : 'مجدولة'}</td>
            </tr>
          </table>

          <table class="report-table">
            <thead>
              <tr>
                <th>رقم المفوضية / ID</th>
                <th>اسم اللاجئ المسجل</th>
                <th>المسار / Track</th>
                <th>الجنسية</th>
                <th>العمر</th>
                <th>حالة الملف</th>
                <th>الأولوية</th>
                <th style="text-align: left;">التكلفة المقدرة</th>
                <th style="text-align: left;">التكلفة الفعلية</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer" style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>تم توليد هذا التقرير تلقائياً من بوابة المتابعة الرقمية المشتركة للمفوضية السامية لشؤون اللاجئين.</div>
            <div>الصفحة 1 من 1</div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setIsExporting(false);
      setShowExportOptions(false);
    }, 1200);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const headers = [
        'UNHCR ID', 'Full Name', 'Type', 'Nationality', 'Gender', 'Age', 'Status', 
        'Priority', 'Hospital', 'Diagnosis', 'Estimated Cost', 'Real Cost', 'Created At'
      ];
      
      let casesToExport = filteredCases;
      
      if (exportOptions.startDate) {
        casesToExport = casesToExport.filter(c => new Date(c.createdAt) >= new Date(exportOptions.startDate));
      }
      if (exportOptions.endDate) {
        casesToExport = casesToExport.filter(c => new Date(c.createdAt) <= new Date(exportOptions.endDate));
      }
      if (exportOptions.type !== 'All') {
        casesToExport = casesToExport.filter(c => c.type === exportOptions.type);
      }
      
      const rows = casesToExport.map(c => {
        const totalClaims = (c.medicalClaims || []).reduce((sum, cl) => sum + (cl.netAmount || 0), 0);
        const totalCash = (c.cashPayments || []).reduce((sum, cp) => sum + (cp.netAmount || 0), 0);
        const totalRealCost = totalClaims + totalCash;
        
        return [
          c.unhcrId,
          c.fullName,
          c.type,
          c.nationality,
          c.gender,
          c.age,
          c.status,
          c.priority,
          c.hospital,
          c.diagnosis.replace(/,/g, ';').replace(/\n/g, ' '), // Prevent CSV breaking
          c.estimatedCost,
          totalRealCost,
          format(new Date(c.createdAt), 'yyyy-MM-dd')
        ];
      });

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
      setShowExportOptions(false);
    }, 1500);
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
      if (sortField === 'createdAt' || sortField === 'admissionDate') {
        comparison = new Date(a[sortField] || 0).getTime() - new Date(b[sortField] || 0).getTime();
      } else if (sortField === 'priority') {
        const priorityScore = { High: 3, Medium: 2, Low: 1 };
        comparison = (priorityScore[a.priority as Priority] || 0) - (priorityScore[b.priority as Priority] || 0);
      } else if (sortField === 'estimatedCost') {
        comparison = (a.estimatedCost || 0) - (b.estimatedCost || 0);
      } else if (sortField === 'status' || sortField === 'nationality' || sortField === 'fullName' || sortField === 'type') {
        comparison = (a[sortField] || '').localeCompare(b[sortField] || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleConfirmStatusUpdate = () => {
    if (statusUpdatePending && onUpdateCase) {
      const c = cases.find(caseItem => caseItem.id === statusUpdatePending.id);
      if (c) {
        const historyEntry = {
          date: new Date().toISOString(),
          action: 'تغيير حالة الملف',
          details: `تم تغيير الحالة إلى ${statusUpdatePending.status}${statusNotes ? ` - ملاحظات: ${statusNotes}` : ''}`,
          user: currentUser.name
        };
        const updated = {
          ...c,
          status: statusUpdatePending.status,
          history: [historyEntry, ...(c.history || [])]
        };
        onUpdateCase(updated);
        setStatusUpdatePending(null);
        setStatusNotes('');
      } else {
        onUpdateStatus(statusUpdatePending.id, statusUpdatePending.status);
        setStatusUpdatePending(null);
        setStatusNotes('');
      }
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const CalendarView = ({ cases, onSelectCase }: { cases: RefugeeCase[], onSelectCase: (c: RefugeeCase) => void }) => {
    const today = new Date();
    const daysInMonth = 30; // Simplified calendar for demo
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
      const casesOnDay = cases.filter(c => 
        format(new Date(c.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return { date, cases: casesOnDay };
    });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200">
        {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
          <div key={day} className="bg-slate-50 p-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => (
          <div key={i} className="bg-white min-h-[140px] p-2 flex flex-col gap-1 hover:bg-slate-50 transition-colors">
            <span className="text-[10px] font-bold text-slate-300">{format(day.date, 'd')}</span>
            <div className="flex flex-col gap-1 mt-1">
              {day.cases.slice(0, 3).map(c => (
                <button
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className={cn(
                    "text-[8px] p-1 rounded font-bold truncate text-right border-r-2",
                    c.type === 'emergency' ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-blue-50 border-blue-500 text-blue-700"
                  )}
                >
                  {c.fullName}
                </button>
              ))}
              {day.cases.length > 3 && (
                <span className="text-[8px] text-slate-400 text-center font-bold">+{day.cases.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const [isEditing, setIsEditing] = useState(false);
  const totalClaimsForSelected = (selectedCase?.medicalClaims || []).reduce((sum, cl) => sum + (cl.netAmount || 0), 0);
  const totalCashForSelected = (selectedCase?.cashPayments || []).reduce((sum, cp) => sum + (cp.netAmount || 0), 0);
  const grandTotalForSelected = totalClaimsForSelected + totalCashForSelected;

  if (isEditing && selectedCase) {
    return (
      <CaseForm 
        onSubmit={(updated) => {
          if (onUpdateCase) onUpdateCase(updated);
          setIsEditing(false);
          setSelectedCase(null);
        }}
        currentUser={currentUser}
        initialCase={selectedCase}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">إدارة قاعدة البيانات</h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 gap-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Active Registry & Case Lifecycle Management</p>
          
          {/* Enhanced Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'list' ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                <ClipboardList size={14} />
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'calendar' ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                <Calendar size={14} />
              </button>
            </div>

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
                <option value="admissionDate">تاريخ الدخول</option>
                <option value="estimatedCost">التكلفة المقدرة</option>
              </select>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="btn-secondary py-1.5 px-3 text-[10px] uppercase tracking-widest"
                title="تصدير جميع الحالات الظاهرة في القائمة حالياً إلى ملف CSV يتضمن البيانات الأساسية والمالية"
              >
                <Download size={14} />
                تصدير
              </button>

              {showExportOptions && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl z-50 p-4 rounded animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">خيارات التصدير</h4>
                    <button onClick={() => setShowExportOptions(false)}><X size={14} /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">من تاريخ</label>
                        <input 
                          type="date" 
                          className="text-[10px] p-1 border border-slate-200 rounded outline-none"
                          value={exportOptions.startDate}
                          onChange={(e) => setExportOptions({...exportOptions, startDate: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">إلى تاريخ</label>
                        <input 
                          type="date" 
                          className="text-[10px] p-1 border border-slate-200 rounded outline-none"
                          value={exportOptions.endDate}
                          onChange={(e) => setExportOptions({...exportOptions, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">نوع الحالات</label>
                      <select 
                        className="text-[10px] p-1 border border-slate-200 rounded outline-none"
                        value={exportOptions.type}
                        onChange={(e) => setExportOptions({...exportOptions, type: e.target.value as any})}
                      >
                        <option value="All">الكل</option>
                        <option value="emergency">طوارئ</option>
                        <option value="scheduled">مجدولة</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">صيغة المستند / Document Format</label>
                      <select 
                        className="text-[10px] p-1 border border-slate-200 rounded outline-none"
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                      >
                        <option value="csv">ملف CSV مجدول (لبرامج Excel/Sheets)</option>
                        <option value="pdf">تقرير لجوء رسمي PDF (جاهز للطباعة والمشاركة)</option>
                      </select>
                    </div>
                    <button 
                      onClick={exportFormat === 'csv' ? handleExportCSV : handleExportPDF}
                      disabled={isExporting}
                      className="w-full btn-primary py-2 text-[10px] font-black tracking-widest relative"
                    >
                      {isExporting ? <Loader2 size={12} className="animate-spin" /> : 'بدء التصدير الاستقصائي'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
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
                  <div className="flex items-center justify-end gap-1">
                    الاسم المسجل
                    {sortField === 'fullName' && <ArrowUpDown size={10} className={cn("text-brand-primary transition-transform", sortOrder === 'asc' ? 'rotate-180' : '')} />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-black tracking-widest cursor-pointer hover:bg-slate-800 text-center"
                  onClick={() => toggleSort('type')}
                >
                  <div className="flex items-center justify-center gap-1">
                    المسار / Track
                    {sortField === 'type' && <ArrowUpDown size={10} className={cn("text-brand-primary transition-transform", sortOrder === 'asc' ? 'rotate-180' : '')} />}
                  </div>
                </th>
                <th className="px-6 py-4 font-black tracking-widest text-right">الجنسية</th>
                <th className="px-6 py-4 font-black tracking-widest text-left">التشخيص</th>
                <th 
                  className="px-6 py-4 font-black tracking-widest cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('admissionDate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    تاريخ الدخول
                    {sortField === 'admissionDate' && <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-black tracking-widest cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('priority')}
                >
                  <div className="flex items-center justify-center gap-1 text-[10px]">
                    الأولوية
                    {sortField === 'priority' && <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-black tracking-widest cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('createdAt')}
                >
                  <div className="flex items-center justify-center gap-1">
                    التسجيل
                    {sortField === 'createdAt' && <ArrowUpDown size={10} className={cn("text-brand-primary transition-transform", sortOrder === 'asc' ? 'rotate-180' : '')} />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-black tracking-widest cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('estimatedCost')}
                >
                  <div className="flex items-center justify-center gap-1">
                    التكلفة المقدرة
                    {sortField === 'estimatedCost' && <ArrowUpDown size={10} className={cn("text-brand-primary transition-transform", sortOrder === 'asc' ? 'rotate-180' : '')} />}
                  </div>
                </th>
                <th className="px-6 py-4 font-black tracking-widest">المطالبة</th>
                <th 
                  className="px-6 py-4 font-black tracking-widest cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    الحالة
                    {sortField === 'status' && <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                  </div>
                </th>
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
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          c.status === 'Delivered' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          c.status === 'Cancelled' ? "bg-rose-100 text-rose-800 border border-rose-200" :
                          "bg-amber-100 text-amber-800 border border-amber-200"
                        )}>
                          <StatusIcon status={c.status} />
                          <span>{c.status === 'Delivered' ? 'Delivered' : c.status === 'Cancelled' ? 'Cancelled' : 'Pending'}</span>
                        </span>
                        <button 
                          onClick={() => setSelectedCase(c)}
                          className="font-black text-slate-900 text-sm tracking-tight hover:text-brand-primary text-right"
                        >
                          {c.fullName}
                        </button>
                      </div>
                      <div className="flex items-center justify-start gap-2 flex-row-reverse">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.gender} • {c.age} YRS</span>
                    {c.priority && (
                      <div className="flex items-center gap-1.5 flex-row-reverse mt-1">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          c.priority === 'High' ? "bg-rose-600 animate-ping" : 
                          c.priority === 'Medium' ? "bg-amber-500" : "bg-slate-300"
                        )} />
                        <span className={cn(
                          "text-[8px] px-1 rounded font-black uppercase tracking-tighter",
                          c.priority === 'High' ? "bg-rose-100 text-rose-600 ring-1 ring-rose-200" :
                          c.priority === 'Medium' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {c.priority}
                        </span>
                      </div>
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
                  <td className="px-6 py-5 text-slate-500 font-medium text-center">
                    {c.admissionDate ? format(new Date(c.admissionDate), 'dd/MM/yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-tighter",
                        c.priority === 'High' ? "bg-rose-600 text-white animate-pulse shadow-sm" :
                        c.priority === 'Medium' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {c.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium text-left">
                    {format(new Date(c.createdAt), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-5 text-slate-800 font-black text-center font-mono text-xs">
                    {(c.estimatedCost || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400 font-sans">ج.م</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      {c.medicalClaims && c.medicalClaims.length > 0 ? (
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter",
                          c.medicalClaims.some(cl => cl.status === 'Pending Approval') ? "bg-amber-100 text-amber-700 animate-pulse" :
                          c.medicalClaims.every(cl => cl.status === 'Paid') ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {c.medicalClaims.some(cl => cl.status === 'Pending Approval') ? 'Pending' : 
                           c.medicalClaims.every(cl => cl.status === 'Paid') ? 'Settled' : 'In Review'}
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-300 font-bold">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest",
                        c.status === 'Delivered' ? "bg-emerald-50 text-emerald-700" : 
                        c.status === 'Cancelled' ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                      )}>
                        <StatusIcon status={c.status} />
                        {c.status === 'Delivered' ? 'Delivered' : c.status === 'Cancelled' ? 'Cancelled' : 'Pending'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setStatusUpdatePending({ id: c.id, status: 'Delivered' })}
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
                  <td colSpan={12} className="px-6 py-20 text-center">
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
    ) : (
      <div className="glass-card p-6 bg-white border-slate-200">
        <CalendarView cases={cases} onSelectCase={setSelectedCase} />
      </div>
    )}

      {/* Status Update Notes Modal */}
      {statusUpdatePending && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 rounded shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                إضافة ملاحظات (اختياري)
                <FileEdit size={16} className="text-brand-primary" />
              </h3>
              <button onClick={() => setStatusUpdatePending(null)}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-sm border border-blue-100">
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                  تغيير حالة الملف إلى: <span className="uppercase">{statusUpdatePending.status}</span>
                </p>
              </div>
              <textarea
                className="w-full p-3 border border-slate-200 rounded text-sm min-h-[100px] outline-none focus:border-brand-primary transition-colors"
                placeholder="أدخل أي تفاصيل أو ملاحظات حول تغيير الحالة..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              ></textarea>
              <div className="flex gap-3">
                <button 
                  onClick={handleConfirmStatusUpdate}
                  className="flex-1 btn-primary py-2 font-black uppercase tracking-widest"
                >
                  تأكيد التغيير
                </button>
                <button 
                  onClick={() => setStatusUpdatePending(null)}
                  className="flex-1 btn-secondary py-2 font-black uppercase tracking-widest"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowIdPreview(true)}
                  className="flex items-center gap-1.5 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/30 hover:border-brand-primary px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>معاينة الهوية / View ID</span>
                </button>
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-8">
                  {/* Personal & Logisitic */}
                  <div className="glass-card p-6 space-y-6 rounded-none">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-right text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        البيانات الديموغرافية واللوجستية
                        <LayoutDashboard size={14} className="text-brand-primary" />
                      </h3>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] font-black uppercase text-brand-primary border border-brand-primary/20 px-3 py-1 hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2"
                      >
                        تعديل بيانات المريض / Edit
                        <FileEdit size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <DetailRow label="الاسم الكامل" value={selectedCase.fullName} icon={User} />
                      <DetailRow label="الجنسية" value={selectedCase.nationality} />
                      <DetailRow label="الأولوية" value={selectedCase.priority} icon={AlertCircle} />
                      <DetailRow label="جهة الحجز" value={selectedCase.bookingEntity} icon={Building} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
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
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">نوع الحالة</span>
                      <select 
                        className="text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                        value={selectedCase.type}
                        onChange={(e) => handleUpdateField('type', e.target.value)}
                      >
                        <option value="emergency">طوارئ / Emergency</option>
                        <option value="scheduled">خدمة مجدولة / Scheduled</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">المسؤول المباشر</span>
                      <select 
                        className="text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                        value={selectedCase.assignedTo}
                        onChange={(e) => handleUpdateField('assignedTo', e.target.value)}
                      >
                        <option value="أحمد الفارسي">أحمد الفارسي</option>
                        <option value="سارة محمد">سارة محمد</option>
                        <option value="خالد إبراهيم">خالد إبراهيم</option>
                      </select>
                    </div>
                    <DetailRow label="العمر" value={`${selectedCase.age} سنة`} />
                    <DetailRow label="النوع" value={selectedCase.gender} />
                    <DetailRow label="رقم الهاتف" value={selectedCase.mobileNumber} />
                    <DetailRow label="الموقع الحالي" value={selectedCase.currentLocation} />
                    <DetailRow label="تحسن الحالة" value={selectedCase.improved ? 'نعم' : 'لا'} />
                    <DetailRow label="نوع الدفع" value={selectedCase.paymentType === 'Cash' ? 'كاش / Cash' : 'مطالبة / Claim'} icon={DollarSign} />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">تحديث حالة التحسن</span>
                      <button 
                        onClick={() => handleUpdateField('improved', !selectedCase.improved)}
                        className={cn(
                          "text-[10px] font-black uppercase px-2 py-1 rounded w-fit transition-colors",
                          selectedCase.improved ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {selectedCase.improved ? 'تراجع عن التحسن' : 'تأكيد التحسن'}
                      </button>
                    </div>
                  </div>

                  {/* Stay Management Section for Emergency Cases */}
                  {selectedCase.type === 'emergency' && (
                    <div className="bg-rose-50 border border-rose-100 p-6 space-y-4 rounded-none">
                      <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest flex items-center gap-2">
                        إدارة الإقامة بالمستشفى
                        <Building size={14} />
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-rose-400 uppercase block">تاريخ الدخول</label>
                          <input 
                            type="date" 
                            className="w-full text-xs p-2 bg-white border border-rose-200 rounded outline-none"
                            value={selectedCase.admissionDate || ''}
                            onChange={(e) => handleUpdateField('admissionDate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-rose-400 uppercase block">تاريخ الخروج</label>
                          <input 
                            type="date" 
                            className="w-full text-xs p-2 bg-white border border-rose-200 rounded outline-none"
                            value={selectedCase.dischargeDate || ''}
                            onChange={(e) => handleUpdateField('dischargeDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-white/50 p-4 border border-rose-100 rounded">
                        <div className="text-right">
                          <p className="text-[10px] text-rose-400 font-bold uppercase">إجمالي أيام الإقامة</p>
                          <p className="text-xl font-black text-rose-700">
                            {selectedCase.admissionDate ? calculateStayDays(selectedCase.admissionDate, selectedCase.dischargeDate) : 0} يوم
                          </p>
                        </div>
                        <AlertCircle className="text-rose-300" size={24} />
                      </div>
                    </div>
                  )}
                </div>

                  {/* Emergency Contact */}
                  <div className="glass-card p-6 space-y-4 rounded-none text-right">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center justify-end gap-2">
                      بيانات التواصل الطارئ
                      <Phone size={14} className="text-brand-primary" />
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailRow label="اسم جهة الاتصال" value={selectedCase.contactPerson} />
                      <DetailRow label="صلة القرابة" value={selectedCase.contactRelationship} />
                      <DetailRow label="رقم هاتف الطوارئ" value={selectedCase.contactNumber} />
                      <DetailRow label="طريقة التواصل المفضلة" value={selectedCase.contactMethod} />
                    </div>
                  </div>

                  {/* Medical Claims & Discount Section */}
                  <div className="glass-card p-6 space-y-6 rounded-none text-right">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center justify-end gap-2">
                      المطالبات الطبية والخصومات
                      <ClipboardList size={14} className="text-brand-primary" />
                    </h3>
                    <div className="space-y-3">
                      {selectedCase.medicalClaims?.map((claim) => (
                        <div key={claim.id} className="p-4 bg-white border border-slate-100 rounded-none shadow-sm flex items-center justify-between">
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-black text-slate-900">{claim.serviceName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{claim.provider} | {claim.date && format(new Date(claim.date), 'dd/MM/yyyy')}</span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest",
                                claim.status === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                                claim.status === 'Under Review' ? "bg-amber-100 text-amber-700" :
                                claim.status === 'Processed' ? "bg-blue-100 text-blue-700" : 
                                claim.status === 'Pending Approval' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
                              )}>
                                {claim.status}
                              </span>
                              {claim.status !== 'Pending Approval' && claim.status !== 'Paid' && (
                                <button
                                  onClick={() => {
                                    const updatedClaims = (selectedCase.medicalClaims || []).map(cl => 
                                      cl.id === claim.id ? { ...cl, status: 'Pending Approval' } as any : cl
                                    );
                                    handleUpdateField('medicalClaims', updatedClaims);
                                  }}
                                  className="text-[8px] font-black uppercase text-brand-primary hover:underline"
                                >
                                  إرسال للمراجعة
                                </button>
                              )}
                            </div>
                            {claim.includedServices && claim.includedServices.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 flex-row-reverse">
                                {claim.includedServices.map((s, i) => (
                                  <span key={i} className="text-[8px] bg-slate-50 border border-slate-100 px-1 rounded text-slate-400 font-bold">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 block line-through">{claim.totalAmount.toLocaleString()} EGP</span>
                            <span className="text-sm font-black text-emerald-600 tracking-tight">{claim.netAmount.toLocaleString()} EGP</span>
                            <span className="text-[9px] font-bold text-slate-500">خصم {claim.discountPercentage}%</span>
                          </div>
                        </div>
                      ))}
                      {(!selectedCase.medicalClaims || selectedCase.medicalClaims.length === 0) && (
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase py-4 border border-dashed border-slate-100">لا يوجد مطالبات مسجلة</p>
                      )}
                    </div>
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
                      {selectedCase.medicationHistory && (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">التاريخ الطبي والدوائي (Medical History)</span>
                          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed">
                            {selectedCase.medicationHistory}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service Schedule Tracking for Scheduled Cases */}
                  {selectedCase.type === 'scheduled' && (
                    <div className="glass-card p-6 space-y-4 rounded-none text-right">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center justify-end gap-2">
                        متابعة جدول الخدمات المجدولة
                        <ClipboardList size={14} className="text-brand-primary" />
                      </h3>
                      <div className="space-y-3">
                        {selectedCase.serviceSchedule?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded hover:bg-slate-50 transition-colors group">
                            <button 
                              onClick={() => toggleServiceStatus(item.id)}
                              className={cn(
                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all",
                                item.status === 'Completed' 
                                  ? "bg-emerald-600 text-white shadow-sm" 
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              )}
                            >
                              {item.status === 'Completed' && <ShieldCheck size={12} />}
                              {item.status === 'Completed' ? 'Completed' : 'Mark as Done'}
                            </button>
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-800">{item.serviceName}</p>
                              <div className="flex items-center justify-end gap-2 mt-1">
                                <span className="text-[9px] text-slate-400 font-bold">المخطط له: {item.plannedDate}</span>
                                {item.actualDate && (
                                  <>
                                    <span className="text-[9px] text-slate-300">•</span>
                                    <span className="text-[9px] text-emerald-500 font-bold tracking-tight">تم في: {format(new Date(item.actualDate), 'dd/MM/yyyy')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!selectedCase.serviceSchedule || selectedCase.serviceSchedule.length === 0) && (
                          <p className="text-center text-[10px] text-slate-400 font-bold uppercase py-4 border border-dashed border-slate-100 rounded">
                            لا يوجد جدول خدمات مضاف لهذه الحالة
                          </p>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Periodic Follow-up Log (Requested Feature) */}
                  <div className="glass-card p-6 space-y-6 rounded-none text-right bg-slate-900 text-white">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2 flex items-center justify-end gap-2">
                      سجل المتابعات والتعليقات الدورية
                      <Clock size={14} className="text-brand-primary" />
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={handleAddFollowUp}
                          disabled={!newFollowUp}
                          className="btn-primary py-2 px-4 whitespace-nowrap disabled:opacity-50"
                        >
                          إضافة تعليق
                        </button>
                        <textarea 
                          className="flex-1 bg-white/10 border border-white/20 rounded p-3 text-sm outline-none focus:border-brand-primary transition-colors resize-none h-12"
                          placeholder="اكتب ملاحظة متابعة دورية..."
                          value={newFollowUp}
                          onChange={(e) => setNewFollowUp(e.target.value)}
                        />
                      </div>

                      <div className="space-y-4 max-h-[300px] overflow-y-auto pl-2 custom-scrollbar">
                        {selectedCase.followUps?.map((fu) => (
                          <div key={fu.id} className="bg-white/5 border-l-2 border-brand-primary p-4 space-y-2">
                            <div className="flex justify-between items-center opacity-60 text-[8px] font-black uppercase tracking-widest">
                              <span>بواسطة: {fu.user}</span>
                              <span>{format(new Date(fu.date), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-200">{fu.comment}</p>
                          </div>
                        ))}
                        {(!selectedCase.followUps || selectedCase.followUps.length === 0) && (
                          <div className="py-10 text-center opacity-20">
                            <AlertCircle size={32} className="mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">لا توجد ملاحظات متابعة حالياً</p>
                          </div>
                        )}
                      </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">نوع الملف</label>
                            <select 
                              className="input-field py-1 h-8 bg-white" 
                              value={newAttachment.category}
                              onChange={(e) => setNewAttachment({...newAttachment, category: e.target.value as any})}
                            >
                              <option value="Medical">طبي</option>
                              <option value="Social">اجتماعي</option>
                            </select>
                          </div>
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
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[8px] px-1 rounded font-bold uppercase",
                                  att.category === 'Social' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                )}>
                                  {att.category === 'Social' ? 'اجتماعي' : 'طبي'}
                                </span>
                                <p className="text-xs font-black text-slate-900">{att.name}</p>
                              </div>
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
                          <span className="text-[10px] text-slate-400 font-bold uppercase">إجمالي التكلفة الفعلية (مطالبات + كاش)</span>
                          <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                            {grandTotalForSelected.toLocaleString()} <small className="text-sm font-bold opacity-50 text-slate-400">ج.م</small>
                          </span>
                          <div className="flex gap-4 mt-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">المطالبات: {totalClaimsForSelected.toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">الكاش: {totalCashForSelected.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/50 p-4 border border-brand-primary/10 rounded-lg flex flex-col gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block border-b border-slate-100 pb-1">جدول توزيع المصروفات (ج.م) / Cost Breakdown</span>
                        <table id="cost-breakdown-table" className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-bold text-[9px] uppercase">
                              <th className="py-2 px-1 text-center font-black">المقارنة / Review</th>
                              <th className="py-2 px-1 text-center font-black">الميزانية المقدرة / Budget</th>
                              <th className="py-2 px-1 text-center font-black">التكلفة الفعلية / Actual</th>
                              <th className="py-2 px-1 text-right font-black">البند / Item</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { 
                                label: 'الأدوية', 
                                key: 'medication', 
                                description: 'توزيع المصاريف للأدوية المعتمدة والوصفات الطبية لمتابعة الحالات المزمنة أو الحادة.',
                                getBudget: (est: number) => Math.max(1000, Math.round(est * 0.35))
                              },
                              { 
                                label: 'الاستشارات', 
                                key: 'consultation', 
                                description: 'زيارات الأخصائيين، الاستشارات السريرية الأولية والمتابعات الدورية داخل العيادات.',
                                getBudget: (est: number) => Math.max(500, Math.round(est * 0.15))
                              },
                              { 
                                label: 'الإجراءات', 
                                key: 'procedure', 
                                description: 'العمليات الجراحية، الفحوصات المخبرية الدقيقة، الأشعة والتصوير الطبي المتخصص.',
                                getBudget: (est: number) => Math.max(2000, Math.round(est * 0.40))
                              },
                              { 
                                label: 'أخرى', 
                                key: 'other', 
                                description: 'نفقات النقل الإسعافي، الطوارئ الطبية غير المصنفة والمصاريف الإدارية والخدمات الشريكة.',
                                getBudget: (est: number) => Math.max(500, Math.round(est * 0.10))
                              }
                            ].map((item) => {
                              const costValue = (selectedCase.costBreakdown as any)?.[item.key] || 0;
                              const projectedBudget = item.getBudget(selectedCase.estimatedCost || 0);
                              const isOverBudget = costValue > projectedBudget;

                              return (
                                <tr key={item.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                  {/* Comparison Status Badge */}
                                  <td className="py-2.5 px-1 text-center">
                                    <span className={cn(
                                      "inline-block text-[8px] font-black tracking-tighter px-1 rounded-sm uppercase",
                                      isOverBudget 
                                        ? "bg-rose-100 text-rose-805 border border-rose-200" 
                                        : "bg-emerald-100 text-emerald-805 border border-emerald-200"
                                    )}>
                                      {isOverBudget ? 'متجاوز / OVER' : 'ضمن الحد / OK'}
                                    </span>
                                  </td>
                                  
                                  {/* Projected budget column */}
                                  <td className="py-2.5 px-1 text-center font-mono text-slate-500 font-bold text-[10px]">
                                    {projectedBudget.toLocaleString()} <span className="text-[8px] font-bold text-slate-400">ج.م</span>
                                  </td>

                                  {/* Cost input or display cell (conditioned on budget limit with light red highlight if overbudget) */}
                                  <td className={cn(
                                    "py-1 px-1 transition-all rounded-md text-center",
                                    isOverBudget ? "bg-red-50 text-red-700 font-bold" : ""
                                  )}>
                                    {editingBreakdown ? (
                                      <div className="flex items-center justify-center gap-1 mx-auto max-w-[100px]">
                                        <input 
                                          type="number" 
                                          className={cn(
                                            "w-full text-xs p-1 text-center bg-white border border-slate-200 rounded outline-none focus:border-brand-primary font-mono",
                                            isOverBudget ? "border-red-300 text-red-700 bg-red-50" : ""
                                          )}
                                          value={costValue}
                                          onChange={(e) => updateCostBreakdown(item.key, parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    ) : (
                                      <span className="font-mono text-[10px]">
                                        {costValue.toLocaleString()} <span className="text-[8px] opacity-40">ج.م</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Label and Tooltipped icon */}
                                  <td className="py-2.5 px-1 text-right font-medium text-slate-800 text-[10px]">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Hover tooltip for explanation */}
                                      <div className="group relative inline-block cursor-help">
                                        <Info size={11} className="text-slate-400 hover:text-brand-primary transition-colors" />
                                        <div className="absolute z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded-lg p-3 text-right w-48 -top-10 -left-6 border border-slate-700 shadow-xl leading-relaxed">
                                          <p className="font-black text-brand-primary mb-1 border-b border-white/10 pb-1">
                                            {item.label} (تفاصيل الهيكل)
                                          </p>
                                          <p className="text-slate-300 font-medium">
                                            {item.description}
                                          </p>
                                        </div>
                                      </div>
                                      <span>{item.label}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Identity Card & History */}
                <div className="space-y-6">
                  {/* UNHCR Digital ID Card Block */}
                  <div className="glass-card p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/20 border border-slate-200/60 rounded-none space-y-4 shadow-xs">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 justify-end">
                      بطاقة هوية المفوضية الرقمية (UNHCR Identity Card)
                      <ShieldCheck size={14} className="text-brand-primary" />
                    </h3>

                    <div className="relative w-full aspect-[1.586/1] rounded-xl overflow-hidden shadow-lg border border-slate-100 flex flex-col justify-between p-4 group select-none">
                      {/* Generated ID Template Background */}
                      <img 
                        src={unhcrIdTemplate} 
                        alt="UNHCR ID Backdrop" 
                        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none brightness-105 shadow-inner"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Translucent overlay mask to maintain high contrast readability */}
                      <div className="absolute inset-0 bg-blue-950/15 z-5" />

                      {/* Header Inside Card */}
                      <div className="relative z-10 flex justify-between items-start text-white">
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-black tracking-widest uppercase text-white drop-shadow-sm font-sans">UNHCR</span>
                          <span className="text-[5.5px] font-bold tracking-wider text-blue-100 uppercase font-sans">United Nations High Commissioner for Refugees</span>
                        </div>
                        {/* Simulated official badge / UNHCR emblem placeholder */}
                        <div className="w-6 h-6 bg-white/15 backdrop-blur-xs rounded-full flex items-center justify-center border border-white/20 shadow-xs">
                          <ShieldCheck size={12} className="text-white" />
                        </div>
                      </div>

                      {/* Middle Body section containing portrait placeholder and demographic fields */}
                      <div className="relative z-10 grid grid-cols-3 gap-3 items-center mt-2 text-white">
                        {/* Refugee photo passport photo placeholder */}
                        <div className="col-span-1 bg-slate-950/40 border border-white/15 rounded aspect-[3/4] flex flex-col items-center justify-center p-1 relative overflow-hidden backdrop-blur-xs shadow-inner">
                          <User size={28} className="text-white/60" />
                          <span className="text-[4px] font-black uppercase text-white/50 tracking-widest mt-1 text-center font-mono">PHOTO REQ</span>
                        </div>

                        {/* Text fields formatted like a official plastic card */}
                        <div className="col-span-2 space-y-1 text-right flex flex-col justify-center">
                          <div>
                            <span className="text-[4.5px] text-blue-100/95 font-bold block">NAME / الاسم الكامل</span>
                            <span className="text-[9px] font-black tracking-tight drop-shadow-sm leading-tight text-white block truncate">{selectedCase.fullName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[4.5px] text-blue-100/95 font-bold block">NATIONALITY / الجنسية</span>
                              <span className="text-[7px] font-black text-white drop-shadow-sm truncate block">{selectedCase.nationality}</span>
                            </div>
                            <div>
                              <span className="text-[4.5px] text-blue-100/95 font-bold block">CASE NO / رقم الحالة</span>
                              <span className="text-[7.5px] font-bold font-mono tracking-tight text-white drop-shadow-sm block truncate">{selectedCase.unhcrId}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <div>
                              <span className="text-[4px] text-blue-100/95 font-bold block">GENDER / الجنس</span>
                              <span className="text-[6.5px] font-bold text-white block">{selectedCase.gender === 'Male' ? 'ذكر' : selectedCase.gender === 'Female' ? 'أنثى' : 'آخر'}</span>
                            </div>
                            <div>
                              <span className="text-[4px] text-blue-100/95 font-bold block">AGE / العمر</span>
                              <span className="text-[6.5px] font-bold text-white block">{selectedCase.age} سنة</span>
                            </div>
                            <div>
                              <span className="text-[4px] text-blue-100/95 font-bold block">ISSUED / صدور</span>
                              <span className="text-[6.5px] font-mono font-bold text-white block">
                                {selectedCase.admissionDate ? format(new Date(selectedCase.admissionDate), 'MM/yyyy') : '05/2026'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer containing barcode placeholder */}
                      <div className="relative z-10 flex items-end justify-between mt-1 text-white">
                        <div className="text-[4.5px] text-white/70 font-bold font-mono uppercase tracking-wide">
                          PORTAL ISSUED SYSTEM ID: {selectedCase.id.slice(0, 8)}
                        </div>
                        {/* Simulated realistic barcode bars */}
                        <div className="flex flex-col items-end">
                          <div className="flex items-end gap-[1.5px] h-3.5 bg-white/10 p-0.5 rounded-xs">
                            <div className="w-[1px] h-2.5 bg-white" />
                            <div className="w-[2.5px] h-2.5 bg-white" />
                            <div className="w-[1px] h-2.5 bg-white" />
                            <div className="w-[1.5px] h-2.5 bg-white" />
                            <div className="w-[1px] h-2.5 bg-white" />
                            <div className="w-[2.5px] h-2.5 bg-white" />
                            <div className="w-[1px] h-2.5 bg-white" />
                            <div className="w-[2px] h-2.5 bg-white" />
                            <div className="w-[1px] h-2.5 bg-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive document utilities */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          alert(`تم تصدير بطاقة هوية المفوضية الرقمية للاجئ ${selectedCase.fullName} وتجهيز ملف التحميل بنجاح.`);
                        }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 bg-white border border-slate-250 text-slate-700 text-[10px] font-black rounded hover:bg-slate-50 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <Download size={11} />
                        تنزيل البطاقة
                      </button>
                      <button 
                        onClick={() => {
                          window.print();
                        }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 bg-brand-primary text-white text-[10px] font-black rounded hover:bg-brand-primary/95 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <ShieldCheck size={11} />
                        طباعة الهوية
                      </button>
                    </div>
                  </div>

                  {/* History List */}
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
                  
                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredHistory.map((entry, idx) => (
                      <div key={idx} className="relative pl-8 pb-8 last:pb-0 group">
                        {/* Timeline Line */}
                        {filteredHistory.length > 1 && idx !== filteredHistory.length - 1 && (
                          <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-slate-100 group-hover:bg-brand-primary/20 transition-colors" />
                        )}
                        
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10 shadow-sm group-hover:border-brand-primary transition-colors">
                          <div className={cn(
                             "w-1.5 h-1.5 rounded-full transition-all",
                             (entry.action.includes('تغيير') || entry.action.includes('تحديث') || entry.action.includes('تعديل')) ? "bg-amber-500" : 
                             entry.action.includes('إضافة') ? "bg-emerald-500" :
                             entry.action.includes('حذف') ? "bg-rose-500" : "bg-brand-primary"
                          )} />
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{entry.action}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                                  <User size={8} />
                                  {entry.user}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                                <Clock size={10} className="text-slate-400" />
                                {format(new Date(entry.date), 'HH:mm')}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                                {format(new Date(entry.date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm relative group-hover:border-brand-primary/20 transition-all text-right">
                             <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                               {entry.details}
                             </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredHistory.length === 0 && (
                      <div className="text-center py-12 bg-white rounded border border-slate-100 border-dashed">
                        <History size={32} className="mx-auto text-slate-200 mb-2 opacity-50" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">تحتوي هذه الخدمة على سجل فارغ حالياً</p>
                      </div>
                    )}
                  </div>
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

      {/* UNHCR ID Card Preview Overlay */}
      {selectedCase && showIdPreview && (
        <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative text-right">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <span className="text-xs font-black tracking-wider flex items-center gap-2">
                <ShieldCheck className="text-brand-primary w-4 h-4" />
                <span>بطاقة الهوية UNHCR ID Card Preview</span>
              </span>
              <button 
                type="button"
                onClick={() => setShowIdPreview(false)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-900 flex justify-center items-center">
              <div className="relative w-full aspect-[1.586/1] rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between p-5 group select-none">
                {/* Generated ID Template Background */}
                <img 
                  src={unhcrIdTemplate} 
                  alt="UNHCR ID Backdrop" 
                  className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none brightness-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Translucent overlay mask */}
                <div className="absolute inset-0 bg-blue-950/20 z-5" />

                {/* Header Inside Card */}
                <div className="relative z-10 flex justify-between items-start text-white">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black tracking-widest uppercase text-white drop-shadow-md font-sans">UNHCR</span>
                    <span className="text-[6px] font-bold tracking-wider text-blue-100 uppercase font-sans">United Nations High Commissioner for Refugees</span>
                  </div>
                  <div className="w-7 h-7 bg-white/15 backdrop-blur-xs rounded-full flex items-center justify-center border border-white/20 shadow-xs">
                    <ShieldCheck size={14} className="text-white" />
                  </div>
                </div>

                {/* Middle Body */}
                <div className="relative z-10 grid grid-cols-3 gap-4 items-center mt-3 text-white">
                  <div className="col-span-1 bg-slate-950/50 border border-white/10 rounded-lg aspect-[3/4] flex flex-col items-center justify-center p-2 relative overflow-hidden backdrop-blur-sm shadow-inner">
                    <User size={36} className="text-white/40" />
                    <span className="text-[5px] font-black uppercase text-white/40 tracking-widest mt-1 text-center font-mono">PHOTO REQUIRED</span>
                  </div>

                  <div className="col-span-2 space-y-1.5 text-right flex flex-col justify-center">
                    <div>
                      <span className="text-[5px] text-blue-100/95 font-bold block">NAME / الاسم الكامل</span>
                      <span className="text-xs font-black tracking-tight drop-shadow-sm leading-tight text-white block truncate">{selectedCase.fullName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[5px] text-blue-100/95 font-bold block">NATIONALITY / الجنسية</span>
                        <span className="text-[8px] font-black text-white drop-shadow-sm truncate block">{selectedCase.nationality}</span>
                      </div>
                      <div>
                        <span className="text-[5px] text-blue-100/95 font-bold block">CASE NO / رقم الحالة</span>
                        <span className="text-[8.5px] font-bold font-mono tracking-tight text-white drop-shadow-sm block truncate">{selectedCase.unhcrId}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <span className="text-[4.5px] text-blue-100/95 font-bold block">GENDER / الجنس</span>
                        <span className="text-[7.5px] font-bold text-white block">{selectedCase.gender === 'Male' ? 'ذكر' : selectedCase.gender === 'Female' ? 'أنثى' : 'آخر'}</span>
                      </div>
                      <div>
                        <span className="text-[4.5px] text-blue-100/95 font-bold block">AGE / العمر</span>
                        <span className="text-[7.5px] font-bold text-white block">{selectedCase.age} سنة</span>
                      </div>
                      <div>
                        <span className="text-[4.5px] text-blue-100/95 font-bold block">ISSUED / صدور</span>
                        <span className="text-[7.5px] font-mono font-bold text-white block">
                          {selectedCase.admissionDate ? format(new Date(selectedCase.admissionDate), 'MM/yyyy') : '05/2026'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex items-end justify-between mt-2 text-white">
                  <div className="text-[5px] text-white/60 font-mono uppercase tracking-wide">
                    PORTAL SYSTEM ID: {selectedCase.id.slice(0, 12)}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-end gap-[1.5px] h-4 bg-white/10 p-0.5 rounded-xs">
                      <div className="w-[1px] h-3 bg-white" />
                      <div className="w-[2px] h-3 bg-white" />
                      <div className="w-[1px] h-3 bg-white" />
                      <div className="w-[1.5px] h-3 bg-white" />
                      <div className="w-[1px] h-3 bg-white" />
                      <div className="w-[2px] h-3 bg-white" />
                      <div className="w-[1px] h-3 bg-white" />
                      <div className="w-[1.5px] h-3 bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-right">
              <span className="text-[10px] text-slate-400 font-bold">رقم المستند الرقمي: {selectedCase.unhcrId}</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowIdPreview(false)}
                  className="px-4 py-2 bg-white border border-slate-250 text-slate-705 text-xs font-black rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    alert('تم إرسال طلب طباعة بطاقة الهوية اللاجئة بنجاح.');
                  }}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-black rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-emerald-400" />
                  طباعة الهوية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
