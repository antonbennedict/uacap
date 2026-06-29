'use client';

import { useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useAppStore } from '@/lib/store';
import PrescriptionSlip from '@/components/PrescriptionSlip';
import { getMedicineStatus, type Member, type Clinic, type Medicine, type PrescriptionItem, type Prescription } from '@/lib/types';
import membersData from '@/lib/data/members.json';
import clinicsData from '@/lib/data/clinics.json';
import { generateRxNumber } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import {
  FileText, Plus, Trash2, Search, Printer, CheckCircle,
  AlertTriangle, XCircle, ChevronDown, Loader2, User, X
} from 'lucide-react';
import { toast } from 'sonner';

const allMembers: Member[] = membersData as Member[];
const allClinics: Clinic[] = clinicsData as Clinic[];

interface RxItem {
  medicine: Medicine;
  quantity: number;
  dosageInstructions: string;
}

const PHYSICIANS = [
  { name: 'Dr. Rosa Lim, MD', license: 'PRC-MD-2018-045678' },
  { name: 'Dr. Pedro Ocampo, MD, FPCP', license: 'PRC-MD-2010-023456' },
  { name: 'Dr. Emmanuel Buenaventura, MD', license: 'PRC-MD-2015-067890' },
  { name: 'Dr. Maribel Santos-Garcia, MD', license: 'PRC-MD-2012-034567' },
];

