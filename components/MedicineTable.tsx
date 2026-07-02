'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { getMedicineStatus, type Medicine } from '@/lib/types';
import { Plus, Minus, CheckCircle, AlertTriangle, XCircle, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

interface MedicineTableProps {
  onRestock?: (medicineId: string, quantity: number) => void;
}

const ITEMS_PER_PAGE = 10;

export default function MedicineTable({ onRestock }: MedicineTableProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Adequate' | 'Low' | 'Out of Stock'>('All');
  const [page, setPage] = useState(1);
  const [restockQty, setRestockQty] = useState<Record<string, number>>({});
  const [restockingId, setRestockingId] = useState<string | null>(null);


  useEffect(() => {
    fetch('/api/medicines')
      .then(res => res.json())
      .then(data => setMedicines(data.medicines || []))
      .catch(console.error);
  }, []);

  const filtered = medicines.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.genericName.toLowerCase().includes(q) ||
      (m.salt && m.salt.toLowerCase().includes(q)) ||
      (m.package && m.package.toLowerCase().includes(q));
    const status = getMedicineStatus(m.quantity);
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
      toast.success(`Restocked ${med.genericName} by ${qty} ${med.unit || ''}(s). New stock: ${medicine.quantity}.`);
      setRestockQty((prev) => ({ ...prev, [med.id]: 0 }));
    } catch (err) {
      toast.error('Restock error');
    } finally {
      setRestockingId(null);
    }
  };

  const StatusBadge = ({ stock }: { stock: number }) => {
    const status = getMedicineStatus(stock);
    if (status === 'Out of Stock')
      return (
        <span className="badge badge-red">
          <XCircle className="w-3 h-3" /> Out of Stock
        </span>
      );
    if (status === 'Low')
      return (
        <span className="badge badge-yellow">
          <AlertTriangle className="w-3 h-3" /> Low
        </span>
      );
    return (
      <span className="badge badge-green">
        <CheckCircle className="w-3 h-3" /> Adequate
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
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Adequate', count: medicines.filter((m) => getMedicineStatus(m.quantity) === 'Adequate').length, cls: 'text-emerald-600' },
          { label: 'Low Stock', count: medicines.filter((m) => getMedicineStatus(m.quantity) === 'Low').length, cls: 'text-amber-500' },
          { label: 'Out of Stock', count: medicines.filter((m) => getMedicineStatus(m.quantity) === 'Out of Stock').length, cls: 'text-red-500' },
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
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Salt</th>
                  <th>Generic Name</th>
                  <th>Form / Strength</th>
                  <th>Package</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-center">Stock</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Restock</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((med) => {
                  const isLive = medicines.find((m) => m.id === med.id);
                  const liveStock = isLive?.quantity ?? med.quantity;
                  const isRestocking = restockingId === med.id;
                  return (
                    <tr key={med.id} className={liveStock === 0 ? 'bg-red-50/30' : liveStock <= 10 ? 'bg-amber-50/20' : ''}>
                      <td>
                        <span className="text-sm text-gray-700">{med.salt || 'N/A'}</span>
                      </td>
                      <td className="font-semibold text-gray-900">{med.genericName}</td>
                      <td>
                        <span className="text-sm text-gray-700">{med.dosageForm}</span>
                        <span className="text-xs text-gray-400 ml-1">· {med.strength}</span>
                      </td>
                      <td>
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                          {med.package || 'N/A'}
                        </span>
                      </td>
                      <td className="text-right font-medium text-gray-700">{formatCurrency(med.actualUnitPrice)}</td>
                      <td className="text-center">
                        <span className={`text-base font-bold ${liveStock === 0 ? 'text-red-500' : liveStock <= 10 ? 'text-amber-500' : 'text-gray-900'}`}>
                          {liveStock}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{med.unit}</span>
                      </td>
                      <td className="text-center">
                        <StatusBadge stock={liveStock} />
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 justify-center">
                          <button
                            onClick={() => setRestockQty((prev) => ({ ...prev, [med.id]: Math.max(0, (prev[med.id] ?? 0) - 10) }))}
                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={restockQty[med.id] ?? 0}
                            onChange={(e) => setRestockQty((prev) => ({ ...prev, [med.id]: parseInt(e.target.value) || 0 }))}
                            className="form-input w-16 text-center text-sm px-1 py-1"
                          />
                          <button
                            onClick={() => setRestockQty((prev) => ({ ...prev, [med.id]: (prev[med.id] ?? 0) + 10 }))}
                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                          <button
                            id={`restock-${med.id}`}
                            onClick={() => handleRestock(med)}
                            disabled={!restockQty[med.id] || restockQty[med.id] <= 0 || isRestocking}
                            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed ml-1"
                          >
                            {isRestocking ? 'Saving...' : 'Add'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} medicines
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-philgreen text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
