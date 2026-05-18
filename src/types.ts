export type CaseType = 'emergency' | 'scheduled';
export type CaseStatus = 'Pending' | 'Delivered' | 'Cancelled';
export type Gender = 'Male' | 'Female' | 'Other';
export type Priority = 'Low' | 'Medium' | 'High';
export type MedicalApprovalStatus = 'Approved' | 'Pending' | 'Rejected';

export interface HistoryEntry {
  date: string;
  action: string;
  details: string;
  user: string;
}

export interface ServiceRecord {
  id: string;
  unhcrId: string;
  type: string;
  date: string;
  provider: string;
  notes?: string;
}

export interface CostBreakdown {
  medication: number;
  consultation: number;
  procedure: number;
  other: number;
}

export interface Attachment {
  name: string;
  url: string;
  date: string;
}

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface RefugeeCase {
  id: string;
  fullName: string;
  type: CaseType;
  nationality: string;
  gender: Gender;
  age: number;
  unhcrId: string; // رقم المفوضية
  individualId: string;
  submissionId: string;
  legalStatus: string;
  mobileNumber: string;
  email: string;
  currentLocation: string;
  admissionDate: string;
  diagnosis: string;
  treatmentPlan: string;
  medicationHistory: string;
  intervention: string;
  service: string;
  hospital: string;
  improved: boolean;
  estimatedCost: number;
  realCost: number;
  status: CaseStatus;
  hotlineName: string;
  localPoint: string;
  contactPerson: string;
  contactMethod: string;
  assignedTo: string;
  priority: Priority;
  bookingEntity?: string;
  medicalApprovalStatus?: MedicalApprovalStatus;
  createdAt: string;
  history: HistoryEntry[];
  services: ServiceRecord[];
  costBreakdown: CostBreakdown;
  attachments: Attachment[];
}

export type CaseStats = {
  total: number;
  emergency: number;
  scheduled: number;
  totalEstimatedCost: number;
  totalRealCost: number;
};