export default function PrescriptionBuilderPage() {
  const { medicines, deductStock, addPrescription, addAuditEntry } = useAppStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [medDropdownOpen, setMedDropdownOpen] = useState(false);
  const [physicianIdx, setPhysicianIdx] = useState(0);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizedPrescription, setFinalizedPrescription] = useState<Prescription | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const selectedClinic = selectedMember
    ? allClinics.find((c) => c.id === selectedMember.registeredClinicId)
    : null;

  const filteredMembers = allMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.philhealthPin.toLowerCase().includes(q)
    );
  });

  const filteredMeds = medicines.filter((m) => {
    const q = medSearch.toLowerCase();
    return (
      m.genericName.toLowerCase().includes(q) ||
      m.brandName.toLowerCase().includes(q) ||
      m.formularyCode.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  const addMedicine = (med: Medicine) => {
    if (rxItems.some((i) => i.medicine.id === med.id)) {
      toast.warning(`${med.genericName} is already in the prescription.`);
      return;
    }
    if (med.currentStock === 0) {
      toast.error(`${med.genericName} is out of stock and cannot be prescribed.`);
      return;
    }
    setRxItems((prev) => [
      ...prev,
      { medicine: med, quantity: 1, dosageInstructions: '' },
    ]);
    setMedSearch('');
    setMedDropdownOpen(false);
    toast.success(`Added ${med.genericName} to prescription.`);
  };

  const updateItem = (idx: number, field: 'quantity' | 'dosageInstructions', value: string | number) => {
    setRxItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (idx: number) => {
    setRxItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalAmount = rxItems.reduce(
    (sum, item) => sum + item.medicine.unitPrice * item.quantity,
    0
  );

  const handleFinalize = useCallback(() => {
    if (!selectedMember) {
      toast.error('Please select a patient first.');
      return;
    }
    if (rxItems.length === 0) {
      toast.error('Please add at least one medicine to the prescription.');
      return;
    }
    if (rxItems.some((item) => !item.dosageInstructions.trim())) {
      toast.error('Please fill in dosage instructions for all medicines.');
      return;
    }

    // Check stock validity
    for (const item of rxItems) {
      const liveStock = medicines.find((m) => m.id === item.medicine.id)?.currentStock ?? 0;
      if (liveStock === 0) {
        toast.error(`${item.medicine.genericName} is out of stock. Remove it before finalizing.`);
        return;
      }
      if (item.quantity > liveStock) {
        toast.error(
          `Insufficient stock for ${item.medicine.genericName}. Available: ${liveStock} ${item.medicine.unitOfMeasure}.`
        );
        return;
      }
    }

    const physician = PHYSICIANS[physicianIdx];
    const clinic = selectedClinic ?? allClinics[0];
    const rxNumber = generateRxNumber(clinic.shortName);

    const prescriptionItems: PrescriptionItem[] = rxItems.map((item) => ({
      medicineId: item.medicine.id,
      genericName: item.medicine.genericName,
      brandName: item.medicine.brandName,
      dosageForm: item.medicine.dosageForm,
      strength: item.medicine.strength,
      quantity: item.quantity,
      dosageInstructions: item.dosageInstructions,
      unitPrice: item.medicine.unitPrice,
    }));

    const prescription: Prescription = {
      id: `rx-${Date.now()}`,
      prescriptionNumber: rxNumber,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.middleName} ${selectedMember.lastName}`,
      clinicId: clinic.id,
      clinicName: clinic.name,
      physicianName: physician.name,
      physicianLicense: physician.license,
      items: prescriptionItems,
      status: 'Finalized',
      createdAt: new Date().toISOString(),
      finalizedAt: new Date().toISOString(),
      diagnosis: diagnosis.trim() || undefined,
      notes: notes.trim() || undefined,
      totalAmount,
    };

    // Deduct stock for each item
    const lowStockWarnings: string[] = [];
    for (const item of rxItems) {
      deductStock(item.medicine.id, item.quantity, rxNumber);
      const newStock = (medicines.find((m) => m.id === item.medicine.id)?.currentStock ?? 0) - item.quantity;
      if (newStock <= 10 && newStock > 0) {
        lowStockWarnings.push(`${item.medicine.genericName} (${newStock} left)`);
      }
    }

    addPrescription(prescription);
    addAuditEntry({
      timestamp: new Date().toISOString(),
      actionType: 'PRESCRIPTION_FINALIZED',
      actor: physician.name,
      actorRole: 'Physician',
      description: `Prescription ${rxNumber} finalized for ${prescription.memberName}`,
      metadata: {
        prescriptionNumber: rxNumber,
        memberPin: selectedMember.philhealthPin,
        memberName: prescription.memberName,
        itemCount: rxItems.length,
        totalAmount,
      },
    });

    setFinalizedPrescription(prescription);
    setIsFinalized(true);

    // Show warnings for low stock
    if (lowStockWarnings.length > 0) {
      toast.warning(`⚠️ Low stock alert: ${lowStockWarnings.join(', ')} — please restock soon.`);
    }
    toast.success(`Prescription ${rxNumber} finalized successfully!`);
  }, [selectedMember, rxItems, medicines, physicianIdx, selectedClinic, diagnosis, notes, totalAmount, deductStock, addPrescription, addAuditEntry]);

  const handlePrint = useReactToPrint({
    content: () => slipRef.current,
    documentTitle: finalizedPrescription?.prescriptionNumber ?? 'Prescription',
    onAfterPrint: () => setIsPrinting(false),
  });

  const handleReset = () => {
    setSelectedMember(null);
    setRxItems([]);
    setDiagnosis('');
    setNotes('');
    setIsFinalized(false);
    setFinalizedPrescription(null);
    setMemberSearch('');
  };

  const stockBadge = (stock: number) => {
    const status = getMedicineStatus(stock);
    if (status === 'Out of Stock') return <span className="badge badge-red">Out of Stock</span>;
    if (status === 'Low') return <span className="badge badge-yellow">Low ({stock})</span>;
    return <span className="badge badge-green">In Stock ({stock})</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center shadow-md" style={{ backgroundColor: '#0A1628' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prescription Builder</h1>
            <p className="text-sm text-gray-500">GAMOT Formulary · YAKAP Program</p>
          </div>
        </div>
        {isFinalized && (
          <div className="flex gap-2">
            <button
              onClick={() => { setIsPrinting(true); handlePrint(); }}
              className="btn-primary"
              id="print-prescription-btn"
            >
              <Printer className="w-4 h-4" />
              Print Prescription
            </button>
            <button onClick={handleReset} className="btn-secondary">
              <Plus className="w-4 h-4" />
              New Prescription
            </button>
          </div>
        )}
      </div>

      {/* Finalized view */}
      {isFinalized && finalizedPrescription && selectedMember && selectedClinic ? (
        <div className="space-y-4">
          <div className="card-glass p-4 flex items-center gap-3 border-l-4 border-philgreen bg-emerald-50/50">
            <CheckCircle className="w-6 h-6 text-philgreen flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Prescription Finalized</p>
              <p className="text-sm text-gray-500">
                {finalizedPrescription.prescriptionNumber} · Stock has been automatically deducted from GAMOT inventory.
              </p>
            </div>
          </div>
          <div className="overflow-auto rounded-2xl border border-gray-200 shadow-lg bg-white">
            <PrescriptionSlip
              ref={slipRef}
              prescription={finalizedPrescription}
              clinic={selectedClinic}
              member={selectedMember}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left panel — Patient & Rx items */}
          <div className="xl:col-span-2 space-y-5">
            {/* Patient selector */}
            <div className="card-glass p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Step 1 — Select Patient
              </h2>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="member-search"
                    type="text"
                    value={memberSearch}
                    onChange={(e) => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
                    onFocus={() => setMemberDropdownOpen(true)}
                    placeholder="Search patient by name or PIN..."
                    className="form-input pl-10 pr-8"
                  />
                  {selectedMember && (
                    <button
                      onClick={() => { setSelectedMember(null); setMemberSearch(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {memberDropdownOpen && memberSearch && (
                  <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                    {filteredMembers.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">No members found.</p>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMember(m);
                            setMemberSearch(`${m.firstName} ${m.lastName}`);
                            setMemberDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 text-left border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {m.firstName} {m.middleName} {m.lastName}
                            </p>
                            <p className="text-xs font-mono text-gray-400">{m.philhealthPin}</p>
                          </div>
                          <span
                            className={`badge ${m.membershipStatus === 'Active' ? 'badge-green' : 'badge-yellow'}`}
                          >
                            {m.membershipStatus}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedMember && (
                <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-10 h-10 rounded-xl bg-philgreen flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {selectedMember.firstName} {selectedMember.middleName} {selectedMember.lastName}
                    </p>
                    <p className="text-xs font-mono text-philgreen">{selectedMember.philhealthPin}</p>
                  </div>
                  <span className={`badge ${selectedMember.membershipStatus === 'Active' ? 'badge-green' : 'badge-yellow'}`}>
                    {selectedMember.membershipStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Medicine adder */}
            <div className="card-glass p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-gray-400" />
                Step 2 — Add Medicines from GAMOT Formulary
              </h2>
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="medicine-search"
                  type="text"
                  value={medSearch}
                  onChange={(e) => { setMedSearch(e.target.value); setMedDropdownOpen(true); }}
                  onFocus={() => setMedDropdownOpen(true)}
                  placeholder="Search GAMOT formulary by generic/brand name or code..."
                  className="form-input pl-10"
                />
                {medDropdownOpen && medSearch && (
                  <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredMeds.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">No medicines found.</p>
                    ) : (
                      filteredMeds.map((med) => {
                        const status = getMedicineStatus(med.currentStock);
                        const isOut = status === 'Out of Stock';
                        return (
                          <button
                            key={med.id}
                            onClick={() => addMedicine(med)}
                            disabled={isOut}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-gray-50 last:border-0 transition-colors ${
                              isOut ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-emerald-50'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{med.genericName}</p>
                              <p className="text-xs text-gray-400">
                                {med.brandName} · {med.dosageForm} {med.strength}
                              </p>
                              <p className="text-xs font-mono text-gray-300">{med.formularyCode}</p>
                            </div>
                            <div className="text-right">
                              {stockBadge(med.currentStock)}
                              <p className="text-xs text-gray-400 mt-1">{formatCurrency(med.unitPrice)}/{med.unitOfMeasure}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Rx items table */}
              {rxItems.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No medicines added yet. Search above to add.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Strength / Form</th>
                        <th className="text-center">Qty</th>
                        <th>Dosage Instructions</th>
                        <th className="text-right">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rxItems.map((item, idx) => {
                        const liveStock = medicines.find((m) => m.id === item.medicine.id)?.currentStock ?? 0;
                        const isOver = item.quantity > liveStock;
                        return (
                          <tr key={item.medicine.id}>
                            <td>
                              <p className="font-semibold text-gray-900 text-sm">{item.medicine.genericName}</p>
                              <p className="text-xs text-gray-400 italic">{item.medicine.brandName}</p>
                            </td>
                            <td>
                              <p className="text-sm text-gray-600">{item.medicine.strength}</p>
                              <p className="text-xs text-gray-400">{item.medicine.dosageForm}</p>
                            </td>
                            <td className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={liveStock}
                                  value={item.quantity}
                                  onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                  className={`form-input w-16 text-center text-sm px-2 ${isOver ? 'border-red-400 bg-red-50' : ''}`}
                                />
                                {isOver && (
                                  <span className="text-xs text-red-500 flex items-center gap-0.5">
                                    <XCircle className="w-3 h-3" /> Max: {liveStock}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.dosageInstructions}
                                onChange={(e) => updateItem(idx, 'dosageInstructions', e.target.value)}
                                placeholder="e.g., 1 tablet 3x a day for 7 days"
                                className="form-input text-sm"
                              />
                            </td>
                            <td className="text-right font-semibold text-philgreen text-sm">
                              {formatCurrency(item.medicine.unitPrice * item.quantity)}
                            </td>
                            <td>
                              <button
                                onClick={() => removeItem(idx)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-700 text-right">
                          Total Amount (YAKAP-Covered):
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-philgreen text-lg">
                          {formatCurrency(totalAmount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right panel — Physician, diagnosis, finalize */}
          <div className="space-y-5">
            <div className="card-glass p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Physician</h2>
              <div className="relative">
                <select
                  value={physicianIdx}
                  onChange={(e) => setPhysicianIdx(parseInt(e.target.value))}
                  className="form-input appearance-none pr-8"
                >
                  {PHYSICIANS.map((p, i) => (
                    <option key={i} value={i}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">{PHYSICIANS[physicianIdx].license}</p>
            </div>

            <div className="card-glass p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Clinical Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                    Diagnosis / Chief Complaint
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g., Upper Respiratory Tract Infection"
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Patient advised to complete antibiotic course..."
                    rows={3}
                    className="form-input text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Summary & Finalize */}
            <div className="card-glass p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Prescription Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Patient</span>
                  <span className="font-medium text-gray-800 text-right max-w-[160px] truncate">
                    {selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium text-gray-800">{rxItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Physician</span>
                  <span className="font-medium text-gray-800 text-right max-w-[160px] truncate">{PHYSICIANS[physicianIdx].name}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-2">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="font-bold text-philgreen text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Stock warnings */}
              {rxItems.some((item) => {
                const liveStock = medicines.find((m) => m.id === item.medicine.id)?.currentStock ?? 0;
                return item.quantity > liveStock;
              }) && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200 mb-3">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">
                    One or more medicines exceed available stock. Adjust quantities before finalizing.
                  </p>
                </div>
              )}
              {rxItems.some((item) => {
                const liveStock = medicines.find((m) => m.id === item.medicine.id)?.currentStock ?? 0;
                return liveStock > 0 && liveStock <= 10 && item.quantity <= liveStock;
              }) && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Some medicines have low stock. Notify pharmacist after finalizing.
                  </p>
                </div>
              )}

              <button
                id="finalize-prescription-btn"
                onClick={handleFinalize}
                disabled={!selectedMember || rxItems.length === 0}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Finalize Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
