'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { Member, TriagePriority } from '@/lib/types';
import { useEffect } from 'react';
import {
  LayoutDashboard, Users, Stethoscope, AlertTriangle,
  Clock, ChevronRight, ChevronLeft, Plus, Activity, ClipboardList, Wallet,
  CheckCircle, Timer, UserCheck, Zap, Download, Upload, Database
} from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { getMedicineStatus } from '@/lib/types';
import { toast } from 'sonner';


const PHYSICIANS = [
  'Dr. Rosa Lim, MD', 'Dr. Pedro Ocampo, MD, FPCP',
  'Dr. Emmanuel Buenaventura, MD', 'Dr. Maribel Santos-Garcia, MD',
];

const PRIORITY_COLORS: Record<TriagePriority, string> = {
  Urgent: 'bg-red-100 text-red-700 border-red-200',
  Normal: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-gray-100 text-gray-600 border-gray-200',
};

type RecentMember = {
  id: string;
  philhealthPin: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  clientType: string;
  memberType: string | null;
  department: string | null;
  idNumber: string | null;
  enrollmentStatus: string | null;
  sex: string;
  createdAt: string;
};

export default function DashboardPage() {
  const triageEntries: any[] = [];
  const fpeRecords: any[] = [];
  const prescriptions: any[] = [];
  const medicines: any[] = [];
  const soapNotes: any[] = [];
  const addTriageEntry = (entry: any) => {};
  const updateTriageStatus = (id: string, status: string, physician?: string) => {};

  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [recentImports, setRecentImports] = useState<RecentMember[]>([]);
  const [loadingImports, setLoadingImports] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddTriage, setShowAddTriage] = useState(false);
  const [newEntry, setNewEntry] = useState({ memberSearch: '', complaint: '', priority: 'Normal' as TriagePriority });
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDropdown, setMemberDropdown] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch('/api/members');
        const data = await response.json();
        if (data.members) {
          setAllMembers(data.members);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
      }
    }
    
    async function fetchLogs() {
      try {
        const response = await fetch('/api/audit-log');
        const data = await response.json();
        if (data.auditLog) {
          setAuditLog(data.auditLog);
        }
      } catch (error) {}
    }

    async function fetchRecentImports() {
      try {
        setLoadingImports(true);
        const response = await fetch('/api/members/recent?limit=500');
        const data = await response.json();
        if (data.members) {
          setRecentImports(data.members);
        }
      } catch (error) {
        console.error('Failed to fetch recent imports:', error);
      } finally {
        setLoadingImports(false);
      }
    }

    fetchMembers();
    fetchLogs();
    fetchRecentImports();
    
    // Fetch Zustand store dashboard metrics
    useAppStore.getState().fetchDashboardMetrics();
  }, []);


  const { dashboardMetrics } = useAppStore();

  // Metrics
  const waiting = dashboardMetrics?.waitingTriage ?? 0;
  const inConsult = dashboardMetrics?.activeConsults ?? 0;
  const done = dashboardMetrics?.capitationPerformance?.yearEndTrancheCount ?? 0;
  const lowStock = 0;
  
  const totalCapitation = allMembers.length * 5000;
  const initialTranches = (dashboardMetrics?.capitationPerformance?.initialTrancheCount ?? 0) * 2000;
  const yearEndTranches = (dashboardMetrics?.capitationPerformance?.yearEndTrancheCount ?? 0) * 3000;
  const usedCapitation = initialTranches + yearEndTranches;

  // Masterlist pagination
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(recentImports.length / PAGE_SIZE);
  const pagedImports = recentImports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const filteredMembers = allMembers.filter(m => {
    const q = memberSearch.toLowerCase();
    return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.philhealthPin.toLowerCase().includes(q);
  });

  const handleAddTriage = () => {
    if (!selectedMember) { toast.error('Select a patient first.'); return; }
    if (!newEntry.complaint) { toast.error('Chief complaint is required.'); return; }
    addTriageEntry({
      id: `triage-${Date.now()}`,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      arrivalTime: new Date().toISOString(),
      chiefComplaint: newEntry.complaint,
      priority: newEntry.priority,
      status: 'Waiting',
      assignedPhysician: '',
      clinicId: 'DEFAULT_CLINIC',
    });
    setShowAddTriage(false);
    setSelectedMember(null);
    setMemberSearch('');
    setNewEntry({ memberSearch: '', complaint: '', priority: 'Normal' });
    toast.success('Patient added to triage queue.');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow" style={{ background: '#0A1628' }}>
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OPD Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time clinic operations · {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href="/api/members/export" download="philhealth_masterlist.csv" className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <button onClick={() => setShowAddTriage(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Triage Desk
          </button>
          <Link href="/consultation" className="btn-secondary">
            <Zap className="w-4 h-4" /> Begin Consult
          </Link>
        </div>
      </div>

      {/* Stat Cards (Premium Glassmorphism) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-glass relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5 flex justify-between items-start border-l-4 border-amber-500">
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Waiting</p><p className="text-3xl font-black text-gray-900 tracking-tight">{waiting}</p></div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform"><Timer className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card-glass relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5 flex justify-between items-start border-l-4 border-blue-500">
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">In-Consult</p><p className="text-3xl font-black text-gray-900 tracking-tight">{inConsult}</p></div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform"><Stethoscope className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card-glass relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5 flex justify-between items-start border-l-4 border-emerald-500">
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Completed</p><p className="text-3xl font-black text-gray-900 tracking-tight">{done}</p></div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform"><CheckCircle className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card-glass relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5 flex justify-between items-start border-l-4 border-purple-500">
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Records</p><p className="text-3xl font-black text-gray-900 tracking-tight">{allMembers.length}</p></div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 transition-transform"><ClipboardList className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card-glass relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5 flex justify-between items-start border-l-4 border-red-500">
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock Alerts</p><p className="text-3xl font-black text-gray-900 tracking-tight">{lowStock}</p></div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner group-hover:scale-110 transition-transform"><AlertTriangle className="w-5 h-5" /></div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Masterlist */}
        <div className="xl:col-span-2 card-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" /> Masterlist
            </h2>
            <div className="flex gap-2">
              <Link href="/masterlist" className="btn-secondary text-xs py-1.5 px-3">
                <Upload className="w-3 h-3" /> Import CSV
              </Link>
              <Link href="/reports" className="btn-secondary text-xs py-1.5 px-3">
                View All
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="data-table">
              <thead className="bg-slate-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-xl text-left">Full Name</th>
                  <th className="px-4 py-3 font-semibold text-left">Type</th>
                  <th className="px-4 py-3 font-semibold text-left">Department</th>
                  <th className="px-4 py-3 font-semibold text-left">PHIC PIN</th>
                  <th className="px-4 py-3 font-semibold text-left">ID Number</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingImports ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Loading masterlist...
                      </div>
                    </td>
                  </tr>
                ) : recentImports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Users className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No members imported yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedImports.map(member => (
                    <tr key={member.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-gray-900">
                          {member.lastName}, {member.firstName} {member.middleName ? member.middleName[0] + '.' : ''}
                        </p>
                        <p className="text-xs text-gray-400">{member.sex}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] py-0.5 px-2 ${
                          member.memberType === 'Student' ? 'badge-blue' :
                          member.memberType === 'Staff' || member.memberType === 'Faculty' ? 'badge-green' :
                          member.clientType === 'MEMBER' ? 'badge-blue' : 'badge-yellow'
                        }`}>
                          {member.memberType || member.clientType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {member.department || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                        {member.philhealthPin}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {member.idNumber || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`badge text-[10px] py-0.5 px-2 ${
                          member.enrollmentStatus === 'Active' ? 'badge-green' :
                          member.enrollmentStatus === 'Inactive' ? 'badge-red' :
                          member.enrollmentStatus === 'Graduated' ? 'badge-blue' :
                          'badge-green'
                        }`}>
                          {member.enrollmentStatus || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loadingImports && recentImports.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, recentImports.length)} of {recentImports.length} records
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Capitation Pool */}
          <div className="card-glass p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-gray-400" /> Capitation Pool</h2>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Used</span>
                <span className="font-semibold text-philgreen">₱{usedCapitation.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-philgreen rounded-full" style={{ width: `${Math.min(100, (usedCapitation / totalCapitation) * 100).toFixed(1)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{((usedCapitation / totalCapitation) * 100).toFixed(1)}% utilized</span>
                <span>Total: ₱{totalCapitation.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-3">Remaining: <span className="text-emerald-600">₱{(totalCapitation - usedCapitation).toLocaleString()}</span></p>
          </div>

          {/* Quick Access */}
          <div className="card-glass p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-gray-400" /> Quick Access</h2>
            <div className="space-y-2">
              {[
                { href: '/eligibility', label: 'Check Eligibility (PBEF)', icon: UserCheck, color: 'text-blue-600' },
                { href: '/fpe', label: 'Encode FPE', icon: Stethoscope, color: 'text-emerald-600' },
                { href: '/consultation', label: 'New Consultation', icon: ClipboardList, color: 'text-purple-600' },
                { href: '/lab-results', label: 'Encode Lab Result', icon: Activity, color: 'text-rose-600' },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300 ml-auto group-hover:text-gray-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Recent Activity</h2>
              <Link href="/audit-log" className="text-[10px] uppercase tracking-widest font-bold text-blue-600 hover:text-blue-800 transition-colors">View All</Link>
            </div>
            <div className="space-y-3">
              {auditLog.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No recent activity.</p>
              ) : (
                auditLog.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                      log.actionType.includes('CREATE') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                      log.actionType.includes('DELETE') ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-900 transition-colors">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-gray-500">{log.actor}</span>
                        <span className="text-[10px] text-gray-400">• {formatDateTime(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Add Triage Modal */}
      {showAddTriage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Add to Triage Queue</h2>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Patient *</label>
                <input
                  type="text" value={memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setMemberDropdown(true); }}
                  onFocus={() => setMemberDropdown(true)}
                  placeholder="Search by name or PIN..."
                  className="form-input"
                />
                {memberDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-40 overflow-y-auto">
                    {filteredMembers.slice(0, 6).map(m => (
                      <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(`${m.firstName} ${m.lastName}`); setMemberDropdown(false); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 text-left text-sm border-b border-gray-50 last:border-0">
                        <span className="font-medium">{m.firstName} {m.lastName}</span>
                        <span className="text-xs font-mono text-gray-400">{m.philhealthPin}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedMember && (
                  <p className="text-xs text-emerald-600 mt-1">✓ {selectedMember.philhealthPin} selected</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Chief Complaint *</label>
                <input type="text" value={newEntry.complaint} onChange={e => setNewEntry(p => ({ ...p, complaint: e.target.value }))} className="form-input" placeholder="e.g., Fever and cough for 3 days" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Priority</label>
                <select value={newEntry.priority} onChange={e => setNewEntry(p => ({ ...p, priority: e.target.value as TriagePriority }))} className="form-input">
                  <option>Normal</option><option>Urgent</option><option>Low</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleAddTriage} className="btn-primary flex-1 justify-center">Add to Queue</button>
              <button onClick={() => setShowAddTriage(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
