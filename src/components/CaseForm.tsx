import React, { useState } from 'react';
import { RefugeeCase, CaseType, Gender, CaseStatus, Priority, User as AppUser, Attachment, MedicalClaim, CashPayment } from '../types';
import { 
  User, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Stethoscope, 
  DollarSign, 
  Save, 
  X,
  CreditCard,
  Building,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  AlertCircle,
  ShieldCheck,
  Tag,
  Loader2,
  Paperclip,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CaseFormProps {
  onSubmit: (data: RefugeeCase) => void;
  currentUser: AppUser;
  initialCase?: RefugeeCase;
  onCancel?: () => void;
}

// Sub-components moved outside to prevent focus loss during re-renders
const InputLabel = ({ label, required, error }: any) => (
  <div className="flex flex-col gap-1">
    <label className="label-caps">
      {label}
      {required && <span className="text-rose-500 mr-1">*</span>}
    </label>
    {error && <span className="text-[9px] text-rose-500 font-bold mb-1">{error}</span>}
  </div>
);

const Section = ({ title, icon: Icon, children }: any) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-6">
      <Icon className="w-4 h-4 text-brand-primary" />
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </div>
);

export default function CaseForm({ onSubmit, currentUser, initialCase, onCancel }: CaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<RefugeeCase>>(initialCase || {
    type: 'emergency',
    gender: 'Male',
    status: 'Pending',
    priority: 'Medium',
    medicalApprovalStatus: 'Pending',
    paymentType: 'Claim',
    improved: false,
    admissionDate: new Date().toISOString().split('T')[0],
    attachments: [],
    medicalClaims: [],
  });

  const isEdit = !!initialCase;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName?.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
    if (!formData.unhcrId?.trim()) newErrors.unhcrId = 'رقم المفوضية مطلوب';
    if (!formData.nationality) newErrors.nationality = 'الجنسية مطلوبة';
    if (!formData.assignedTo) newErrors.assignedTo = 'يجب تعيين موظف للمتابعة';
    if (!formData.diagnosis?.trim()) newErrors.diagnosis = 'التشخيص المبدئي مطلوب';
    if (!formData.hospital?.trim()) newErrors.hospital = 'اسم المستشفى مطلوب';
    if (!formData.bookingEntity?.trim()) newErrors.bookingEntity = 'جهة الحجز مطلوبة';
    if (!formData.mobileNumber?.trim()) {
      newErrors.mobileNumber = 'رقم الهاتف مطلوب';
    } else if (!/^01[0125][0-9]{8}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'رقم هاتف مصري غير صحيح (مطلوب 11 رقم ببدابة 01)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [showMedicalReport, setShowMedicalReport] = useState(false);
  const [attachmentForm, setAttachmentForm] = useState<{ name: string; url: string; category: 'Medical' | 'Social' }>({ 
    name: '', 
    url: '', 
    category: 'Medical' 
  });
  
  const [claimServices, setClaimServices] = useState<{ name: string; cost: number; discount: number; id: string }[]>([]);
  const [currentService, setCurrentService] = useState({ name: '', cost: 0, discount: 0 });

  const [scheduledItems, setScheduledItems] = useState<{ name: string; plannedDate: string; id: string }[]>([]);
  const [currentScheduledItem, setCurrentScheduledItem] = useState({ name: '', plannedDate: '' });

  const addScheduledItem = () => {
    if (currentScheduledItem.name && currentScheduledItem.plannedDate) {
      setScheduledItems([...scheduledItems, { ...currentScheduledItem, id: Math.random().toString(36).substr(2, 9) }]);
      setCurrentScheduledItem({ name: '', plannedDate: '' });
    }
  };

  const removeScheduledItem = (id: string) => {
    setScheduledItems(scheduledItems.filter(s => s.id !== id));
  };

  const addServiceItem = () => {
    if (currentService.name && currentService.cost >= 0) {
      setClaimServices([...claimServices, { ...currentService, id: Math.random().toString(36).substr(2, 9) }]);
      setCurrentService({ name: '', cost: 0, discount: 0 });
    }
  };

  const removeServiceItem = (id: string) => {
    setClaimServices(claimServices.filter(s => s.id !== id));
  };

  const totalGross = claimServices.reduce((sum, s) => sum + s.cost, 0);
  const totalNet = claimServices.reduce((sum, s) => sum + (s.cost * (1 - s.discount / 100)), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAddAttachment = () => {
    if (attachmentForm.name && attachmentForm.url) {
      const newAtt: Attachment = {
        name: attachmentForm.name,
        url: attachmentForm.url,
        category: attachmentForm.category,
        date: new Date().toISOString()
      };
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAtt]
      }));
      setAttachmentForm({ name: '', url: '', category: 'Medical' });
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay for better UX and progress visibility
    setTimeout(() => {
      if (isEdit) {
        const historyEntry = {
          date: new Date().toISOString(),
          action: 'تعديل بيانات الحالة',
          details: 'تم تحديث بيانات المريض الأساسية بواسطة الموظف المسؤول',
          user: currentUser.name
        };
        const updatedCase: RefugeeCase = {
          ...initialCase!,
          ...formData as any,
          history: [historyEntry, ...(initialCase!.history || [])]
        };
        onSubmit(updatedCase);
      } else {
        const medicalClaims: MedicalClaim[] = [];
        const cashPayments: CashPayment[] = [];
        
        if (formData.paymentType === 'Claim') {
          medicalClaims.push({
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            serviceName: formData.diagnosis || 'Medical Service Claim',
            provider: formData.hospital || 'Hospital Provider',
            totalAmount: 0,
            discountPercentage: 0,
            netAmount: 0,
            status: 'Registered',
            includedServices: [],
            lineItems: [],
            history: [{
              date: new Date().toISOString(),
              action: 'تسجيل مطالبة أولية',
              details: 'تم إنشاء مسودة المطالبة عند تسجيل الحالة. يرجى إضافة البنود المالية من قسم المطالبات.',
              user: currentUser.name
            }]
          });
        } else if (formData.paymentType === 'Cash') {
          cashPayments.push({
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            serviceName: formData.diagnosis || 'Cash Service Payment',
            provider: formData.hospital || 'Provider',
            totalAmount: 0,
            discountPercentage: 0,
            netAmount: 0,
            status: 'Registered',
            includedServices: [],
            lineItems: [],
            history: [{
              date: new Date().toISOString(),
              action: 'تسجيل دفع كاش أولي',
              details: 'تم إنشاء مسودة الدفع الكاش عند تسجيل الحالة. يرجى إضافة البنود المالية من قسم إدارة الكاش.',
              user: currentUser.name
            }]
          });
        }

        const newCase: RefugeeCase = {
          ...formData as any,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          services: [],
          medicalClaims: medicalClaims,
          cashPayments: cashPayments,
          serviceSchedule: formData.type === 'scheduled' ? scheduledItems.map(item => ({
            ...item,
            status: 'Planned'
          })) : [],
          followUps: [],
          costBreakdown: {
            medication: 0,
            consultation: 0,
            procedure: 0,
            other: 0
          },
          history: [
            {
              date: new Date().toISOString(),
              action: 'تسجيل الحالة',
              details: `تم إنشاء ملف الحالة الجديد في النظام وتعيينه إلى ${formData.assignedTo || 'غير محدد'}`,
              user: currentUser.name
            }
          ]
        };
        onSubmit(newCase);
      }
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
          {isEdit ? 'تعديل بيانات الحالة' : 'تسجيل حالة جديدة'}
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          {isEdit ? 'Update Refugee Profile & Medical Record' : 'Medical Intake Form & Resource Allocation'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12 pb-20">
        {/* Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'emergency' })}
            className={cn(
              "p-6 rounded border-2 transition-all flex items-center justify-between group",
              formData.type === 'emergency' 
                ? "border-brand-urgent bg-rose-50 shadow-md" 
                : "border-slate-100 hover:border-slate-200 bg-white"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded transition-colors text-white",
                formData.type === 'emergency' ? "bg-brand-urgent" : "bg-slate-100 text-slate-400"
              )}>
                <HeartPulse size={24} />
              </div>
              <div className="text-right">
                <p className="font-black text-lg tracking-tighter uppercase">حالة طارئة</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Urgent Response Track</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'scheduled' })}
            className={cn(
              "p-6 rounded border-2 transition-all flex items-center justify-between group",
              formData.type === 'scheduled' 
                ? "border-brand-primary bg-blue-50 shadow-md" 
                : "border-slate-100 hover:border-slate-200 bg-white"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded transition-colors text-white",
                formData.type === 'scheduled' ? "bg-brand-primary" : "bg-slate-100 text-slate-400"
              )}>
                <FileText size={24} />
              </div>
              <div className="text-right">
                <p className="font-black text-lg tracking-tighter uppercase">خدمة مجدولة</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Scheduled Support Queue</p>
              </div>
            </div>
          </button>
        </div>

        <div className="glass-card p-8 space-y-12 rounded-none">
          {/* Section 1: Basic Information */}
          <Section title="البيانات الشخصية والتعريفية" icon={User}>
            <div>
              <InputLabel label="الاسم الكامل" required error={errors.fullName} />
              <input 
                type="text" name="fullName" required 
                className={cn("input-field", errors.fullName && "border-rose-300 bg-rose-50")} placeholder="Full Registered Name"
                value={formData.fullName || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <InputLabel label="الجنسية" required error={errors.nationality} />
              <select name="nationality" className={cn("input-field", errors.nationality && "border-rose-300 bg-rose-50")} onChange={handleChange} required value={formData.nationality || ''}>
                <option value="">اختر الجنسية</option>
                <option value="السودان">السودان</option>
                <option value="سوريا">سوريا</option>
                <option value="اليمن">اليمن</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <InputLabel label="المسؤول المباشر" required error={errors.assignedTo} />
              <select name="assignedTo" className={cn("input-field", errors.assignedTo && "border-rose-300 bg-rose-50")} onChange={handleChange} required value={formData.assignedTo || ''}>
                <option value="">اختر موظف</option>
                <option value="أحمد الفارسي">أحمد الفارسي</option>
                <option value="سارة محمد">سارة محمد</option>
                <option value="خالد إبراهيم">خالد إبراهيم</option>
              </select>
            </div>
            <div>
              <InputLabel label="الأولوية" required />
              <select name="priority" className="input-field" onChange={handleChange} value={formData.priority}>
                <option value="Low">منخفضة / Low</option>
                <option value="Medium">متوسطة / Medium</option>
                <option value="High">عالية / High</option>
              </select>
            </div>
            <div>
              <InputLabel label="النوع" required />
              <div className="flex gap-2">
                {['Male', 'Female'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g as any })}
                    className={cn(
                      "flex-1 py-1 rounded border text-[10px] font-black uppercase tracking-widest transition-all",
                      formData.gender === g 
                        ? "bg-slate-900 text-white border-slate-900 shadow" 
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {g === 'Male' ? 'ذكر / M' : 'أنثى / F'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <InputLabel label="العمر" />
              <input type="number" name="age" className="input-field" onChange={handleChange} value={formData.age || ''} />
            </div>
            <div>
              <InputLabel label="الوضع القانوني" />
              <input type="text" name="legalStatus" className="input-field" placeholder="طالب لجوء / لاجئ معترف به" onChange={handleChange} value={formData.legalStatus || ''} />
            </div>
            <div>
              <InputLabel label="الموقع الحالي" />
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" name="currentLocation" className="input-field pr-10" placeholder="المدينة / الحي" onChange={handleChange} value={formData.currentLocation || ''} />
              </div>
            </div>
            <div>
              <InputLabel label="تحسن الحالة (Improved Status)" />
              <div className="flex items-center gap-2 h-10 mt-1">
                <input 
                  type="checkbox" 
                  name="improved" 
                  id="improved-checkbox"
                  className="w-4 h-4 rounded border-slate-200 text-brand-primary focus:ring-brand-primary cursor-pointer" 
                  checked={formData.improved}
                  onChange={(e) => setFormData({...formData, improved: e.target.checked})} 
                />
                <label htmlFor="improved-checkbox" className="text-xs font-bold text-slate-600 cursor-pointer">هل طرأ تحسن على الحالة؟</label>
              </div>
            </div>
          </Section>

          {/* Section 2: UNHCR Details */}
          <Section title="بيانات المفوضية" icon={CreditCard}>
            <div>
              <InputLabel label="رقم المفوضية (UNHCR ID)" required error={errors.unhcrId} />
              <input type="text" name="unhcrId" required className={cn("input-field font-mono", errors.unhcrId && "border-rose-300 bg-rose-50")} placeholder="555-XX-XXXX" onChange={handleChange} value={formData.unhcrId || ''} />
            </div>
            <div>
              <InputLabel label="Individual ID" />
              <input type="text" name="individualId" className="input-field font-mono" onChange={handleChange} value={formData.individualId || ''} />
            </div>
            <div>
              <InputLabel label="Submission ID" />
              <input type="text" name="submissionId" className="input-field font-mono" onChange={handleChange} value={formData.submissionId || ''} />
            </div>
          </Section>

          {/* Section 3: Medical Information */}
          <Section title="المعلومات الطبية الأساسية" icon={Stethoscope}>
            <div className="md:col-span-2">
              <InputLabel label="التشخيص المبدئي" required error={errors.diagnosis} />
              <textarea 
                name="diagnosis" 
                required 
                className={cn("input-field resize-none min-h-[150px] leading-relaxed", errors.diagnosis && "border-rose-300 bg-rose-50")} 
                placeholder="وصف الحالة المبدئي، التاريخ المرضي، وتفاصيل التشخيص... (اضغط Enter لنزول سطر جديد)" 
                onChange={handleChange} 
                value={formData.diagnosis || ''}
              ></textarea>
            </div>
            <div className="md:col-span-1">
              <InputLabel label="المستشفى" required error={errors.hospital} />
              <div className="relative">
                <Building className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" name="hospital" required className={cn("input-field pr-10", errors.hospital && "border-rose-300 bg-rose-50")} placeholder="اسم المستشفى" onChange={handleChange} value={formData.hospital || ''} />
              </div>
            </div>
            <div className="md:col-span-1">
              <InputLabel label="جهة الحجز" required error={errors.bookingEntity} />
              <input type="text" name="bookingEntity" required className={cn("input-field", errors.bookingEntity && "border-rose-300 bg-rose-50")} placeholder="الجهة التي ستحجز الحالة" onChange={handleChange} value={formData.bookingEntity || ''} />
            </div>
            <div className="md:col-span-1">
              <InputLabel label="تاريخ الدخول" />
              <input type="date" name="admissionDate" className="input-field" onChange={handleChange} value={formData.admissionDate || ''} />
            </div>
            <div className="md:col-span-1">
              <InputLabel label="الموافقة الطبية" required />
              <select name="medicalApprovalStatus" className="input-field" onChange={handleChange} value={formData.medicalApprovalStatus}>
                <option value="Pending">تحت الانتظار / Pending</option>
                <option value="Approved">تمت الموافقة / Approved</option>
                <option value="Rejected">مرفوضة / Rejected</option>
              </select>
            </div>
          </Section>

          {/* Service Schedule Section for Scheduled Cases */}
          {formData.type === 'scheduled' && (
            <Section title="جدول الخدمات المجدولة" icon={ClipboardList}>
              <div className="md:col-span-3 space-y-4">
                <div className="bg-blue-50 p-6 border border-blue-100 rounded-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <InputLabel label="اسم الخدمة المجدولة" />
                      <input 
                        type="text" className="input-field" 
                        placeholder="مثال: جلسة غسيل كلوي، مراجعة دورية..."
                        value={currentScheduledItem.name}
                        onChange={(e) => setCurrentScheduledItem({...currentScheduledItem, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <InputLabel label="تاريخ الخدمة المتوقع" />
                      <input 
                        type="date" className="input-field" 
                        value={currentScheduledItem.plannedDate}
                        onChange={(e) => setCurrentScheduledItem({...currentScheduledItem, plannedDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={addScheduledItem}
                    className="btn-secondary w-full py-2 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]"
                  >
                    <Plus size={14} />
                    إضافة إلى جدول الخدمات
                  </button>
                </div>

                {scheduledItems.length > 0 && (
                  <div className="border border-slate-100 rounded">
                    <table className="w-full text-[10px] text-right border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 border-b border-slate-100">الخدمة</th>
                          <th className="p-3 border-b border-slate-100 text-center">التاريخ المجدول</th>
                          <th className="p-3 border-b border-slate-100 text-center">الحالة</th>
                          <th className="p-3 border-b border-slate-100"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledItems.map(item => (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0">
                            <td className="p-3 font-bold text-slate-700">{item.name}</td>
                            <td className="p-3 text-center text-slate-500">{item.plannedDate}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-black uppercase tracking-widest">Planned</span>
                            </td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => removeScheduledItem(item.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Detailed Medical Report (Collapsible) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowMedicalReport(!showMedicalReport)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded shadow-sm">
                  <ClipboardList className="w-4 h-4 text-brand-primary" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-[0.1em]">تقرير طبي مفصل (اختياري)</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Detailed Clinical Report & History</p>
                </div>
              </div>
              {showMedicalReport ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showMedicalReport && (
              <div className="p-6 border border-slate-100 bg-white space-y-6 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <InputLabel label="خطة العلاج المقترحة (Treatment Plan)" />
                    <textarea 
                      name="treatmentPlan" 
                      className="input-field resize-none min-h-[120px] leading-relaxed" 
                      placeholder="أدخل تفاصيل خطة العلاج المقترحة والخطوات القادمة..."
                      onChange={handleChange}
                      value={formData.treatmentPlan || ''}
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <InputLabel label="التاريخ المرضي والدوائي (Medical History)" />
                    <textarea 
                      name="medicationHistory" 
                      className="input-field resize-none min-h-[120px] leading-relaxed" 
                      placeholder="أدخل التاريخ المرضي بالتفصيل والأدوية الحالية والسابقة والحساسية..."
                      onChange={handleChange}
                      value={formData.medicationHistory || ''}
                    ></textarea>
                  </div>
                  <div>
                    <InputLabel label="التدخل المطلوب" />
                    <input type="text" name="intervention" className="input-field" placeholder="عملية / فحوصات / علاج" onChange={handleChange} value={formData.intervention || ''} />
                  </div>
                  <div>
                    <InputLabel label="نوع الخدمة" />
                    <input type="text" name="service" className="input-field" placeholder="مثال: Ward Admission" onChange={handleChange} value={formData.service || ''} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Contact & Logistics */}
          <Section title="التواصل والمتابعة" icon={Phone}>
            <div>
              <InputLabel label="رقم الهاتف" required error={errors.mobileNumber} />
              <input type="tel" name="mobileNumber" required className={cn("input-field", errors.mobileNumber && "border-rose-300 bg-rose-50")} placeholder="01XXXXXXXXX" onChange={handleChange} value={formData.mobileNumber || ''} />
            </div>
            <div>
              <InputLabel label="رقم الهاتف (جهاز الاتصال)" />
              <input type="tel" name="contactNumber" className="input-field" placeholder="01XXXXXXXXX" onChange={handleChange} value={formData.contactNumber || ''} />
            </div>
            <div>
              <InputLabel label="صلة القرابة" />
              <input type="text" name="contactRelationship" className="input-field" placeholder="Family / Guardian / Friend" onChange={handleChange} value={formData.contactRelationship || ''} />
            </div>
            <div>
              <InputLabel label="جهة الاتصال" />
              <input type="text" name="contactPerson" className="input-field" placeholder="اسم الشخص المسؤول" onChange={handleChange} value={formData.contactPerson || ''} />
            </div>
            <div>
              <InputLabel label="طريقة التواصل" />
              <select name="contactMethod" className="input-field" onChange={handleChange} value={formData.contactMethod || ''}>
                <option value="هاتف">اتصال هاتفي</option>
                <option value="واتساب">واتساب</option>
                <option value="بريد">بريد إلكتروني</option>
              </select>
            </div>
          </Section>

          {/* Section 5: Financials */}
          <Section title="البيانات المالية" icon={DollarSign}>
            <div>
              <InputLabel label="نوع الدفع" />
              <select name="paymentType" className="input-field" onChange={handleChange} value={formData.paymentType || 'Claim'}>
                <option value="Cash">كاش / Cash</option>
                <option value="Claim">مطالبة / Claim</option>
              </select>
            </div>
            <div>
              <InputLabel label="التكلفة التقديرية" />
              <input type="number" name="estimatedCost" className="input-field" placeholder="0.00" onChange={handleChange} value={formData.estimatedCost || ''} />
            </div>
            <div>
              <InputLabel label="حالة الملف" />
              <select name="status" className="input-field" onChange={handleChange} value={formData.status || 'Pending'}>
                <option value="Pending">قيد الانتظار</option>
                <option value="Delivered">تم التنفيذ</option>
                <option value="Cancelled">ملغي</option>
              </select>
            </div>
          </Section>

          {/* Section 6: Attachments (Simulation) */}
          <Section title="المرفقات والوثائق" icon={Paperclip}>
            <div className="md:col-span-2 space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <InputLabel label="نوع الملف" />
                  <select 
                    className="input-field"
                    value={attachmentForm.category}
                    onChange={(e) => setAttachmentForm({...attachmentForm, category: e.target.value as any})}
                  >
                    <option value="Medical">طبي / Medical</option>
                    <option value="Social">اجتماعي / Social</option>
                  </select>
                </div>
                <div className="flex-[2] space-y-1">
                  <InputLabel label="اسم الوثيقة" />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="مثال: التقرير الطبي بصيغة PDF"
                    value={attachmentForm.name}
                    onChange={(e) => setAttachmentForm({...attachmentForm, name: e.target.value})}
                  />
                </div>
                <div className="flex-[2] space-y-1">
                  <InputLabel label="رابط الوثيقة / URL" />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="https://example.com/medical-report.pdf"
                    value={attachmentForm.url}
                    onChange={(e) => setAttachmentForm({...attachmentForm, url: e.target.value})}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  disabled={!attachmentForm.name || !attachmentForm.url}
                  className="bg-slate-900 text-white p-2.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-4">
                {formData.attachments?.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="flex items-center gap-3">
                      <Paperclip size={14} className="text-slate-400" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{att.name}</span>
                          <span className={cn(
                            "text-[8px] px-1 rounded font-bold uppercase",
                            att.category === 'Social' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {att.category === 'Social' ? 'اجتماعي' : 'طبي'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono truncate max-w-[200px]">{att.url}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(!formData.attachments || formData.attachments.length === 0) && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase py-4 text-center border-2 border-dashed border-slate-100 rounded">
                    لا يوجد مرفقات مضافة حالياً
                  </p>
                )}
              </div>
            </div>
          </Section>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-end gap-4">
            <button 
              type="button" 
              className="btn-secondary px-8"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="btn-primary px-12 relative"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {isEdit ? 'تحديث البيانات' : 'حفظ الحالة'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
