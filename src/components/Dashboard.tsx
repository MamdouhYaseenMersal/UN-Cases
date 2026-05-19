import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { RefugeeCase, CaseStats } from '../types';
import { TrendingUp, AlertTriangle, CalendarCheck, Users, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  cases: RefugeeCase[];
  stats: CaseStats;
}

export default function Dashboard({ cases, stats }: DashboardProps) {
  const chartData = [
    { name: 'طارئة', value: stats.emergency, color: '#ef4444' },
    { name: 'مجدولة', value: stats.scheduled, color: '#0072bc' },
  ];

  const costData = [
    { name: 'التكلفة التقديرية', amount: stats.totalEstimatedCost },
    { name: 'التكلفة الفعلية', amount: stats.totalRealCost },
  ];

  const recentCases = cases.slice(0, 5);

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

      {/* Recent Cases */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">أحدث الحالات المسجلة</h3>
          <button className="text-brand-primary font-medium text-sm hover:underline">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">الاسم</th>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">الجنسية</th>
                <th className="px-6 py-4 font-medium">رقم المفوضية</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{c.fullName}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      c.type === 'emergency' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {c.type === 'emergency' ? 'طارئة' : 'مجدولة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{c.nationality}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{c.unhcrId}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      c.status === 'Delivered' ? "bg-emerald-100 text-emerald-700" : 
                      c.status === 'Cancelled' ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentCases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
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
