'use client';

import { useAppStore } from '@/lib/store';
import MedicineTable from '@/components/MedicineTable';
import AuditLog from '@/components/AuditLog';
import { Package, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { getMedicineStatus } from '@/lib/types';

export default function GamotPage() {
  // Removed useAppStore destructing for legacy properties
  const medicines: any[] = [];
  const lastUpdated = new Date().toISOString();

  const outOfStock = medicines.filter((m) => getMedicineStatus(m.quantity) === 'Out of Stock').length;
  const lowStock = medicines.filter((m) => getMedicineStatus(m.quantity) === 'Low').length;
  const adequate = medicines.filter((m) => getMedicineStatus(m.quantity) === 'Adequate').length;
  const totalItems = medicines.reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md bg-blue-700">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GAMOT Medicine Inventory</h1>
            <p className="text-sm text-gray-500">PhilHealth YAKAP Outpatient Formulary</p>
          </div>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Clock className="w-4 h-4" />
          <span>
            Last updated:{' '}
            <span className="font-medium text-gray-700">
              {lastUpdated ? formatDateTime(lastUpdated) : 'No recent changes'}
            </span>
          </span>
          <RefreshCw className="w-3.5 h-3.5 ml-1 text-gray-300" />
        </div>
      </div>

      {/* Alerts for critical stock */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="mb-5 space-y-2">
          {outOfStock > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {outOfStock} medicine{outOfStock !== 1 ? 's' : ''} out of stock
                </p>
                <p className="text-xs text-red-600">
                  Prescriptions for these medicines will be blocked until restocked.
                </p>
              </div>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {lowStock} medicine{lowStock !== 1 ? 's' : ''} running low (≤10 units)
                </p>
                <p className="text-xs text-amber-600">
                  Please restock these medicines soon to ensure continuous patient care.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{medicines.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Formulary items</p>
        </div>
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Adequate</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{adequate}</p>
          <p className="text-xs text-gray-400 mt-0.5">&gt;10 units</p>
        </div>
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Low Stock</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{lowStock}</p>
          <p className="text-xs text-gray-400 mt-0.5">1–10 units</p>
        </div>
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Units</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalItems.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Across all medicines</p>
        </div>
      </div>

      {/* Medicine table */}
      <div className="card-glass p-5 mb-6">
        <MedicineTable />
      </div>

      {/* Audit log (collapsible) */}
      <AuditLog />
    </div>
  );
}
