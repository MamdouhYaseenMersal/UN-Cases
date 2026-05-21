import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  Stethoscope, 
  Key, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Search, 
  Shield, 
  RefreshCw, 
  AlertCircle,
  Phone,
  Building,
  Mail,
  Lock,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

interface SettingsManagementProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onUpdateCurrentUser: (user: User) => void;
}

const defaultDoctors: Doctor[] = [
  { id: 'doc-1', name: 'د. جلال البحيري', specialty: 'استشاري جراحة قلب وصدر', hospital: 'مستشفى دار الفؤاد', phone: '01004561234', email: 'g.beheiry@daralfouad.com', status: 'active' },
  { id: 'doc-2', name: 'د. سميرة عثمان', specialty: 'أخصائي رعاية حرجة وطوارئ', hospital: 'المستشفى الإيطالي', phone: '01123456789', email: 's.othman@italian-hosp.eg', status: 'active' },
  { id: 'doc-3', name: 'د. تامر السعيد', specialty: 'استشاري جراحة العظام والعمود الفقري', hospital: 'مستشفى الشروق', phone: '01255566677', email: 't.said@shorouk-med.org', status: 'active' },
  { id: 'doc-4', name: 'د. نادية عبد العزيز', specialty: 'استشاري التحاليل الطبية والجينات', hospital: 'مختبرات معمل البرج', phone: '01056789012', email: 'nadia.aziz@alborglabs.com', status: 'active' },
  { id: 'doc-5', name: 'د. خالد منتصر', specialty: 'أخصائي باطنة وجهاز هضمي', hospital: 'مستشفى مصر الدولي', phone: '01599887766', email: 'k.montaser@misr-hosp.com', status: 'inactive' }
];

const defaultUsers: User[] = [
  { id: 'u-1', name: 'أحمد الفارسي', email: 'ahmed@example.com', role: 'admin', status: 'active' },
  { id: 'u-2', name: 'د. سارة جلال', email: 'sara.galal@unhcr-support.org', role: 'clinical', status: 'active' },
  { id: 'u-3', name: 'ياسر عبد الله', email: 'yasser.a@unhcr-support.org', role: 'financial', status: 'active' },
  { id: 'u-4', name: 'رنا خالد', email: 'rana.k@unhcr-support.org', role: 'staff', status: 'active' },
  { id: 'u-5', name: 'منى الشريف', email: 'mona.s@unhcr-support.org', role: 'staff', status: 'inactive' }
];

