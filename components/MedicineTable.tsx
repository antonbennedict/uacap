'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { type Medicine } from '@/lib/types';
import { Plus, Minus, CheckCircle, AlertTriangle, XCircle, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

interface MedicineTableProps {
  onRestock?: (medicineId: string, quantity: number) => void;
}

const ITEMS_PER_PAGE = 10;

// YAKAP standard library for category lookup
const DRUG_LIBRARY = [
  // Anti-Infectious (21)
  { genericName: 'Albendazole', category: 'Anti-Infectious' },
  { genericName: 'Amoxicillin', category: 'Anti-Infectious' },
  { genericName: 'Azithromycin', category: 'Anti-Infectious' },
  { genericName: 'Cefixime', category: 'Anti-Infectious' },
  { genericName: 'Cefuroxime', category: 'Anti-Infectious' },
  { genericName: 'Ciprofloxacin', category: 'Anti-Infectious' },
  { genericName: 'Clarithromycin', category: 'Anti-Infectious' },
  { genericName: 'Clindamycin', category: 'Anti-Infectious' },
  { genericName: 'Clotrimazole', category: 'Anti-Infectious' },
  { genericName: 'Cloxacillin', category: 'Anti-Infectious' },
  { genericName: 'Co-amoxiclav', category: 'Anti-Infectious' },
  { genericName: 'Co-trimoxazole', category: 'Anti-Infectious' },
  { genericName: 'Doxycycline', category: 'Anti-Infectious' },
  { genericName: 'Erythromycin', category: 'Anti-Infectious' },
  { genericName: 'Fluconazole', category: 'Anti-Infectious' },
  { genericName: 'Ketoconazole', category: 'Anti-Infectious' },
  { genericName: 'Mebendazole', category: 'Anti-Infectious' },
  { genericName: 'Metronidazole', category: 'Anti-Infectious' },
  { genericName: 'Nitrofurantoin', category: 'Anti-Infectious' },
  { genericName: 'Oseltamivir', category: 'Anti-Infectious' },
  { genericName: 'Tobramycin', category: 'Anti-Infectious' },

  // Anti-Hypertensive & Cardiology (18)
  { genericName: 'Amlodipine', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Atenolol', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Captopril', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Clonidine', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Diltiazem', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Enalapril', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Enalapril + Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Isosorbide Dinitrate', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Isosorbide Mononitrate', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Losartan', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Methyldopa', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Metoprolol', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Tamsulosin', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Telmisartan', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Telmisartan + Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Valsartan', category: 'Anti-Hypertensive & Cardiology' },
  { genericName: 'Valsartan + Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology' },

  // Anti-Asthma & COPD (8)
  { genericName: 'Budesonide + Formoterol', category: 'Anti-Asthma & COPD' },
  { genericName: 'Fluticasone + Salmeterol', category: 'Anti-Asthma & COPD' },
  { genericName: 'Ipratropium', category: 'Anti-Asthma & COPD' },
  { genericName: 'Ipratropium + Salbutamol', category: 'Anti-Asthma & COPD' },
  { genericName: 'Montelukast', category: 'Anti-Asthma & COPD' },
  { genericName: 'Prednisone', category: 'Anti-Asthma & COPD' },
  { genericName: 'Salbutamol', category: 'Anti-Asthma & COPD' },
  { genericName: 'Tiotropium', category: 'Anti-Asthma & COPD' },

  // Anti-Diabetics (3)
  { genericName: 'Dapagliflozin', category: 'Anti-Diabetics' },
  { genericName: 'Gliclazide', category: 'Anti-Diabetics' },
  { genericName: 'Metformin', category: 'Anti-Diabetics' },

  // Anti-Dyslipidemia (4)
  { genericName: 'Atorvastatin', category: 'Anti-Dyslipidemia' },
  { genericName: 'Fenofibrate', category: 'Anti-Dyslipidemia' },
  { genericName: 'Rosuvastatin', category: 'Anti-Dyslipidemia' },
  { genericName: 'Simvastatin', category: 'Anti-Dyslipidemia' },

  // Anti-Thrombotics (2)
  { genericName: 'Aspirin', category: 'Anti-Thrombotics' },
  { genericName: 'Clopidogrel', category: 'Anti-Thrombotics' },

  // Nervous System (1)
  { genericName: 'Gabapentin', category: 'Nervous System' },

  // Supportive/Other Therapy (18)
  { genericName: 'Aluminum Hydroxide + Magnesium Hydroxide', category: 'Supportive/Other Therapy' },
  { genericName: 'Butamirate', category: 'Supportive/Other Therapy' },
  { genericName: 'Celecoxib', category: 'Supportive/Other Therapy' },
  { genericName: 'Cetirizine', category: 'Supportive/Other Therapy' },
  { genericName: 'Chlorphenamine', category: 'Supportive/Other Therapy' },
  { genericName: 'Colchicine', category: 'Supportive/Other Therapy' },
  { genericName: 'Diphenhydramine', category: 'Supportive/Other Therapy' },
  { genericName: 'Ferrous Salt', category: 'Supportive/Other Therapy' },
  { genericName: 'Folic Acid + Iron Ferrous', category: 'Supportive/Other Therapy' },
  { genericName: 'Ibuprofen', category: 'Supportive/Other Therapy' },
  { genericName: 'Lagundi', category: 'Supportive/Other Therapy' },
  { genericName: 'Loratadine', category: 'Supportive/Other Therapy' },
  { genericName: 'Mefenamic Acid', category: 'Supportive/Other Therapy' },
  { genericName: 'Naproxen', category: 'Supportive/Other Therapy' },
  { genericName: 'Omeprazole', category: 'Supportive/Other Therapy' },
  { genericName: 'Oral Rehydration Salts', category: 'Supportive/Other Therapy' },
  { genericName: 'Paracetamol', category: 'Supportive/Other Therapy' },
  { genericName: 'Zinc', category: 'Supportive/Other Therapy' },
];

const getMedicineCategory = (genericName: string) => {
  const match = DRUG_LIBRARY.find(d => d.genericName.toLowerCase() === genericName.toLowerCase());
  return match ? match.category : 'Supportive/Other Therapy';
};

// Low Stock threshold updated to < 20 units as requested
export const getCustomMedicineStatus = (qty: number) => {
  if (qty === 0) return 'Out of Stock';
  if (qty < 20) return 'Low';
  return 'Adequate';
};

export default function MedicineTable({ onRestock }: MedicineTableProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Adequate' | 'Low' | 'Out of Stock'>('All');
  const [page, setPage] = useState(1);
  const [restockQty, setRestockQty] = useState<Record<string, number>>({});
  const [restockingId, setRestockingId] = useState<string | null>(null);

  const fetchMedicines = () => {
    fetch('/api/medicines')
      .then(res => res.json())
      .then(data => setMedicines(data.medicines || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const filtered = medicines.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.genericName.toLowerCase().includes(q) ||
      (m.salt && m.salt.toLowerCase().includes(q)) ||
      (m.package && m.package.toLowerCase().includes(q));
    const status = getCustomMedicineStatus(m.quantity);
    const matchesStatus = filterStatus === 'All' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleRestock = async (med: Medicine) => {
    const qty = restockQty[med.id] ?? 0;
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity to restock.');
      return;
    }

    setRestockingId(med.id);
    try {
      const res = await fetch('/api/medicines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicineId: med.id, action: 'restock', quantity: qty }),
      });
      if (!res.ok) throw new Error('Failed to restock');
      
      const { medicine } = await res.json();
      setMedicines(prev => prev.map(m => m.id === med.id ? medicine : m));
      
      onRestock?.(med.id, qty);
      toast.success(`Restocked ${med.genericName} by ${qty}. New stock: ${medicine.quantity}.`);
      setRestockQty((prev) => ({ ...prev, [med.id]: 0 }));
    } catch (err) {
      toast.error('Restock error');
    } finally {
      setRestockingId(null);
    }
  };

  const StatusBadge = ({ stock }: { stock: number }) => {
    const status = getCustomMedicineStatus(stock);
    if (status === 'Out of Stock')
      return (
        <span className="badge badge-red">
          <XCircle className="w-3 h-3" /> Out of Stock
        </span>
      );
    if (status === 'Low')
      return (
        <span className="badge badge-yellow">
          <AlertTriangle className="w-3 h-3" /> Low Stock
        </span>
      );
    return (
      <span className="badge badge-green">
        <CheckCircle className="w-3 h-3" /> Sufficient
      </span>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="medicine-inventory-search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search medicines..."
            className="form-input pl-9 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1); }}
          className="form-input text-sm min-w-[140px]"
        >
          {['All', 'Adequate', 'Low', 'Out of Stock'].map((s) => (
            <option key={s} value={s === 'Adequate' ? 'Adequate' : s}>{s === 'Low' ? 'Low' : s}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Sufficient Supply', count: medicines.filter((m) => getCustomMedicineStatus(m.quantity) === 'Adequate').length, cls: 'text-emerald-600' },
          { label: 'Low Stock (<20)', count: medicines.filter((m) => getCustomMedicineStatus(m.quantity) === 'Low').length, cls: 'text-amber-500' },
          { label: 'Out of Stock', count: medicines.filter((m) => getCustomMedicineStatus(m.quantity) === 'Out of Stock').length, cls: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="card-stat text-center">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.count}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No medicines found</p>
          <p className="text-sm text-gray-300">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr className="bg-gray-150">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Medicine Details</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-center">Unit</th>
                  <th className="px-3 py-2 text-center font-bold">Stock Level</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Restock Admin</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((med) => {
                  const isLive = medicines.find((m) => m.id === med.id);
                  const liveStock = isLive?.quantity ?? med.quantity;
                  const isRestocking = restockingId === med.id;
                  const category = getMedicineCategory(med.genericName);
                  return (
                    <tr key={med.id} className={liveStock === 0 ? 'bg-red-50/20' : liveStock < 20 ? 'bg-amber-50/15' : ''}>
                      <td className="px-3 py-2 font-medium text-gray-500">{category}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-gray-900 block">{med.genericName}</span>
                        <span className="text-[10px] text-gray-400">{med.salt || ''} · {med.dosageForm || ''} {med.strength || ''} · {med.package || ''}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700 font-medium">{formatCurrency(med.actualUnitPrice)}</td>
                      <td className="px-3 py-2 text-center text-gray-500 font-medium">{med.unit || 'Unit'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-sm font-bold ${liveStock === 0 ? 'text-red-600' : liveStock < 20 ? 'text-amber-500' : 'text-emerald-700'}`}>
                          {liveStock}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <StatusBadge stock={liveStock} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => setRestockQty((prev) => ({ ...prev, [med.id]: Math.max(0, (prev[med.id] ?? 0) - 10) }))}
                            className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={restockQty[med.id] ?? 0}
                            onChange={(e) => setRestockQty((prev) => ({ ...prev, [med.id]: parseInt(e.target.value) || 0 }))}
                            className="form-input w-12 text-center text-xs px-1 py-0.5"
                          />
                          <button
                            onClick={() => setRestockQty((prev) => ({ ...prev, [med.id]: (prev[med.id] ?? 0) + 10 }))}
                            className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleRestock(med)}
                            disabled={!restockQty[med.id] || restockQty[med.id] <= 0 || isRestocking}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed ml-1 transition-all"
                          >
                            {isRestocking ? '...' : 'Add'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs text-gray-500">
                Showing Page <strong className="font-bold text-gray-700">{page}</strong> of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
