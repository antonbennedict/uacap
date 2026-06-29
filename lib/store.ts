import { create } from 'zustand';
import type {
  Medicine, Prescription, AuditLogEntry, FPERecord, TransmittalRecord,
  TriageEntry, SOAPNote, LabResult, MasterlistEntry, Member
} from './types';
import membersData from './data/members.json';
import medicinesData from './data/medicines.json';
import prescriptionsData from './data/prescriptions.json';
import auditLogData from './data/audit-log.json';
import fpeData from './data/fpe.json';
import triageData from './data/triage.json';
import soapData from './data/soap-notes.json';
import labData from './data/lab-results.json';
import masterlistData from './data/masterlist.json';

interface AppState {
  // ─── Medicine Inventory ───────────────────────────────────
  medicines: Medicine[];
  lastUpdated: string | null;

  // ─── Prescriptions ────────────────────────────────────────
  prescriptions: Prescription[];

  // ─── Audit Log ────────────────────────────────────────────
  auditLog: AuditLogEntry[];

  // ─── FPE ──────────────────────────────────────────────────
  fpeRecords: FPERecord[];

  // ─── Transmittals ─────────────────────────────────────────
  transmittals: TransmittalRecord[];

  // ─── Triage ───────────────────────────────────────────────
  triageEntries: TriageEntry[];

  // ─── SOAP Notes ───────────────────────────────────────────
  soapNotes: SOAPNote[];

  // ─── Lab Results ──────────────────────────────────────────
  labResults: LabResult[];

  // ─── Masterlist ───────────────────────────────────────────
  masterlistEntries: MasterlistEntry[];

  // ─── Members ──────────────────────────────────────────────
  members: Member[];

  // ─── Actions ──────────────────────────────────────────────
  deductStock: (medicineId: string, quantity: number, prescriptionNumber: string) => void;
  restockMedicine: (medicineId: string, quantity: number, actor?: string) => void;
  addPrescription: (prescription: Prescription) => void;
  addAuditEntry: (entry: Omit<AuditLogEntry, 'id'>) => void;
  setMedicines: (medicines: Medicine[]) => void;
  getStockById: (medicineId: string) => number;

  // FPE Actions
  saveFPERecord: (record: FPERecord) => void;
  dispatchFPEToPHIC: (recordId: string, actor: string) => void;

  // Transmittal Actions
  dispatchTransmittal: (record: TransmittalRecord) => void;

  // Triage Actions
  addTriageEntry: (entry: TriageEntry) => void;
  updateTriageStatus: (id: string, status: TriageEntry['status'], physician?: string) => void;

  // SOAP Actions
  saveSOAPNote: (note: SOAPNote) => void;
  finalizeSOAPNote: (id: string) => void;

  // Lab Actions
  saveLabResult: (result: LabResult) => void;
  verifyLabResult: (id: string) => void;

  // Masterlist Actions
  importMasterlistEntries: (ids: string[], actor: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  fpeRecords: fpeData as FPERecord[],
  transmittals: [],
  medicines: medicinesData as Medicine[],
  prescriptions: prescriptionsData as Prescription[],
  auditLog: (auditLogData as unknown as AuditLogEntry[]).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ),
  lastUpdated: null,
  triageEntries: triageData as TriageEntry[],
  soapNotes: soapData as SOAPNote[],
  labResults: labData as LabResult[],
  masterlistEntries: masterlistData as MasterlistEntry[],
  members: membersData as Member[],

  setMedicines: (medicines) => set({ medicines }),

  getStockById: (medicineId: string) => {
    const med = get().medicines.find((m) => m.id === medicineId);
    return med?.currentStock ?? 0;
  },

