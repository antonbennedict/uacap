'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Users, Server, CheckCircle, Loader2, Shield, Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const INSTITUTION = {
  id: 'ua',
  name: 'University of the Assumption Clinic',
  phicCode: 'R3-PMP-2024-001',
  accreditation: 'PAASCU Accredited · PhilHealth Accredited UACAP'
};

export default function MasterlistPage() {
  const { importMasterlistEntries } = useAppStore();
  const masterlistEntries: any[] = [];


  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const pendingEntries = masterlistEntries.filter(e => !e.importedAt);
  const importedEntries = masterlistEntries.filter(e => e.importedAt);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleConnect = () => {
    setIsConnecting(true);
    setConnected(false);
    setLogs([]);
    setSelectedIds([]);

    const sequence = [
      `[SYS] Initiating secure connection to UACAP Registry Server...`,
      `[NET] Resolving endpoint: registry.uacap.phic.gov.ph:8443`,
      `[SEC] Performing mTLS handshake (Cert: PHIC-EKONSULTA-R3-2026)...`,
      `[NET] Connection established. TLS 1.3 · AES-256-GCM`,
      `[AUTH] Authenticating institutional credentials...`,
      `[AUTH] Validating HEI accreditation code: ${INSTITUTION.phicCode}`,
      `[AUTH] Accreditation status: ${INSTITUTION.accreditation} ✓`,
      `[SYS] Fetching enrollment roster for ${INSTITUTION.name}...`,
      `[DB] Querying PHIC-linked patient records (Students, Staff, Guests)...`,
      `[DB] ${masterlistEntries.length} profiles found. Matching against local registry...`,
      `[DB] ${pendingEntries.length} unimported profiles detected.`,
      `[SYS] Roster sync complete. Ready for import.`,
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setLogs(prev => [...prev, sequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsConnecting(false);
        setConnected(true);
      }
    }, 350);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(pendingEntries.map(e => e.id));
  };

  const handleImport = () => {
    if (selectedIds.length === 0) { toast.error('Select at least one profile to import.'); return; }
    setIsImporting(true);
    setTimeout(() => {
      importMasterlistEntries(selectedIds);
      setSelectedIds([]);
      setIsImporting(false);
      toast.success(`${selectedIds.length} profiles successfully imported to the local patient registry!`);
    }, 800);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow" style={{ background: '#1D4ED8' }}>
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automated Masterlist Import</h1>
          <p className="text-sm text-gray-500">Secure UACAP Registry Sync</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Connection Panel */}
        <div className="card-glass p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Server className="w-4 h-4" /> Registry Connection</h2>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Institution</label>
            <div className="form-input bg-gray-50 text-gray-700 font-medium py-2.5 px-3 border border-gray-200 rounded-xl">
              {INSTITUTION.name}
            </div>
          </div>
          <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 mb-4">
            <p className="text-xs font-mono text-blue-700">PHIC Code: {INSTITUTION.phicCode}</p>
            <p className="text-xs text-blue-500 mt-0.5">{INSTITUTION.accreditation}</p>
          </div>
          <button onClick={handleConnect} disabled={isConnecting}
            className="btn-primary w-full justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isConnecting ? 'Connecting...' : 'Connect to UACAP Server'}
          </button>
          {connected && (
            <p className="text-xs text-emerald-600 mt-2 text-center flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> Connected · {pendingEntries.length} profiles ready for import
            </p>
          )}
        </div>

        {/* API Terminal */}
        <div className="rounded-xl bg-[#0a0a0a] border border-gray-800 shadow-xl overflow-hidden min-h-[220px] flex flex-col">
          <div className="bg-[#1a1a1a] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2"><Database className="w-4 h-4 text-gray-400" /><span className="text-xs font-mono text-gray-400">masterlist_sync.sh</span></div>
            <div className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-500" /><span className="text-xs font-mono text-emerald-500">mTLS Secured</span></div>
          </div>
          <div className="p-4 font-mono text-xs flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <span className="text-gray-600 italic">Awaiting connection...</span>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={`leading-tight animate-fade-in ${
                    log.includes('[SYS]') ? 'text-blue-400' :
                    log.includes('[NET]') ? 'text-cyan-400' :
                    log.includes('[SEC]') ? 'text-emerald-400' :
                    log.includes('[AUTH]') ? 'text-yellow-400' :
                    log.includes('[DB]') ? 'text-purple-400' : 'text-gray-300'
                  }`}>{log}</div>
                ))}
                {isConnecting && <div className="text-gray-500 animate-pulse">_</div>}
                <div ref={terminalEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Table */}
      {connected && (
        <div className="card-glass p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Pending Profiles — {INSTITUTION.name}</h2>
              <p className="text-xs text-gray-400">{pendingEntries.length} unimported · {importedEntries.length} already in registry</p>
            </div>
            <div className="flex gap-2">
              {selectedIds.length < pendingEntries.length ? (
                <button onClick={selectAll} className="btn-secondary text-xs py-1.5 px-3">Select All</button>
              ) : (
                <button onClick={() => setSelectedIds([])} className="btn-secondary text-xs py-1.5 px-3">Deselect All</button>
              )}
              <button onClick={handleImport} disabled={selectedIds.length === 0 || isImporting}
                className="btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs py-1.5 px-3">
                {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                {isImporting ? 'Importing...' : `Commit Import (${selectedIds.length})`}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"><input type="checkbox" onChange={e => e.target.checked ? selectAll() : setSelectedIds([])} checked={selectedIds.length === pendingEntries.length && pendingEntries.length > 0} className="rounded" /></th>
                  <th>Full Name</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>PHIC PIN</th>
                  <th>ID Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {masterlistEntries.map(entry => (
                  <tr key={entry.id} className={entry.importedAt ? 'opacity-50' : ''}>
                    <td>
                      <input type="checkbox" disabled={!!entry.importedAt}
                        checked={selectedIds.includes(entry.id)}
                        onChange={() => toggleSelect(entry.id)} className="rounded" />
                    </td>
                    <td>
                      <p className="font-semibold text-sm text-gray-900">{entry.lastName}, {entry.firstName} {entry.middleName}</p>
                      <p className="text-xs text-gray-400">{entry.email}</p>
                    </td>
                    <td>
                      <span className={`badge text-xs ${
                        entry.type === 'Student' ? 'badge-blue' :
                        entry.type === 'Staff' || entry.type === 'Faculty' ? 'badge-green' :
                        'badge-yellow'
                      }`}>{entry.type}</span>
                    </td>
                    <td className="text-sm text-gray-700">{entry.department}</td>
                    <td className="font-mono text-xs text-gray-600">{entry.philhealthPin}</td>
                    <td className="font-mono text-xs text-gray-600">{entry.studentNumber ?? entry.employeeId ?? '—'}</td>
                    <td>
                      {entry.importedAt ? (
                        <span className="badge badge-green text-xs"><CheckCircle className="w-3 h-3" /> Imported</span>
                      ) : (
                        <span className="badge badge-yellow text-xs">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
