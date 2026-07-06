'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';
import { History, ChevronDown, ChevronUp, RefreshCw, FileText, Package, LogIn, CheckCircle, TrendingDown } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const actionIcons: Record<string, React.ReactNode> = {
  RESTOCK: <Package className="w-3.5 h-3.5" />,
  PRESCRIPTION_FINALIZED: <FileText className="w-3.5 h-3.5" />,
  STOCK_DEDUCTED: <TrendingDown className="w-3.5 h-3.5" />,
  LOGIN: <LogIn className="w-3.5 h-3.5" />,
  ELIGIBILITY_CHECK: <CheckCircle className="w-3.5 h-3.5" />,
};

const actionColors: Record<string, string> = {
  RESTOCK: 'badge-green',
  PRESCRIPTION_FINALIZED: 'badge-blue',
  STOCK_DEDUCTED: 'badge-yellow',
  LOGIN: 'badge-gray',
  ELIGIBILITY_CHECK: 'badge-gray',
};

const actionLabels: Record<string, string> = {
  RESTOCK: 'Restock',
  PRESCRIPTION_FINALIZED: 'Prescription',
  STOCK_DEDUCTED: 'Stock Deducted',
  LOGIN: 'Login',
  ELIGIBILITY_CHECK: 'Eligibility Check',
};

export default function AuditLog() {
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch true database audit records
  useEffect(() => {
    fetch('/api/audit-log')
      .then(res => res.json())
      .then(data => setAuditLog(data.auditLog || []))
      .catch(console.error);
  }, []);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('All');

  const filtered = auditLog.filter((e) => filter === 'All' || e.actionType === filter);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="card-glass overflow-hidden">
      {/* Collapsible header */}
      <button
        id="audit-log-toggle"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <History className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-800">Audit Log</h3>
            <p className="text-xs text-gray-400">{auditLog.length} total entries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-gray text-xs">{auditLog.length} entries</span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-5 animate-fade-in">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['All', 'RESTOCK', 'PRESCRIPTION_FINALIZED', 'STOCK_DEDUCTED'].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filter === f
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                style={filter === f ? { backgroundColor: '#0A1628' } : {}}
              >
                {actionLabels[f] ?? f}
                <span className={`ml-1.5 px-1 rounded text-xs ${filter === f ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {f === 'All' ? auditLog.length : auditLog.filter((e) => e.actionType === f).length}
                </span>
              </button>
            ))}
          </div>

          {/* Entries */}
          <div className="space-y-2">
            {paginated.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No audit entries for this filter.</p>
              </div>
            ) : (
              paginated.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  {/* Action icon */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      entry.actionType === 'RESTOCK'
                        ? 'bg-emerald-100 text-emerald-600'
                        : entry.actionType === 'PRESCRIPTION_FINALIZED'
                        ? 'bg-blue-100 text-blue-600'
                        : entry.actionType === 'STOCK_DEDUCTED'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {actionIcons[entry.actionType] ?? <RefreshCw className="w-3.5 h-3.5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${actionColors[entry.actionType] ?? 'badge-gray'} text-xs`}>
                        {actionLabels[entry.actionType] ?? entry.actionType}
                      </span>
                      <span className="text-xs text-gray-600 font-medium">{entry.actor}</span>
                      <span className="text-xs text-gray-400">{entry.actorRole}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 leading-snug">{entry.description}</p>
                    {/* Metadata */}
                    {entry.metadata && (entry.metadata.quantityAdded || entry.metadata.quantityDeducted) && (
                      <div className="flex gap-3 mt-1">
                        {entry.metadata.quantityAdded && (
                          <span className="text-xs text-emerald-600 font-semibold">
                            +{entry.metadata.quantityAdded} units added
                          </span>
                        )}
                        {entry.metadata.quantityDeducted && (
                          <span className="text-xs text-amber-600 font-semibold">
                            -{entry.metadata.quantityDeducted} units deducted
                          </span>
                        )}
                        {entry.metadata.previousStock !== undefined && (
                          <span className="text-xs text-gray-400">
                            {entry.metadata.previousStock} → {entry.metadata.newStock}
                          </span>
                        )}
                      </div>
                    )}
                    {entry.metadata.totalAmount && (
                      <span className="text-xs text-blue-600 font-semibold mt-1 block">
                        ₱{Number(entry.metadata.totalAmount).toFixed(2)} · {entry.metadata.itemCount} item{Number(entry.metadata.itemCount) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
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
      )}
    </div>
  );
}
