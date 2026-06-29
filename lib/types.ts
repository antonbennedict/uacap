// ============================================================
// PhilHealth EMR Portal — Core TypeScript Types
// ============================================================

export type MembershipType = 'Employed' | 'Self-Employed' | 'Voluntary' | 'Lifetime' | 'Sponsored';
export type MembershipStatus = 'Active' | 'Lapsed' | 'Suspended';
export type Sex = 'Male' | 'Female';
export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Separated';
export type DosageForm = 'Tablet' | 'Capsule' | 'Syrup' | 'Suspension' | 'Injection' | 'Cream' | 'Ointment' | 'Drops' | 'Inhaler' | 'Patch' | 'Suppository';
export type StockStatus = 'Adequate' | 'Low' | 'Out of Stock';
export type PrescriptionStatus = 'Draft' | 'Finalized' | 'Cancelled';
export type TriageStatus = 'Waiting' | 'In-Consult' | 'Done' | 'Referred';
export type TriagePriority = 'Urgent' | 'Normal' | 'Low';
export type LabTestType = 'CBC' | 'Urinalysis' | 'Chest X-Ray' | 'Blood Chemistry' | 'Lipid Profile' | 'Cancer Screening';
export type AuditActionType = 'RESTOCK' | 'PRESCRIPTION_FINALIZED' | 'STOCK_DEDUCTED' | 'LOGIN' | 'ELIGIBILITY_CHECK' | 'FPE_ENCODED' | 'PHIC_DISPATCHED' | 'TRANSMITTAL_DISPATCHED' | 'SOAP_FINALIZED' | 'LAB_RESULTED' | 'MASTERLIST_IMPORTED' | 'TRIAGE_UPDATED';

// ============================================================
// Triage
// ============================================================
export interface TriageEntry {
  id: string;
  memberPin: string;
  memberName: string;
  arrivalTime: string;
  chiefComplaint: string;
  status: TriageStatus;
  priority: TriagePriority;
  assignedPhysician: string;
  clinicId: string;
}

// ============================================================
// SOAP Notes (YAKAP Consultation)
// ============================================================
export interface SOAPObjective {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSat: number;
  weight: number;
  height: number;
}

export interface SOAPNote {
  id: string;
  memberPin: string;
  memberName: string;
  clinicId: string;
  visitDate: string;
  subjective: string;
  objective: SOAPObjective;
  assessment: string;
  icd10Code: string;
  icd10Description: string;
  plan: string;
  prescriptionIds: string[];
  physicianName: string;
  status: 'Draft' | 'Finalized';
  createdAt: string;
}

// ============================================================
// Lab Results
// ============================================================
export interface LabResult {
  id: string;
  memberPin: string;
  memberName: string;
  clinicId: string;
  testType: LabTestType;
  requestedDate: string;
  resultDate: string | null;
  findings: Record<string, string | number>;
  narrative: string;
  status: 'Pending' | 'Resulted' | 'Verified';
  encodedBy: string;
}

// ============================================================
// Masterlist Import
// ============================================================
export type MasterlistMemberType = 'Student' | 'Staff' | 'Faculty';

export interface MasterlistEntry {
  id: string;
  philhealthPin: string;
  lastName: string;
  firstName: string;
  middleName: string;
  dateOfBirth: string;
  sex: Sex;
  email: string;
  department: string;
  studentNumber?: string;
  employeeId?: string;
  type: MasterlistMemberType;
  importedAt: string | null;
}


// ============================================================
// Transmittals
// ============================================================
export interface TransmittalRecord {
  id: string;
  clinicId: string;
  startDate: string;
  endDate: string;
  fpeCount: number;
  prescriptionCount: number;
  soapCount: number;
  labCount: number;
  dispatchedAt: string;
  actor: string;
  status: 'Dispatched';
}

// ============================================================
// FPE (First Patient Encounter)
// ============================================================
export interface FPEVitalSigns {
  heightCm: number;
  weightKg: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  fastingBloodSugar?: number;
}

export interface FPELifestyle {
  smokingStatus: 'Never' | 'Former' | 'Current';
  alcoholConsumption: 'Never' | 'Occasional' | 'Regular';
}

export interface FPERecord {
  id: string;
  memberPin: string;
  clinicId: string;
  encounterDate: string;
  vitalSigns: FPEVitalSigns;
  lifestyle: FPELifestyle;
  medicalHistory: string;
  status: 'Draft' | 'Encoded' | 'Dispatched';
  dispatchedAt: string | null;
}

// ============================================================
// Clinic
// ============================================================
export interface Clinic {
  id: string;
  name: string;
  shortName: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  operatingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  philhealthAccredited: boolean;
  phicCode: string;
}

// ============================================================
// Member / Patient
// ============================================================
export interface Dependent {
  id: string;
  fullName: string;
  relationship: 'Spouse' | 'Child' | 'Parent';
  dateOfBirth: string;
  sex: Sex;
}

export interface YakapBenefit {
  year: number;
  totalAllotment: number;
  usedAmount: number;
  availments: number;
  lastAvailmentDate: string | null;
}

export interface Member {
  id: string;
  philhealthPin: string;
  lastName: string;
  firstName: string;
  middleName: string;
  suffix?: string;
  dateOfBirth: string;
  sex: Sex;
  civilStatus: CivilStatus;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
  email?: string;
  membershipType: MembershipType;
  membershipStatus: MembershipStatus;
  employer?: string;
  registeredClinicId: string;
  dependents: Dependent[];
  yakapBenefit: YakapBenefit;
  photoUrl?: string;
}

// ============================================================
// Medicine / GAMOT Formulary
// ============================================================
export interface Medicine {
  id: string;
  formularyCode: string;
  genericName: string;
  brandName: string;
  dosageForm: DosageForm;
  strength: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStock: number;
  therapeuticCategory: string;
  manufacturer?: string;
  unitPrice: number;
}

export function getMedicineStatus(stock: number): StockStatus {
  if (stock === 0) return 'Out of Stock';
  if (stock <= 10) return 'Low';
  return 'Adequate';
}

// ============================================================
// Prescription
// ============================================================
export interface PrescriptionItem {
  medicineId: string;
  genericName: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  quantity: number;
  dosageInstructions: string;
  unitPrice: number;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  memberPin: string;
  memberName: string;
  clinicId: string;
  clinicName: string;
  physicianName: string;
  physicianLicense: string;
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  createdAt: string;
  finalizedAt: string | null;
  diagnosis?: string;
  notes?: string;
  totalAmount: number;
}

// ============================================================
// Audit Log
// ============================================================
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  actor: string;
  actorRole: string;
  description: string;
  metadata: Record<string, string | number | boolean>;
}
