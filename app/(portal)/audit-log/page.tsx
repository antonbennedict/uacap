'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Shield, Activity, Search, Loader2, Server, ArrowUpDown, ChevronLeft, ChevronRight, UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

type AuditLogEntry = {
  id: string;
  actionType: string;
  description: string;
  actor: string;
  timestamp: string;
};

type SortConfig = {
  key: keyof AuditLogEntry;
  direction: 'asc' | 'desc';
} | null;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-log');
      const data = await res.json();
      setLogs(data.auditLog || []);
    } catch (e) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const handleSort = (key: keyof AuditLogEntry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredLogs = useMemo(() => {
    let filtered = logs;
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(l => 
        (l.actionType && l.actionType.toLowerCase().includes(q)) || 
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.actor && l.actor.toLowerCase().includes(q))
      );
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [logs, searchQuery, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredLogs.length / pageSize));
  
  let safePage = currentPage;
  if (safePage > totalPages) safePage = totalPages;
  if (safePage < 1) safePage = 1;

  const paginatedLogs = useMemo(() => {
    if (pageSize === -1) return sortedAndFilteredLogs;
    const start = (safePage - 1) * pageSize;
    return sortedAndFilteredLogs.slice(start, start + pageSize);
  }, [sortedAndFilteredLogs, safePage, pageSize]);

  const getActionColor = (action?: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD')) return 'badge-emerald';
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'badge-red';
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'badge-yellow';
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'badge-blue';
    return 'badge-gray';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #1F2937, #111827)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Audit Log</h1>
            <p className="text-sm text-gray-500">Immutable record of all administrative and clinical actions.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={fetchLogs} disabled={loading} className="btn-secondary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
            Refresh DB
          </button>
        </div>
      </div>

      {/* Live Data Grid / Database Viewer */}
      <div className="card-glass overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Activity Timeline</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by action, description, or actor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-9 text-sm py-2"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 border-b border-gray-100">
              <tr>
                <th onClick={() => handleSort('timestamp')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">Timestamp <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('actionType')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">Action Type <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('actor')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">Actor <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('description')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {loading ? 'Fetching securely...' : 'No activity records found.'}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] py-0.5 px-2 ${getActionColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="font-medium text-gray-900">{log.actor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50/50 p-3 text-xs text-gray-500 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span>Rows per page:</span>
            <select 
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span>
              Showing {pageSize === -1 ? 1 : ((safePage - 1) * pageSize) + 1}-
              {pageSize === -1 ? sortedAndFilteredLogs.length : Math.min(safePage * pageSize, sortedAndFilteredLogs.length)} of {sortedAndFilteredLogs.length} events
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