  deductStock: (medicineId, quantity, prescriptionNumber) => {
    set((state) => {
      const medicines = state.medicines.map((m) => {
        if (m.id === medicineId) {
          return { ...m, currentStock: Math.max(0, m.currentStock - quantity) };
        }
        return m;
      });
      const medicine = state.medicines.find((m) => m.id === medicineId);
      const prevStock = medicine?.currentStock ?? 0;
      const newStock = Math.max(0, prevStock - quantity);

      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-${medicineId}`,
        timestamp: new Date().toISOString(),
        actionType: 'STOCK_DEDUCTED',
        actor: 'System',
        actorRole: 'System',
        description: `Stock deducted: ${medicine?.genericName ?? medicineId} ${medicine?.strength} (-${quantity} units) for ${prescriptionNumber}`,
        metadata: {
          medicineId, genericName: medicine?.genericName ?? '',
          quantityDeducted: quantity, previousStock: prevStock, newStock, prescriptionNumber,
        },
      };

      return { medicines, auditLog: [auditEntry, ...state.auditLog], lastUpdated: new Date().toISOString() };
    });
  },

  restockMedicine: (medicineId, quantity, actor = 'Admin') => {
    set((state) => {
      const medicine = state.medicines.find((m) => m.id === medicineId);
      const prevStock = medicine?.currentStock ?? 0;
      const newStock = prevStock + quantity;
      const medicines = state.medicines.map((m) =>
        m.id === medicineId ? { ...m, currentStock: newStock } : m
      );
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-restock-${medicineId}`,
        timestamp: new Date().toISOString(),
        actionType: 'RESTOCK',
        actor, actorRole: 'Pharmacist',
        description: `Restocked ${medicine?.genericName ?? medicineId} ${medicine?.strength} ${medicine?.dosageForm}`,
        metadata: {
          medicineId, genericName: medicine?.genericName ?? '', brandName: medicine?.brandName ?? '',
          quantityAdded: quantity, previousStock: prevStock, newStock,
        },
      };
      return { medicines, auditLog: [auditEntry, ...state.auditLog], lastUpdated: new Date().toISOString() };
    });
  },

  addPrescription: (prescription) => {
    set((state) => ({ prescriptions: [prescription, ...state.prescriptions] }));
  },

  addAuditEntry: (entry) => {
    const newEntry: AuditLogEntry = { ...entry, id: `audit-${Date.now()}-manual` };
    set((state) => ({ auditLog: [newEntry, ...state.auditLog] }));
  },

  saveFPERecord: (record) => {
    set((state) => {
      const exists = state.fpeRecords.some((r) => r.id === record.id);
      const newRecords = exists
        ? state.fpeRecords.map((r) => (r.id === record.id ? record : r))
        : [record, ...state.fpeRecords];
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-fpe-save`,
        timestamp: new Date().toISOString(),
        actionType: 'FPE_ENCODED', actor: 'Clinical Staff', actorRole: 'Encoder',
        description: `FPE record ${exists ? 'updated' : 'created'} for PIN ${record.memberPin}`,
        metadata: { memberPin: record.memberPin, fpeId: record.id }
      };
      return { fpeRecords: newRecords, auditLog: [auditEntry, ...state.auditLog] };
    });
  },

  dispatchFPEToPHIC: (recordId, actor) => {
    set((state) => {
      const record = state.fpeRecords.find((r) => r.id === recordId);
      if (!record) return state;
      const updatedRecord = { ...record, status: 'Dispatched' as const, dispatchedAt: new Date().toISOString() };
      const newRecords = state.fpeRecords.map((r) => (r.id === recordId ? updatedRecord : r));
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-fpe-dispatch`,
        timestamp: new Date().toISOString(),
        actionType: 'PHIC_DISPATCHED', actor, actorRole: 'Authorized Dispatcher',
        description: `Direct PHIC Dispatch for FPE ${recordId} (PIN: ${record.memberPin})`,
        metadata: { memberPin: record.memberPin, fpeId: record.id }
      };
      return { fpeRecords: newRecords, auditLog: [auditEntry, ...state.auditLog] };
    });
  },

  dispatchTransmittal: (record) => {
    set((state) => {
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-transmittal`,
        timestamp: new Date().toISOString(),
        actionType: 'TRANSMITTAL_DISPATCHED', actor: record.actor, actorRole: 'Administrative Staff',
        description: `Transmittal Dispatched: ${record.fpeCount} FPEs, ${record.prescriptionCount} Prescriptions`,
        metadata: {
          transmittalId: record.id, fpeCount: record.fpeCount,
          prescriptionCount: record.prescriptionCount, startDate: record.startDate, endDate: record.endDate,
        }
      };
      return { transmittals: [record, ...state.transmittals], auditLog: [auditEntry, ...state.auditLog] };
    });
  },

  addTriageEntry: (entry) => {
    set((state) => ({ triageEntries: [entry, ...state.triageEntries] }));
  },

  updateTriageStatus: (id, status, physician) => {
    set((state) => {
      const triageEntries = state.triageEntries.map((t) =>
        t.id === id ? { ...t, status, assignedPhysician: physician ?? t.assignedPhysician } : t
      );
      const entry = state.triageEntries.find((t) => t.id === id);
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-triage`,
        timestamp: new Date().toISOString(),
        actionType: 'TRIAGE_UPDATED', actor: physician ?? 'Staff', actorRole: 'Triage Officer',
        description: `Triage status updated: ${entry?.memberName} → ${status}`,
        metadata: { triageId: id, newStatus: status, memberPin: entry?.memberPin ?? '' }
      };
      return { triageEntries, auditLog: [auditEntry, ...state.auditLog] };
    });
  },

  saveSOAPNote: (note) => {
    set((state) => {
      const exists = state.soapNotes.some((n) => n.id === note.id);
      const newNotes = exists
        ? state.soapNotes.map((n) => (n.id === note.id ? note : n))
        : [note, ...state.soapNotes];
      return { soapNotes: newNotes };
    });
  },

  finalizeSOAPNote: (id) => {
    set((state) => {
      const note = state.soapNotes.find((n) => n.id === id);
      const newNotes = state.soapNotes.map((n) =>
        n.id === id ? { ...n, status: 'Finalized' as const } : n
      );
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-soap`,
        timestamp: new Date().toISOString(),
        actionType: 'SOAP_FINALIZED', actor: note?.physicianName ?? 'Physician', actorRole: 'Physician',
        description: `SOAP Note finalized for ${note?.memberName ?? note?.memberPin} — ${note?.icd10Code}: ${note?.assessment ?? ''}`,
        metadata: { soapId: id, memberPin: note?.memberPin ?? '', icd10Code: note?.icd10Code ?? '' }
      };
      return { soapNotes: newNotes, auditLog: [auditEntry, ...state.auditLog] };
    });
  },

  saveLabResult: (result) => {
    set((state) => {
      const exists = state.labResults.some((r) => r.id === result.id);
      const newResults = exists
        ? state.labResults.map((r) => (r.id === result.id ? result : r))
        : [result, ...state.labResults];
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-lab`,
        timestamp: new Date().toISOString(),
        actionType: 'LAB_RESULTED', actor: result.encodedBy, actorRole: 'Lab Officer',
        description: `Lab result ${exists ? 'updated' : 'created'}: ${result.testType} for ${result.memberName}`,
        metadata: { labId: result.id, testType: result.testType, memberPin: result.memberPin }
      };
      return { labResults: newResults, auditLog: [auditEntry, ...state.auditLog] };
    });
  },

  verifyLabResult: (id) => {
    set((state) => {
      const newResults = state.labResults.map((r) =>
        r.id === id ? { ...r, status: 'Verified' as const } : r
      );
      return { labResults: newResults };
    });
  },

  importMasterlistEntries: (ids, actor) => {
    set((state) => {
      const now = new Date().toISOString();
      const importedMembers: Member[] = [];
      const newEntries = state.masterlistEntries.map((e) => {
        if (ids.includes(e.id)) {
          importedMembers.push({
            id: `member-ml-${e.id}`,
            philhealthPin: e.philhealthPin,
            lastName: e.lastName,
            firstName: e.firstName,
            middleName: e.middleName,
            dateOfBirth: e.dateOfBirth,
            sex: e.sex,
            civilStatus: 'Single',
            address: 'University Campus',
            city: 'Quezon City',
            province: 'NCR',
            zipCode: '1101',
            phone: 'N/A',
            email: e.email,
            membershipType: e.type === 'Student' ? 'Sponsored' : 'Employed',
            membershipStatus: 'Active',
            registeredClinicId: 'clinic-001',
            dependents: [],
            yakapBenefit: { year: 2026, totalAllotment: 5000, usedAmount: 0, availments: 0, lastAvailmentDate: null }
          });
          return { ...e, importedAt: now };
        }
        return e;
      });
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-masterlist`,
        timestamp: new Date().toISOString(),
        actionType: 'MASTERLIST_IMPORTED', actor, actorRole: 'Administrator',
        description: `Masterlist import: ${ids.length} member profiles committed to local registry`,
        metadata: { count: ids.length }
      };
      return { 
        masterlistEntries: newEntries,
        members: [...importedMembers, ...state.members],
        auditLog: [auditEntry, ...state.auditLog] 
      };
    });
  },
}));
