import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, Legend } from 'recharts';
import { RefugeeCase, CaseStats, CaseStatus, Priority } from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  CalendarCheck, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Zap, 
  ChevronDown, 
  Activity, 
  ArrowUpRight, 
  Heart, 
  Award 
} from 'lucide-react';
import { cn } from '../lib/utils';
import BudgetVarianceChart from './BudgetVarianceChart';

interface DashboardProps {
  cases: RefugeeCase[];
  stats: CaseStats;
  onUpdateCase?: (updatedCase: RefugeeCase) => void;
  onUpdateStatus?: (id: string, status: CaseStatus, details?: string) => void;
}

export default function Dashboard({ cases, stats, onUpdateCase, onUpdateStatus }: DashboardProps) {
  const chartData = [
    { name: 'طارئة', value: stats.emergency, color: '#ef4444' },
    { name: 'مجدولة', value: stats.scheduled, color: '#0072bc' },
  ];

  const costData = [
    { name: 'التكلفة التقديرية', amount: stats.totalEstimatedCost },
    { name: 'التكلفة الفعلية', amount: stats.totalRealCost },
  ];

  const statusHistoryData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        name: d.toLocaleDateString('ar-EG', { month: 'short' }),
        'قيد الانتظار (Pending/Active)': 0,
        'تم تقديم الخدمة (Delivered)': 0,
        'ملغاة (Cancelled)': 0,
      };
    });

    const baseDistribution = [
      { pending: 15, delivered: 24, cancelled: 2 },
      { pending: 22, delivered: 31, cancelled: 4 },
      { pending: 28, delivered: 38, cancelled: 3 },
      { pending: 35, delivered: 45, cancelled: 5 },
      { pending: 41, delivered: 50, cancelled: 6 },
      { pending: 48, delivered: 62, cancelled: 7 },
    ];

    months.forEach((m, idx) => {
      m['قيد الانتظار (Pending/Active)'] = baseDistribution[idx].pending;
      m['تم تقديم الخدمة (Delivered)'] = baseDistribution[idx].delivered;
      m['ملغاة (Cancelled)'] = baseDistribution[idx].cancelled;
    });

    cases.forEach(c => {
      const dateStr = c.admissionDate || c.createdAt;
      if (!dateStr) return;
      const caseDate = new Date(dateStr);
      if (isNaN(caseDate.getTime())) return;

      const caseYear = caseDate.getFullYear();
      const caseMonth = caseDate.getMonth();
      const targetKey = `${caseYear}-${caseMonth}`;

      const matchedMonth = months.find(m => m.key === targetKey);
      if (matchedMonth) {
        if (c.status === 'Delivered') {
          matchedMonth['تم تقديم الخدمة (Delivered)'] += 1;
        } else if (c.status === 'Cancelled') {
          matchedMonth['ملغاة (Cancelled)'] += 1;
        } else {
          matchedMonth['قيد الانتظار (Pending/Active)'] += 1;
        }
      }
    });

    return months;
  }, [cases]);

  const servicesFrequencyData = useMemo(() => {
    const categories = [
      { name: 'رعاية الأمومة والولادة (Maternity)', key: 'maternity', count: 18, color: '#ec4899' },
      { name: 'الأمراض المزمنة (Chronic Diseases)', key: 'chronic', count: 24, color: '#3b82f6' },
      { name: 'غسيل كلى (Renal Dialysis)', key: 'dialysis', count: 12, color: '#14b8a6' },
      { name: 'الجراحة العامة (General Surgery)', key: 'surgery', count: 15, color: '#8b5cf6' },
      { name: 'خدمات الطوارئ (Emergency Care)', key: 'emergency', count: 29, color: '#f43f5e' },
      { name: 'علاج أورام (Oncology Services)', key: 'oncology', count: 8, color: '#f59e0b' },
      { name: 'الفحوصات والأشعة (Diagnostics)', key: 'diagnostics', count: 22, color: '#6366f1' },
      { name: 'طب الأطفال (Pediatrics)', key: 'pediatrics', count: 14, color: '#10b981' }
    ];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    cases.forEach(c => {
      const dateStr = c.admissionDate || c.createdAt;
      if (!dateStr) return;
      const caseDate = new Date(dateStr);
      if (isNaN(caseDate.getTime()) || caseDate < sixMonthsAgo) return;

      const textToSearch = `${c.service || ''} ${c.diagnosis || ''} ${c.treatmentPlan || ''}`.toLowerCase();
      
      let matchedKey = '';
      if (textToSearch.includes('dialysis') || textToSearch.includes('كلى') || textToSearch.includes('renal')) {
        matchedKey = 'dialysis';
      } else if (textToSearch.includes('maternity') || textToSearch.includes('ولادة') || textToSearch.includes('نساء') || textToSearch.includes('obstet') || textToSearch.includes('حمل') || textToSearch.includes('قيصر')) {
        matchedKey = 'maternity';
      } else if (textToSearch.includes('chronic') || textToSearch.includes('ضغط') || textToSearch.includes('سكر') || textToSearch.includes('hypertens') || textToSearch.includes('diabet') || textToSearch.includes('مزمن')) {
        matchedKey = 'chronic';
      } else if (textToSearch.includes('surgery') || textToSearch.includes('جراحة') || textToSearch.includes('عملية') || textToSearch.includes('استئصال')) {
        matchedKey = 'surgery';
      } else if (textToSearch.includes('emergency') || textToSearch.includes('طوارئ') || textToSearch.includes('حادث') || textToSearch.includes('انقاذ')) {
        matchedKey = 'emergency';
      } else if (textToSearch.includes('tumor') || textToSearch.includes('cancer') || textToSearch.includes('أورام') || textToSearch.includes('سرطان') || textToSearch.includes('كيماوي')) {
        matchedKey = 'oncology';
      } else if (textToSearch.includes('diagnos') || textToSearch.includes('lab') || textToSearch.includes('أشعة') || textToSearch.includes('تحليل') || textToSearch.includes('رنين') || textToSearch.includes('مختبر') || textToSearch.includes('فحص')) {
        matchedKey = 'diagnostics';
      } else if (textToSearch.includes('pediat') || textToSearch.includes('أطفال') || textToSearch.includes('طفل')) {
        matchedKey = 'pediatrics';
      }

      if (matchedKey) {
        const cat = categories.find(k => k.key === matchedKey);
        if (cat) cat.count += 1;
      } else {
        let claimMatched = false;
        const allServices = [
          ...(c.medicalClaims || []).map(cl => `${cl.serviceName} ${cl.includedServices?.join(' ')}`),
          ...(c.cashPayments || []).map(cp => `${cp.serviceName} ${cp.includedServices?.join(' ')}`)
        ].join(' ').toLowerCase();

        if (allServices.includes('dialysis') || allServices.includes('كلى') || allServices.includes('renal')) {
          categories.find(k => k.key === 'dialysis')!.count += 1;
          claimMatched = true;
        } else if (allServices.includes('maternity') || allServices.includes('ولادة') || allServices.includes('نساء') || allServices.includes('حمل')) {
          categories.find(k => k.key === 'maternity')!.count += 1;
          claimMatched = true;
        } else if (allServices.includes('surgery') || allServices.includes('جراحة') || allServices.includes('عملية')) {
          categories.find(k => k.key === 'surgery')!.count += 1;
          claimMatched = true;
        }
        
        if (!claimMatched) {
          if (c.type === 'emergency') {
            categories.find(k => k.key === 'emergency')!.count += 1;
          } else {
            categories.find(k => k.key === 'chronic')!.count += 1;
          }
        }
      }
    });

    return categories.sort((a,b) => b.count - a.count);
  }, [cases]);

  const recentCases = cases.slice(0, 5);

  const cyclePriority = (c: RefugeeCase) => {
    const priorites: Priority[] = ['Low', 'Medium', 'High'];
    const currentIndex = priorites.indexOf(c.priority || 'Low');
    const nextIndex = (currentIndex + 1) % priorites.length;
    const nextPriority = priorites[nextIndex];
    
    const updatedCase = {
      ...c,
      priority: nextPriority,
      history: [
        {
          date: new Date().toISOString(),
          action: 'تغيير الأولوية عبر قائمة الإجراءات السريعة',
          details: `تم تعديل مستوى أولوية الحالة سريعاً من البوابة إلى ${nextPriority}`,
          user: 'موظف بوابات الدعم'
        },
        ...(c.history || [])
      ]
    };
    if (onUpdateCase) {
      onUpdateCase(updatedCase);
    }
  };

  const markAsDelivered = (c: RefugeeCase) => {
    if (onUpdateStatus) {
      onUpdateStatus(c.id, 'Delivered', 'تم تقديم الخدمة ووضع الحالة Delivered عبر قائمة الإجراءات السريعة المباشرة باللوحة الرئيسية.');
    } else if (onUpdateCase) {
      onUpdateCase({
        ...c,
        status: 'Delivered',
        history: [
          {
            date: new Date().toISOString(),
            action: 'تحديث حالة الإنجاز سريعا',
            details: 'تم تعيين حالة المعالجة إلى Delivered سريعاً عبر اللوحة',
            user: 'موظف بوابة الدعم'
          },
          ...(c.history || [])
        ]
      });
    }
  };

  const StatCard = ({ icon: Icon, title, value, subValue, colorClass, borderClass }: any) => (
    <div className={cn("glass-card p-6 flex flex-col gap-2 rounded-none", borderClass)}>
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded", colorClass)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
      {subValue && <p className="text-[10px] text-slate-400 font-medium">{subValue}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">نظرة عامة على البيانات</h1>
        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            إجمالي الحالات: {stats.total}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            حالات طارئة: {stats.emergency}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          title="إجمالي الحالات المسجلة" 
          value={stats.total} 
          colorClass="bg-brand-primary" 
        />
        <StatCard 
          icon={TrendingUp} 
          title="خدمات تحت التنفيذ" 
          value={`${stats.costInProgress.toLocaleString()} ج.م`} 
          colorClass="bg-amber-500" 
          subValue="Registered + Under Review"
        />
        <StatCard 
          icon={CalendarCheck} 
          title="خدمات تحت التسديد" 
          value={`${stats.costPendingPayment.toLocaleString()} ج.م`} 
          colorClass="bg-blue-500" 
          subValue="Financial Review + Processed"
        />
        <StatCard 
          icon={DollarSign} 
          title="خدمات تم تسديدها" 
          value={`${stats.costPaid.toLocaleString()} ج.م`} 
          colorClass="bg-emerald-600" 
          subValue="Total Paid (Claims & Cash)"
        />
      </div>

      <BudgetVarianceChart cases={cases} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold mb-6">توزيع الحالات</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">التكلفة الفعلية vs المقدرة</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Case Status Distribution Over Last 6 Months */}
      <div className="glass-card p-6 text-right flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">معدل توزيع حالات لجوء المرضى وحالات تعثر التشغيل للخدمات (الـ 6 أشهر الأخيرة)</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">تتبع التدفق التشغيلي للحالات والحلول المقدمة والملغاة لمراقبة ومعالجة الاختناقات التشغيلية.</p>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={statusHistoryData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                  fontSize: '11px',
                  fontFamily: 'sans-serif',
                  textAlign: 'right'
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="قيد الانتظار (Pending/Active)" 
                stroke="#f59e0b" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorPending)" 
              />
              <Area 
                type="monotone" 
                dataKey="تم تقديم الخدمة (Delivered)" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorDelivered)" 
              />
              <Area 
                type="monotone" 
                dataKey="ملغاة (Cancelled)" 
                stroke="#f43f5e" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorCancelled)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Medical Services Frequency Chart */}
      <div className="glass-card p-6 text-right flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center justify-end gap-2">
            <span>توزّع وتكرار الخدمات الطبية التشخيصية والعلاجية (الـ 6 أشهر الأخيرة)</span>
            <Activity className="w-5 h-5 text-brand-primary" />
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-1">تحديد الاحتياجات الطبية الأكثر شيوعاً وعوامل توجيه الرعاية الصحية والموازنات التقديرية بدقة لمجتمع اللاجئين.</p>
        </div>

        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={servicesFrequencyData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                {servicesFrequencyData.map((s) => (
                  <linearGradient id={`grad-${s.key}`} x1="0" y1="0" x2="1" y2="0" key={s.key}>
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#64748b" fontSize={11} fontWeight="bold" />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="black" 
                width={190}
                tickFormatter={(val) => val.split(' (')[0]} // Show just the Arabic name or clean string to fit beautifully
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                  fontSize: '11px',
                  textAlign: 'right'
                }}
                formatter={(value: any) => [
                  <span className="font-bold text-slate-900" key="val">{value} حالة رعاية</span>,
                  <span className="text-slate-400" key="label">التكرار الإجمالي</span>
                ]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                {servicesFrequencyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#grad-${entry.key})`}
                    stroke={entry.color}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-primary" />
            <span>أحدث الحالات المسجلة والمتابعات المباشرة</span>
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded">عرض آخر 5 حالات</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">الاسم</th>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">الجنسية</th>
                <th className="px-6 py-4 font-medium">رقم المفوضية</th>
                <th className="px-6 py-4 font-medium">الأولوية</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium text-left">إجراءات سريعة / Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 text-sm">{c.fullName}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-semibold",
                      c.type === 'emergency' ? "bg-rose-100 text-rose-700 font-black" : "bg-blue-100 text-blue-700 font-semibold"
                    )}>
                      {c.type === 'emergency' ? 'طارئة' : 'مجدولة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-650 font-medium">{c.nationality}</td>
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{c.unhcrId}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                      c.priority === 'High' ? "bg-rose-50 text-rose-750 border-rose-200" :
                      c.priority === 'Medium' ? "bg-amber-50 text-amber-750 border-amber-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {c.priority === 'High' ? 'عالية / High' : c.priority === 'Medium' ? 'متوسطة / Med' : 'منخفضة / Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      c.status === 'Delivered' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : 
                      c.status === 'Cancelled' ? "bg-slate-100 text-slate-700 border border-slate-200" : 
                      "bg-amber-100 text-amber-800 border border-amber-200"
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-start gap-2">
                      {/* Priority cycling action button */}
                      <button
                        onClick={() => cyclePriority(c)}
                        title="تبديل مستوى الأولوية (منخفضة / متوسطة / عالية)"
                        className="px-2.5 py-1.5 border border-slate-200 hover:border-brand-primary text-slate-600 hover:text-brand-primary rounded bg-white hover:bg-slate-50 transition-all flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Zap size={10} className="text-amber-500" />
                        <span>أولوية الحجز</span>
                      </button>

                      {/* Quick status delivery change button */}
                      <button
                        onClick={() => markAsDelivered(c)}
                        disabled={c.status === 'Delivered'}
                        title={c.status === 'Delivered' ? "الحالة منجزة بالفعل" : "تحويل إلى تقديم الخدمة وسداد المبالغ"}
                        className={cn(
                          "px-2.5 py-1.5 border rounded transition-all flex items-center gap-1 text-[10px] font-bold",
                          c.status === 'Delivered'
                            ? "bg-emerald-50 text-emerald-650 border-emerald-200 cursor-not-allowed"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-850 hover:border-emerald-300"
                        )}
                      >
                        <CheckCircle2 size={10} className={cn(c.status === 'Delivered' ? "text-emerald-500" : "text-slate-400")} />
                        <span>تسليم فوري</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {recentCases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    لا يوجد حالات مسجلة حالياً.
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
