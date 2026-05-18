import React, { useState } from 'react';
import { RefugeeCase, CaseType, Gender, CaseStatus, Priority, User as AppUser, Attachment } from '../types';
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
}

export default function CaseForm({ onSubmit, currentUser }: CaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<RefugeeCase>>({
    type: 'emergency',
    gender: 'Male',
    status: 'Pending',
    priority: 'Medium',
    medicalApprovalStatus: 'Pending',
    improved: false,
    admissionDate: new Date().toISOString().split('T')[0],
    attachments: [],
  });
  const [showMedicalReport, setShowMedicalReport] = useState(false);
  const [attachmentForm, setAttachmentForm] = useState<{ name: string; url: string; category: 'Medical' | 'Social' }>({ 
    name: '', 
    url: '', 
    category: 'Medical' 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
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
    
    if (!formData.assignedTo) {
      alert('يرجى تعيين الحالة لموظف قبل الحفظ');
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay for better UX and progress visibility
    setTimeout(() => {
      const newCase: RefugeeCase = {
        ...formData as any,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        services: [],
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
      setIsSubmitting(false);
    }, 1500);
  };

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

  const InputLabel = ({ label, required }: any) => (
    <label className="label-caps">
      {label}
      {required && <span className="text-rose-500 mr-1">*</span>}
    </label>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">تسجيل حالة جديدة</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Medical Intake Form & Resource Allocation</p>
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
              <InputLabel label="الاسم الكامل" required />
              <input 
                type="text" name="fullName" required 
                className="input-field" placeholder="Full Registered Name"
                onChange={handleChange}
              />
            </div>
            <div>
              <InputLabel label="الجنسية" required />
              <select name="nationality" className="input-field" onChange={handleChange} required>
                <option value="">اختر الجنسية</option>
                <option value="السودان">السودان</option>
                <option value="سوريا">سوريا</option>
                <option value="اليمن">اليمن</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <InputLabel label="المسؤول المباشر" required />
              <select name="assignedTo" className="input-field" onChange={handleChange} required>
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
              <input type="number" name="age" className="input-field" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="الوضع القانوني" />
              <input type="text" name="legalStatus" className="input-field" placeholder="طالب لجوء / لاجئ معترف به" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="الموقع الحالي" />
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" name="currentLocation" className="input-field pr-10" placeholder="المدينة / الحي" onChange={handleChange} />
              </div>
            </div>
          </Section>

          {/* Section 2: UNHCR Details */}
          <Section title="بيانات المفوضية" icon={CreditCard}>
            <div>
              <InputLabel label="رقم المفوضية (UNHCR ID)" required />
              <input type="text" name="unhcrId" required className="input-field font-mono" placeholder="555-XX-XXXX" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="Individual ID" />
              <input type="text" name="individualId" className="input-field font-mono" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="Submission ID" />
              <input type="text" name="submissionId" className="input-field font-mono" onChange={handleChange} />
            </div>
          </Section>

          {/* Section 3: Medical Information */}
          <Section title="المعلومات الطبية الأساسية" icon={Stethoscope}>
            <div className="md:col-span-2">
              <InputLabel label="التشخيص المبدئي" required />
              <textarea name="diagnosis" required className="input-field resize-none h-20" placeholder="وصف الحالة المبدئي..." onChange={handleChange}></textarea>
            </div>
            <div className="md:col-span-1">
              <InputLabel label="المستشفى" required />
              <div className="relative">
                <Building className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" name="hospital" required className="input-field pr-10" placeholder="اسم المستشفى" onChange={handleChange} />
              </div>
            </div>
            <div className="md:col-span-1">
              <InputLabel label="جهة الحجز" required />
              <input type="text" name="bookingEntity" required className="input-field" placeholder="الجهة التي ستحجز الحالة" onChange={handleChange} />
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
                      className="input-field resize-none h-24" 
                      placeholder="أدخل تفاصيل خطة العلاج..."
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <InputLabel label="التاريخ الدوائي (Medication History)" />
                    <textarea 
                      name="medicationHistory" 
                      className="input-field resize-none h-24" 
                      placeholder="أدخل الأدوية الحالية والسابقة..."
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div>
                    <InputLabel label="التدخل المطلوب" />
                    <input type="text" name="intervention" className="input-field" placeholder="عملية / فحوصات / علاج" onChange={handleChange} />
                  </div>
                  <div>
                    <InputLabel label="نوع الخدمة" />
                    <input type="text" name="service" className="input-field" placeholder="مثال: Ward Admission" onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Contact & Logistics */}
          <Section title="التواصل والمتابعة" icon={Phone}>
            <div>
              <InputLabel label="رقم الهاتف" required />
              <input type="tel" name="mobileNumber" required className="input-field" placeholder="01XXXXXXXXX" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="جهة الاتصال" />
              <input type="text" name="contactPerson" className="input-field" placeholder="اسم الشخص المسؤول" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="طريقة التواصل" />
              <select name="contactMethod" className="input-field" onChange={handleChange}>
                <option value="هاتف">اتصال هاتفي</option>
                <option value="واتساب">واتساب</option>
                <option value="بريد">بريد إلكتروني</option>
              </select>
            </div>
          </Section>

          {/* Section 5: Financials */}
          <Section title="البيانات المالية" icon={DollarSign}>
            <div>
              <InputLabel label="التكلفة التقديرية" />
              <input type="number" name="estimatedCost" className="input-field" placeholder="0.00" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="التكلفة الفعلية" />
              <input type="number" name="realCost" className="input-field" placeholder="0.00" onChange={handleChange} />
            </div>
            <div>
              <InputLabel label="حالة الطلب" />
              <select name="status" className="input-field" onChange={handleChange}>
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
                  حفظ الحالة
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