export default function SettingsManagement({ currentUser, onSwitchUser, onUpdateCurrentUser }: SettingsManagementProps) {
  const [activeTab, setActiveTab] = useState<'doctors' | 'users' | 'permissions'>('doctors');
  
  // State for Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorForm, setDoctorForm] = useState<Omit<Doctor, 'id'>>({
    name: '',
    specialty: '',
    hospital: '',
    phone: '',
    email: '',
    status: 'active'
  });
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [editingDoctorForm, setEditingDoctorForm] = useState<Doctor | null>(null);

  // State for Users
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userForm, setUserForm] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: 'staff',
    status: 'active'
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserForm, setEditingUserForm] = useState<User | null>(null);

  // Load initially from LocalStorage or default
  useEffect(() => {
    const savedDocs = localStorage.getItem('app_doctors');
    if (savedDocs) {
      try {
        setDoctors(JSON.parse(savedDocs));
      } catch (e) {
        setDoctors(defaultDoctors);
      }
    } else {
      setDoctors(defaultDoctors);
      localStorage.setItem('app_doctors', JSON.stringify(defaultDoctors));
    }

    const savedUsers = localStorage.getItem('app_users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        setUsers(defaultUsers);
      }
    } else {
      setUsers(defaultUsers);
      localStorage.setItem('app_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // Save to LocalStorage helper
  const saveDoctors = (list: Doctor[]) => {
    setDoctors(list);
    localStorage.setItem('app_doctors', JSON.stringify(list));
    // Also trigger global update event if other screens use it
    window.dispatchEvent(new Event('storage'));
  };

  const saveUsers = (list: User[]) => {
    setUsers(list);
    localStorage.setItem('app_users', JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
  };

  // Doctors Logic
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name.trim() || !doctorForm.specialty.trim() || !doctorForm.hospital.trim()) {
      alert('يرجى ملء الحقول الإلزامية للأраيب (الاسم، التخصص، المستشفى)');
      return;
    }
    const newDoc: Doctor = {
      ...doctorForm,
      id: 'doc-' + Date.now()
    };
    saveDoctors([newDoc, ...doctors]);
    setDoctorForm({
      name: '',
      specialty: '',
      hospital: '',
      phone: '',
      email: '',
      status: 'active'
    });
  };

  const handleStartEditDoctor = (doc: Doctor) => {
    setEditingDoctorId(doc.id);
    setEditingDoctorForm({ ...doc });
  };

  const handleSaveEditDoctor = () => {
    if (!editingDoctorForm) return;
    const isOk = doctors.map(d => d.id === editingDoctorForm.id ? editingDoctorForm : d);
    saveDoctors(isOk);
    setEditingDoctorId(null);
    setEditingDoctorForm(null);
  };

  const handleDeleteDoctor = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطبيب/المزود من قائمة النظام؟')) {
      const filtered = doctors.filter(d => d.id !== id);
      saveDoctors(filtered);
    }
  };

  // Users Logic
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert('الرجاء تعبئة اسم المستخدم وبريده الإلكتروني');
      return;
    }
    const newUser: User = {
      ...userForm,
      id: 'u-' + Date.now()
    };
    saveUsers([newUser, ...users]);
    setUserForm({
      name: '',
      email: '',
      role: 'staff',
      status: 'active'
    });
  };

  const handleStartEditUser = (usr: User) => {
    setEditingUserId(usr.id);
    setEditingUserForm({ ...usr });
  };

  const handleSaveEditUser = () => {
    if (!editingUserForm) return;
    const isOk = users.map(u => u.id === editingUserForm.id ? editingUserForm : u);
    saveUsers(isOk);
    
    // If we've updated the currently logged in user, refresh their active state too!
    if (editingUserForm.id === currentUser.id) {
      onUpdateCurrentUser(editingUserForm);
    }

    setEditingUserId(null);
    setEditingUserForm(null);
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert('عفواً، لا يمكنك حذف حساب المستخدم النشط حالياً!');
      return;
    }
    if (confirm('هل أنت متأكد من تعطيل/حذف حساب هذا المستخدم؟')) {
      const filtered = users.filter(u => u.id !== id);
      saveUsers(filtered);
    }
  };

  // Switch Active Session immediately
  const handleSwitchActiveSession = (usr: User) => {
    if (usr.status === 'inactive') {
      alert('هذا الحساب معطل حالياً بنظام الضوابط. يرجى تفعيله أولاً للتمكن من استخدامه.');
      return;
    }
    onSwitchUser(usr);
  };

  // Search filter
  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doc.hospital.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredUsers = users.filter(usr => 
    usr.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    usr.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const roleLabels: Record<UserRole, { title: string; color: string; desc: string }> = {
    admin: { title: 'مدير النظام (Admin)', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', desc: 'كامل الصلاحيات الفنية والمالية، وإجراءات الحذف وتعديل الإعدادات وإدارة الحسابات.' },
    clinical: { title: 'منسق طبي (Clinical)', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'صلاحيات تعديل التشخيص والتدخل والخطة العلاجية وجدولة الخدمات الطبية. لا يملك صلاحيات مالية.' },
    financial: { title: 'مسؤول مالي (Financial)', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'إدارة المطالبات، تجهيز الكاش، مراجعة فئات الفواتير وتعديل الخصومات وبنود الدفع. لا يعدل بيانات طبية.' },
    staff: { title: 'موظف تسجيل (Staff)', color: 'bg-slate-100 text-slate-700 border-slate-200', desc: 'إدخال وتسجيل الحالات الجديدة، مراجعة القائمة ومتابعة الملحقات. صلاحياته الأساسية وقائية تمنع التعديلات المالية والطبية الحساسة.' }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-right">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Lock className="text-emerald-600 w-5 h-5" />
            <span>لوحة الإعدادات والتحكم في الصلاحيات</span>
          </h2>
          <span className="text-xs text-slate-400 font-bold block mt-1">
            تهيئة وتعيين الكادر الطبي، حسابات الموظفين، وأدوار الوصول الرقمية لبوابة دعم اللاجئين.
          </span>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150 justify-end">
          <div className="text-left md:text-right">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">المستخدم المفعل حالياً</p>
            <p className="text-xs font-black text-slate-800">{currentUser.name}</p>
          </div>
          <div className="w-9 h-9 bg-brand-primary rounded-full flex items-center justify-center font-bold text-white text-sm">
            {currentUser.name[0]}
          </div>
          <span className={cn(
            "text-[9px] px-2 py-0.5 rounded-full font-bold border",
            roleLabels[currentUser.role]?.color
          )}>
            {roleLabels[currentUser.role]?.title}
          </span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto justify-start md:flex-row-reverse">
        <button
          onClick={() => setActiveTab('doctors')}
          className={cn(
            "px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 whitespace-nowrap",
            activeTab === 'doctors' ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Stethoscope size={15} />
          <span>الأطباء ومزودي الخدمة ({doctors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 whitespace-nowrap",
            activeTab === 'users' ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Users size={15} />
          <span>الموظفين والمستخدمين ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={cn(
            "px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 whitespace-nowrap",
            activeTab === 'permissions' ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Key size={15} />
          <span>مصفوفة الأدوار والصلاحيات</span>
        </button>
      </div>

      {/* Tab: Doctors */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
          {/* Add Doctor Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-sm h-fit">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Plus size={14} className="text-emerald-500" />
              <span>إدراج طبيب / مزود خدمة جديد</span>
            </h3>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="label-caps mb-1 block text-slate-600">اسم الطبيب بالكامل <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  className="input-field shadow-sm text-right" 
                  placeholder="مثال: د. محمد عادل الشافعي"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label-caps mb-1 block text-slate-600">التخصص الطبي <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  className="input-field shadow-sm text-right" 
                  placeholder="مثال: أخصائي رعاية أطفال وتأهيل"
                  value={doctorForm.specialty}
                  onChange={(e) => setDoctorForm({...doctorForm, specialty: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label-caps mb-1 block text-slate-600">المستشفى / الجهة الطبية <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  className="input-field shadow-sm text-right" 
                  placeholder="مثال: مستشفى عين شمس التخصصي"
                  value={doctorForm.hospital}
                  onChange={(e) => setDoctorForm({...doctorForm, hospital: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-caps mb-1 block text-slate-600">رقم الهاتف</label>
                  <input 
                    type="text" 
                    className="input-field text-center font-bold font-mono shadow-sm" 
                    placeholder="01xxxxxxxxx"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({...doctorForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label-caps mb-1 block text-slate-600">الحالة التشغيلية</label>
                  <select 
                    className="input-field font-bold text-center shadow-sm"
                    value={doctorForm.status}
                    onChange={(e) => setDoctorForm({...doctorForm, status: e.target.value as 'active' | 'inactive'})}
                  >
                    <option value="active" className="text-emerald-600 font-bold">نشط بالبوابة</option>
                    <option value="inactive" className="text-rose-600 font-bold">غير نشط</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label-caps mb-1 block text-slate-600">البريد الإلكتروني المعتمد</label>
                <input 
                  type="email" 
                  className="input-field font-mono shadow-sm" 
                  placeholder="doctor@hospital.org"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-primary text-white hover:bg-emerald-600 font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow"
              >
                <Plus size={15} />
                <span>إضافة الطبيب لقاعدة البيانات</span>
              </button>
            </form>
          </div>

          {/* List of Doctors */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-4 py-1.5 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 transition-all font-medium placeholder:text-slate-400 shadow-sm text-right"
                  placeholder="ابحث باسم الطبيب، المستشفى، أو التخصص..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                />
                <Search className="absolute right-3 top-2.5 text-slate-400" size={13} />
                {doctorSearch && (
                  <button onClick={() => setDoctorSearch('')} className="absolute left-3 top-2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 font-bold">
                عرض {filteredDoctors.length} من أصل {doctors.length} طبيب ومزود خدمات مسجل
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[12px] border-collapse">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-4 rounded-rt-xl text-right">الطبيب وتخصصه</th>
                      <th className="p-4 text-right">المستشفى التابع له</th>
                      <th className="p-4 text-center">بيانات الاتصال</th>
                      <th className="p-4 text-center">الحالة</th>
                      <th className="p-4 text-center rounded-lt-xl">حكم الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map(doc => {
                      const isEditing = editingDoctorId === doc.id;
                      return (
                        <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/55 transition-colors">
                          {isEditing && editingDoctorForm ? (
                            <>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <input 
                                    type="text" 
                                    className="input-field py-1 text-xs text-right font-bold w-full"
                                    value={editingDoctorForm.name} 
                                    onChange={(e) => setEditingDoctorForm({...editingDoctorForm, name: e.target.value})}
                                  />
                                  <input 
                                    type="text" 
                                    className="input-field py-1 text-xs text-right text-slate-500 w-full"
                                    value={editingDoctorForm.specialty} 
                                    onChange={(e) => setEditingDoctorForm({...editingDoctorForm, specialty: e.target.value})}
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <input 
                                  type="text" 
                                  className="input-field py-1 text-xs text-right w-full"
                                  value={editingDoctorForm.hospital} 
                                  onChange={(e) => setEditingDoctorForm({...editingDoctorForm, hospital: e.target.value})}
                                />
                              </td>
                              <td className="p-3 text-center">
                                <div className="space-y-1">
                                  <input 
                                    type="text" 
                                    className="input-field py-1 text-xs text-center font-mono w-full"
                                    value={editingDoctorForm.phone} 
                                    onChange={(e) => setEditingDoctorForm({...editingDoctorForm, phone: e.target.value})}
                                  />
                                  <input 
                                    type="email" 
                                    className="input-field py-1 text-xs text-center font-mono text-slate-500 w-full"
                                    value={editingDoctorForm.email} 
                                    onChange={(e) => setEditingDoctorForm({...editingDoctorForm, email: e.target.value})}
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <select 
                                  className="input-field py-1 text-xs text-center font-bold w-24"
                                  value={editingDoctorForm.status} 
                                  onChange={(e) => setEditingDoctorForm({...editingDoctorForm, status: e.target.value as 'active' | 'inactive'})}
                                >
                                  <option value="active">نشط</option>
                                  <option value="inactive">غير نشط</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button onClick={handleSaveEditDoctor} className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1">
                                    <Check size={11} />
                                    <span>حفظ</span>
                                  </button>
                                  <button onClick={() => { setEditingDoctorId(null); setEditingDoctorForm(null); }} className="p-1 px-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-bold text-[10px] flex items-center gap-1">
                                    <X size={11} />
                                    <span>إلغاء</span>
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 text-right">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                    {doc.name.replace("د. ", "")[0]}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-800 block text-xs">{doc.name}</span>
                                    <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">{doc.specialty}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center gap-1.5 justify-start text-xs text-slate-600 font-medium">
                                  <Building size={12} className="text-slate-400" />
                                  <span>{doc.hospital}</span>
                                </div>
                              </td>
                              <td className="p-4 text-right sm:text-center">
                                <div className="flex flex-col gap-0.5 max-w-40 mx-auto text-[10px] font-mono font-medium text-slate-500">
                                  <span className="flex items-center gap-1 justify-center"><Phone size={10} /> {doc.phone || 'بلا هاتف'}</span>
                                  <span className="flex items-center gap-1 justify-center text-[9px] text-slate-400"><Mail size={10} /> {doc.email || '-'}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                                  doc.status === 'active' 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                    : "bg-rose-50 text-rose-700 border-rose-100"
                                )}>
                                  {doc.status === 'active' ? 'نشط بالبوابة' : 'غير مفعل'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleStartEditDoctor(doc)} 
                                    className="p-1 px-2.5 bg-slate-50 hover:bg-brand-primary hover:text-white rounded text-slate-500 transition-all flex items-center gap-1 text-[10px] font-bold shadow-sm border border-slate-200"
                                  >
                                    <Edit size={11} />
                                    <span>تعديل</span>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteDoctor(doc.id)} 
                                    className="p-1 px-2.5 bg-slate-50 hover:bg-rose-500 hover:text-white rounded text-slate-500 transition-all flex items-center gap-1 text-[10px] font-bold shadow-sm border border-slate-200"
                                  >
                                    <Trash2 size={11} />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    {filteredDoctors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold bg-slate-50/50">
                          لا توجد تطابقات لعملية البحث الجارية
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users & Roles Switching */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
          {/* Add User Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-sm h-fit">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Plus size={14} className="text-emerald-500" />
              <span>تسجيل مستخدم / موظف جديد بوزارة/هيئة</span>
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="label-caps mb-1 block text-slate-600">اسم الموظف بالكامل <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  className="input-field shadow-sm text-right" 
                  placeholder="مثال: رامي عبد العزيز شحاتة"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="label-caps mb-1 block text-slate-600">البريد الإلكتروني المعتمد <span className="text-rose-500">*</span></label>
                <input 
                  type="email" 
                  className="input-field shadow-sm text-left font-mono" 
                  placeholder="name@unhcr-support.org"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-caps mb-1 block text-slate-600">الدور الوظيفي والصلاحية <span className="text-rose-500">*</span></label>
                  <select 
                    className="input-field text-right font-bold text-slate-700 shadow-sm"
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as UserRole})}
                  >
                    <option value="staff">موظف تسجيل (Staff)</option>
                    <option value="clinical">منسق طبي (Clinical)</option>
                    <option value="financial">مسؤول مالي (Financial)</option>
                    <option value="admin">مدير النظام (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="label-caps mb-1 block text-slate-600">حالة الحساب</label>
                  <select 
                    className="input-field font-bold text-center shadow-sm"
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value as 'active' | 'inactive'})}
                  >
                    <option value="active" className="text-emerald-600">نشط ومفعل</option>
                    <option value="inactive" className="text-rose-600">غير فعال</option>
                  </select>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1.5">
                <span className="text-[10px] text-slate-400 font-extrabold block">📌 إشعار الأمان والدخول:</span>
                <span className="text-[10px] text-slate-500 leading-relaxed block font-medium">
                  سيتم تعيين حساب المستخدم وحفظه محليًا. يمكنك محاكاة تسجيل الدخول بهذا الحساب بالنقر على زر <b>"تبديل الحساب"</b> في الجدول الجانبي.
                </span>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-primary text-white hover:bg-emerald-600 font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow"
              >
                <Plus size={15} />
                <span>إدراج الموظف وتفعيل دوره</span>
              </button>
            </form>
          </div>

          {/* List of Users with Live Account Switching */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-amber-50 rounded-xl border border-dashed border-amber-200 p-4 text-amber-900 text-xs flex items-start gap-3 justify-start">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-right">
                <p className="font-extrabold">💡 وضع المحاكاة التفاعلية لتجربة الصلاحيات:</p>
                <p className="leading-relaxed text-slate-600 font-medium">
                  انقر على زر <span className="text-amber-700 font-bold">"تبديل الجلسة (Switch Account) 🔄"</span> الموجود بجانب أي موظف في الجدول أدناه للدخول فورا بكامل صلاحياته وتفقد الفروقات وتأثير القواعد عبر شاشات التسجيل، والمالية، وإدارة الكاش والتحكم بالحالات!
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-4 py-1.5 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 transition-all font-medium placeholder:text-slate-400 shadow-sm text-right"
                  placeholder="ابحث باسم الموظف، البريد الإلكتروني..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <Search className="absolute right-3 top-2.5 text-slate-400" size={13} />
                {userSearch && (
                  <button onClick={() => setUserSearch('')} className="absolute left-3 top-2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 font-bold">
                عرض {filteredUsers.length} من أصل {users.length} مستخدم نشط
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[12px] border-collapse">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-4 rounded-rt-xl text-right">المستخدم والبريد الكتروني</th>
                      <th className="p-4 text-center">الدور المخصّص</th>
                      <th className="p-4 text-center">الحالة</th>
                      <th className="p-4 text-center">الدخول السريع</th>
                      <th className="p-4 text-center rounded-lt-xl">حكم الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(usr => {
                      const isEditing = editingUserId === usr.id;
                      const isActiveSession = currentUser.id === usr.id;
                      return (
                        <tr key={usr.id} className={cn(
                          "border-b border-slate-100 hover:bg-slate-50/55 transition-colors",
                          isActiveSession ? "bg-emerald-50/30 border-r-4 border-r-emerald-500" : ""
                        )}>
                          {isEditing && editingUserForm ? (
                            <>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <input 
                                    type="text" 
                                    className="input-field py-1 text-xs text-right font-bold w-full"
                                    value={editingUserForm.name} 
                                    onChange={(e) => setEditingUserForm({...editingUserForm, name: e.target.value})}
                                  />
                                  <input 
                                    type="email" 
                                    className="input-field py-1 text-xs text-left font-mono w-full"
                                    value={editingUserForm.email} 
                                    onChange={(e) => setEditingUserForm({...editingUserForm, email: e.target.value})}
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <select 
                                  className="input-field py-1 text-xs text-center font-bold w-32"
                                  value={editingUserForm.role}
                                  onChange={(e) => setEditingUserForm({...editingUserForm, role: e.target.value as UserRole})}
                                >
                                  <option value="staff">موظف (Staff)</option>
                                  <option value="clinical">منسق (Clinical)</option>
                                  <option value="financial">مالي (Financial)</option>
                                  <option value="admin">مدير (Admin)</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <select 
                                  className="input-field py-1 text-xs text-center font-bold w-24"
                                  value={editingUserForm.status} 
                                  onChange={(e) => setEditingUserForm({...editingUserForm, status: e.target.value as 'active' | 'inactive'})}
                                >
                                  <option value="active">نشط</option>
                                  <option value="inactive">معطل</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-slate-400 text-[10px] font-bold">يجب الحفظ أولاً</span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button onClick={handleSaveEditUser} className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1">
                                    <Check size={11} />
                                    <span>حفظ</span>
                                  </button>
                                  <button onClick={() => { setEditingUserId(null); setEditingUserForm(null); }} className="p-1 px-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-bold text-[10px] flex items-center gap-1">
                                    <X size={11} />
                                    <span>إلغاء</span>
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 text-right">
                                <span className="font-extrabold text-slate-850 block text-xs flex items-center gap-1.5">
                                  <span>{usr.name}</span>
                                  {isActiveSession && (
                                    <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 shadow-xs">
                                      <UserCheck size={9} />
                                      <span>الجلسة الحالية</span>
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{usr.email}</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "inline-block rounded px-2.5 py-1 text-[10px] font-extrabold border shadow-xs",
                                  roleLabels[usr.role]?.color
                                )}>
                                  {roleLabels[usr.role]?.title.split(" (")[0]}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                                  usr.status === 'active' 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : "bg-red-50 text-red-700"
                                )}>
                                  {usr.status === 'active' ? 'مفعل' : 'معطل'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {isActiveSession ? (
                                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-bold border border-emerald-200 inline-block">
                                    ✓ مسجّل دخولك به
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSwitchActiveSession(usr)}
                                    disabled={usr.status === 'inactive'}
                                    className="p-1.5 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1 mx-auto"
                                  >
                                    <RefreshCw size={11} className="animate-spin-paused hover:animate-spin" />
                                    <span>تبديل الحساب 🔄</span>
                                  </button>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleStartEditUser(usr)} 
                                    className="p-1 px-2.5 bg-slate-50 hover:bg-brand-primary hover:text-white rounded text-slate-500 transition-all flex items-center gap-1 text-[10px] font-bold shadow-sm border border-slate-200"
                                  >
                                    <Edit size={11} />
                                    <span>تعديل</span>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(usr.id)} 
                                    disabled={isActiveSession}
                                    className="p-1 px-2.5 bg-slate-50 hover:bg-rose-500 hover:text-white disabled:opacity-20 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 rounded text-slate-500 transition-all flex items-center gap-1 text-[10px] font-bold shadow-sm border border-slate-200"
                                  >
                                    <Trash2 size={11} />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Role & Custom Permissions Matrix (Active Enforcement explanation) */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 text-right">
          <div className="bg-gradient-to-tr from-slate-900 to-slate-950 text-white p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                <Shield size={18} />
                <span>نظام الحماية والتحكم في الإمكانات (RBAC)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                بوابة UNHCR دعم اللاجئين مطوّرة بنظام التحكم بالصلاحيات بناءً على دور المستخدم. يتم تطبيق المراقبة والمنع بأسلوب صارم على مستوى المكونات التشغيلية لحماية البيانات المالية الحساسة والملفات الطبية والتقارير من التغييرات غير المعتمدة.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg self-stretch flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-extrabold block mb-1">حالة الحظر التلقائي</span>
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Check size={14} className="bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full" />
                <span>مفعّل ونشط على خادم العميل</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(roleLabels).map(([key, data]) => (
              <div key={key} className="bg-white p-5 rounded-xl border border-slate-150 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className={cn(
                    "inline-block rounded px-2.5 py-0.5 text-[9px] font-black border",
                    data.color
                  )}>
                    {data.title}
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                    {data.desc}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 text-[9px] text-slate-400 rounded-md flex justify-between">
                  <span>المستوى التقني الموصى به</span>
                  <span className="font-extrabold text-slate-600">
                    {key === 'admin' ? 'كامل الصلاحيات (10/10)' : key === 'clinical' ? 'طبي عالي (7/10)' : key === 'financial' ? 'مالي مخصص (8/10)' : 'إداري وقائي (4/10)'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Graphical Permissions Table */}
          <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-right text-[12px] border-collapse">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-4 text-right rounded-rt-xl">الوظيفة والاجراء التشغيلي داخل البوابة</th>
                  <th className="p-4 text-center bg-indigo-950 text-indigo-200">مدير النظام (Admin)</th>
                  <th className="p-4 text-center bg-emerald-950 text-emerald-250">منسق طبي (Clinical)</th>
                  <th className="p-4 text-center bg-amber-950 text-amber-250">مسؤول مالي (Financial)</th>
                  <th className="p-4 text-center bg-slate-800 text-slate-300 rounded-lt-xl">موظف عادي (Staff)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {[
                  { action: 'تسجيل وإضافة حالة لاجئ جديدة بالكامل', roles: ['admin', 'clinical', 'financial', 'staff'], info: 'متاح للجميع لإتاحة التسجيل الأولي السريع للمرضى.' },
                  { action: 'حذف ملف الحالة تماماً من الأرشيف', roles: ['admin'], info: 'صلاحية سيادية حصرية لمدير النظام لمنع فقدان البيانات التعسفي.' },
                  { action: 'تحديث تشخيص الحالة المرضية وتدبير خطة التدخل الطبي', roles: ['admin', 'clinical'], info: 'الأطباء والمنسقين فقط يحق لهم تحديد المشاكل الصحية والسريرية.' },
                  { action: 'إضافة وجدولة مواعد الخدمات الطبية المرافقة لمريض', roles: ['admin', 'clinical'], info: 'فقط المنسق الطبي والمدير لإدارة الطاقة التشغيلية وحجوزات الأسرة.' },
                  { action: 'إصدار/تحديث طلبات المطالبات المالية والتحويلات للشركاء', roles: ['admin', 'financial'], info: 'صلاحية مالية تمنع التدخل الخاطئ من الكوادر الطبية البحتة.' },
                  { action: 'تصفية أو تسوية المعاملات وصرف النقد المالي (كاش)', roles: ['admin', 'financial'], info: 'المسؤول المالي فقط بمحاسبة الخزينة وصندوق النقد المباشر.' },
                  { action: 'تعديل بنود تسعير الفاتورة التفصيلية وتحديد نسب خصومات بنود الخدمة', roles: ['admin', 'financial'], info: 'مسؤول الحسابات لإدارة الميزانيات ونسب المساهمات وحوكمة الخصومات.' },
                  { action: 'تعديل الإعدادات وإضافة أطباء ومستخدمين جدد للنظام', roles: ['admin'], info: 'يتطلب ترخيص إداري كامل لتعديل هيكل الكوادر والصلاحيات.' }
                ].map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-right">
                      <div className="space-y-1">
                        <span className="font-bold text-xs text-slate-800 block">{item.action}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{item.info}</span>
                      </div>
                    </td>
                    {['admin', 'clinical', 'financial', 'staff'].map(role => {
                      const hasAccess = item.roles.includes(role);
                      return (
                        <td key={role} className="p-4 text-center">
                          <div className="flex justify-center">
                            {hasAccess ? (
                              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-inner">
                                ✓
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-350 flex items-center justify-center font-bold text-[10px] border border-rose-100">
                                ✕
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
