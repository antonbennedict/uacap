'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Activity, ClipboardList, Download, Upload, Users, 
  Search, ArrowUpDown, Loader2, PieChart as PieChartIcon, ChevronLeft, ChevronRight,
  CheckCircle, X, FileText, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

type PatientData = {
  id: string;
  philhealthPin: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  clientType: string;
  packageType: string;
  sex: string;
  mobileNumber: string | null;
  memberType: string | null;
  department: string | null;
  idNumber: string | null;
  enrollmentStatus: string | null;
  createdAt: string;
};

type SortConfig = {
  key: keyof PatientData;
  direction: 'asc' | 'desc';
} | null;

type ParsedRow = Record<string, string>;

const COLORS = ['#004B87', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  }).filter(r => r.philhealthPin);
}

export default function ReportsPage() {
  const [activityData, setActivityData] = useState<any[]>([]);
  const [formularyData, setFormularyData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [clientTypeData, setClientTypeData] = useState<any[]>([]);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [tableKey, setTableKey] = useState(0); // bump to force refetch after import

  // Pagination & Sorting State (Server-Side)
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

  // Inline CSV import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<ParsedRow[]>([]);
  const [importParseError, setImportParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Debounce Search Query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); 
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoadingTable(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          search: debouncedQuery,
          sortBy: sortConfig?.key || 'createdAt',
          sortOrder: sortConfig?.direction || 'desc',
        });
        
        const [patientsRes, metricsRes] = await Promise.all([
          fetch(`/api/reports/users?${params.toString()}`),
          fetch('/api/reports/metrics')
        ]);

        const pData = await patientsRes.json();
        const mData = await metricsRes.json();

        if (isMounted && pData.data) {
          setPatients(pData.data);
          setTotalRecords(pData.meta?.total || 0);
          setTotalPages(pData.meta?.totalPages || 1);
        }
        
        if (isMounted && mData) {
          setActivityData(mData.activityData || []);
          setFormularyData(mData.formularyData || []);
          setPriorityData(mData.priorityData || []);
          setClientTypeData(mData.clientTypeData || []);
        }
      } catch (e) {
        toast.error('Failed to load live data.');
      } finally {
        if (isMounted) {
          setLoadingTable(false);
          setLoadingMetrics(false);
        }
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [currentPage, pageSize, debouncedQuery, sortConfig, tableKey]);

  const handleSort = (key: keyof PatientData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // CSV Import handlers
  const processImportFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setImportParseError('Please upload a valid .csv file.');
      return;
    }
    setImportFileName(file.name);
    setImportParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setImportParseError('The CSV file appears to be empty or malformed.');
        setImportRows([]);
        return;
      }
      setImportRows(rows);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImportFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImportFile(file);
  }, []);

  const handleImportCommit = async () => {
    if (importRows.length === 0) return;
    setIsImporting(true);
    try {
      const response = await fetch('/api/settings/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');
      toast.success(`✅ ${data.insertedCount} records imported, ${data.skippedCount} skipped.`);
      setShowImportPanel(false);
      setImportRows([]);
      setImportFileName(null);
      setTableKey(k => k + 1); // Refetch the table
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Database</h1>
            <p className="text-sm text-gray-500">Live analytics, unified database viewer, and export tools.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImportPanel(true); setImportRows([]); setImportFileName(null); setImportParseError(null); }}
            className="btn-secondary"
          >
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <a href="/api/members/export" download="philhealth_masterlist.csv" className="btn-primary" style={{ background: '#004B87' }}>
            <Download className="w-4 h-4" /> Export CSV
          </a>
        </div>
      </div>

      {/* Inline Import Panel */}
      {showImportPanel && (
        <div className="card-glass p-5 animate-fade-in border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Import CSV Data</h2>
            </div>
            <button onClick={() => setShowImportPanel(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!importFileName ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 px-8 text-center transition-all duration-200"
              style={{ borderColor: isDragging ? '#3B82F6' : '#CBD5E1', background: isDragging ? '#EFF6FF' : '#F8FAFC' }}
            >
              <Upload className="w-10 h-10 text-blue-400 mb-3" />
              <p className="font-semibold text-gray-700 mb-1">{isDragging ? 'Drop your CSV here' : 'Click or drag & drop CSV'}</p>
              <p className="text-sm text-gray-400">Accepts the masterlist format · <a href="/sampledata.csv" download className="text-blue-500 underline" onClick={e => e.stopPropagation()}>Download template</a></p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="space-y-3">
              {importParseError ? (
                <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{importParseError}</p>
                </div>
              ) : (
                <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-800">{importFileName}</p>
                      <p className="text-xs text-emerald-600">{importRows.length} records ready to import</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setImportFileName(null); setImportRows([]); }} className="btn-secondary text-sm py-2">
                      <X className="w-4 h-4" /> Change
                    </button>
                    <button
                      onClick={handleImportCommit}
                      disabled={isImporting || importRows.length === 0}
                      className="btn-primary text-sm py-2 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }}
                    >
                      {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {isImporting ? 'Importing...' : `Import ${importRows.length} Records`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Activity className="w-4 h-4 text-gray-400" /> Patient Influx / Activity (Live)</h2>
            {loadingMetrics && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004B87" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#004B87" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="patients" stroke="#004B87" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card-glass p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400" /> Formulary Utilization (Live)</h2>
            {loadingMetrics && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formularyData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1E293B', fontWeight: 500 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="prescribed" fill="#004B87" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-gray-400" /> Patient Demographics</h2>
            {loadingMetrics && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={clientTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {clientTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glass p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-gray-400" /> Triage Priorities</h2>
            {loadingMetrics && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {priorityData.map((entry, index) => {
                    const color = entry.name === 'Urgent' ? '#EF4444' : entry.name === 'Normal' ? '#3B82F6' : '#9CA3AF';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patient Database Table */}
      <div className="card-glass overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Patient Database Viewer</h2>
            {loadingTable && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search PIN, name, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-9 text-sm py-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 border-b border-gray-100">
              <tr>
                <th onClick={() => handleSort('philhealthPin')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">PHIC PIN <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('lastName')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">Full Name <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">ID Number</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th onClick={() => handleSort('createdAt')} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">Registered <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    {loadingTable ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading data...
                      </div>
                    ) : 'No matching records found.'}
                  </td>
                </tr>
              ) : (
                patients.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-[#004B87] font-semibold">{p.philhealthPin}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.lastName}, {p.firstName} {p.middleName ? p.middleName[0] + '.' : ''}</p>
                      <p className="text-xs text-gray-400">{p.sex}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] py-0.5 px-2 ${
                        p.memberType === 'Student' ? 'badge-blue' :
                        p.memberType === 'Staff' || p.memberType === 'Faculty' ? 'badge-green' :
                        p.clientType === 'MEMBER' ? 'badge-blue' : 'badge-yellow'
                      }`}>
                        {p.memberType || p.clientType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.department || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.idNumber || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] py-0.5 px-2 ${
                        p.enrollmentStatus === 'Active' ? 'badge-green' :
                        p.enrollmentStatus === 'Inactive' ? 'badge-red' :
                        p.enrollmentStatus === 'Graduated' ? 'badge-blue' :
                        'badge-gray'
                      }`}>
                        {p.enrollmentStatus || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
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
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span>
              Showing {totalRecords === 0 ? 0 : ((currentPage - 1) * pageSize) + 1}-
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
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
