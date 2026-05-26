import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  Activity, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export interface ExportLogItem {
  id: string;
  exporterName: string;
  exporterRole: string;
  reportMonth: string;
  format: 'PDF' | 'EXCEL';
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export default function ExportLogs() {
  const [logs, setLogs] = useState<ExportLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'PDF' | 'EXCEL'>('ALL');

  const loadLogs = () => {
    const saved = localStorage.getItem('unhcr_export_logs');
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        setLogs([]);
      }
    } else {
      // Seed initial dummy logs to prevent cold start/empty screens
      const initialSeed: ExportLogItem[] = [
        {
          id: 'exp-1',
          exporterName: 'أحمد الفارسي',
          exporterRole: 'admin',
          reportMonth: 'أبريل 2026',
          format: 'PDF',
          timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
          status: 'SUCCESS'
        },
        {
          id: 'exp-2',
          exporterName: 'ياسر عبد الله',
          exporterRole: 'financial',
          reportMonth: 'مارس 2026',
          format: 'EXCEL',
          timestamp: new Date(Date.now() - 3600000 * 24 * 8).toISOString(), // 8 days ago
          status: 'SUCCESS'
        }
      ];
      localStorage.setItem('unhcr_export_logs', JSON.stringify(initialSeed));
      setLogs(initialSeed);
    }
  };

  useEffect(() => {
    loadLogs();

    const handleUpdate = () => {
      loadLogs();
    };

    window.addEventListener('unhcr_export_logs_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('unhcr_export_logs_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleClearLogs = () => {
    if (window.confirm('هل أنت متأكد من تصفية وحذف سجل العمليات المصدرة بالكامل؟ لا يمكن التراجع عن هذه الخطوة.')) {
      localStorage.setItem('unhcr_export_logs', JSON.stringify([]));
      setLogs([]);
      window.dispatchEvent(new Event('unhcr_export_logs_updated'));
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reportMonth.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFormat = formatFilter === 'ALL' || log.format === formatFilter;

    return matchesSearch && matchesFormat;
  });

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-205';
      case 'financial':
        return 'bg-amber-50 text-amber-700 border-amber-205';
      case 'clinical':
        return 'bg-emerald-50 text-emerald-700 border-emerald-205';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-205';
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'admin':
        return 'مدير النظام (Admin)';
      case 'financial':
        return 'مسؤول حسابات (Financial)';
      case 'clinical':
        return 'منسق خدمات طبية (Clinical)';
      default:
        return 'موظف بوابات (Staff)';
    }
  };

  return (
    <div className="space-y-4 text-right">
      
      {/* Search and Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-end sm:justify-start">
          
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1 text-[10px] font-black tracking-wide text-rose-600 hover:text-rose-800 disabled:opacity-40 border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 px-2.5 py-1.5 rounded transition-all shadow-xs"
          >
            <Trash2 size={11} />
            <span>مسح السجل بالكامل</span>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-150">
            <button
              onClick={() => setFormatFilter('ALL')}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                formatFilter === 'ALL' ? "bg-white text-slate-800 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
              )}
            >
              الكل
            </button>
            <button
              onClick={() => setFormatFilter('PDF')}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1",
                formatFilter === 'PDF' ? "bg-white text-rose-700 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <FileText size={9} />
              PDF
            </button>
            <button
              onClick={() => setFormatFilter('EXCEL')}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1",
                formatFilter === 'EXCEL' ? "bg-white text-emerald-700 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <FileSpreadsheet size={9} />
              EXCEL
            </button>
          </div>

        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-4 py-1.5 text-xs outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-slate-800 transition-all font-medium placeholder:text-slate-400 shadow-sm text-right"
            placeholder="ابحث باسم المصدر، أو شهر التقرير..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-2.5 text-slate-400" size={13} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-650">
              ✖
            </button>
          )}
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[12px] border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3 text-right">الموظف المسؤول</th>
                <th className="p-3 text-center">الصفة الوظيفية</th>
                <th className="p-3 text-center">دورة التقرير المقررة</th>
                <th className="p-3 text-center">نوع مخرجات التصدير</th>
                <th className="p-3 text-center">وقت التصدير والتكرار</th>
                <th className="p-3 text-center rounded-l-xl">الحالة التشغيلية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredLogs.map(log => {
                const formattedDate = format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss');
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          <UserIcon size={10} />
                        </div>
                        <span className="font-extrabold text-slate-800 text-[11px]">{log.exporterName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "inline-block rounded px-2 py-0.5 text-[9px] font-black border uppercase tracking-wider",
                        getRoleBadge(log.exporterRole)
                      )}>
                        {getRoleLabel(log.exporterRole).split(' (')[0]}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {log.reportMonth}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded border shadow-2xs",
                        log.format === 'PDF' 
                          ? "bg-rose-50 text-rose-700 border-rose-200" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {log.format === 'PDF' ? <FileText size={10} /> : <FileSpreadsheet size={10} />}
                        <span>{log.format}</span>
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-[10px] text-slate-550">
                      {formattedDate}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black text-[9.5px]">
                        ✓ تم التوليد بنجاح
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="text-slate-300 w-6 h-6" />
                      <span>لا توجد تقارير تم تصديرها مطابقة للتصفية الحالية.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
