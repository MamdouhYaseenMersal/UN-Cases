export type CaseType = 'emergency' | 'scheduled';
export type CaseStatus = 'Pending' | 'Delivered' | 'Cancelled';
export type Gender = 'Male' | 'Female' | 'Other';
export type Priority = 'Low' | 'Medium' | 'High';
export type MedicalApprovalStatus = 'Approved' | 'Pending' | 'Rejected';
export type PaymentType = 'Cash' | 'Claim';
export type ClaimStatus = 'Registered' | 'Under Review' | 'Financial Review' | 'Processed' | 'Paid' | 'Pending Approval' | 'Cancelled';

export interface FollowUp {
  id: string;
  date: string;
  comment: string;
  user: string;
}

export interface ScheduledService {
  id: string;
  serviceName: string;
  plannedDate: string;
  actualDate?: string;
  status: 'Planned' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface MedicalClaim {
  id: string;
  date: string;
  serviceName: string;
  provider: string;
  totalAmount: number;
  discountPercentage: number;
  netAmount: number;
  status: ClaimStatus;
  includedServices: string[];
  reminderDate?: string;
  history?: HistoryEntry[];
  followUps?: FollowUp[];
  lineItems?: {
    id: string;
    name: string;
    cost: number;
    discount: number;
  }[];
}

export interface CashPayment {
  id: string;
  date: string;
  serviceName: string;
  provider: string;
  totalAmount: number;
  discountPercentage: number;
  netAmount: number;
  status: ClaimStatus;
  includedServices: string[];
  reminderDate?: string;
  history?: HistoryEntry[];
  followUps?: FollowUp[];
  lineItems?: {
    id: string;
    name: string;
    cost: number;
    discount: number;
  }[];
}

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
  category: 'Medical' | 'Social';
}

export type UserRole = 'admin' | 'clinical' | 'financial' | 'staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status?: 'active' | 'inactive';
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
  contactRelationship?: string;
  contactNumber?: string;
  contactMethod: string;
  assignedTo: string;
  priority: Priority;
  bookingEntity?: string;
  medicalApprovalStatus?: MedicalApprovalStatus;
  paymentType?: PaymentType;
  medicalClaims?: MedicalClaim[];
  cashPayments?: CashPayment[];
  dischargeDate?: string;
  followUps?: FollowUp[];
  serviceSchedule?: ScheduledService[];
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
  costInProgress: number;
  costPaid: number;
  costPendingPayment: number;
};
