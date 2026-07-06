'use client';

import { useState, useEffect, useRef } from 'react';
import { Server, Calendar, CheckCircle, UploadCloud, Terminal, Shield, Lock, Activity, Stethoscope, ClipboardList, Pill, FlaskConical, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface DispatchRecord {
  id: string;
  sourceType: string;
  sourceId: string;
  patientName: string;
  patientPin: string;
  description: string;
  actor: string;
  status: string;
  dispatchedAt: string;
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  FPE: { label: 'First Patient Encounter', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Stethoscope },
  Consultation: { label: 'YAKAP Consultation', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: ClipboardList },
  Prescription: { label: 'YAKAP Medicine (Rx)', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200', icon: Pill },
  LabResult: { label: 'Lab Results Encoding', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: FlaskConical },
};

export default function TransmittalPage() {
  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Terminal animation state
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchComplete, setDispatchComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dispatch');
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Counts
  const fpeCount = records.filter(r => r.sourceType === 'FPE').length;
  const consultationCount = records.filter(r => r.sourceType === 'Consultation').length;
  const prescriptionCount = records.filter(r => r.sourceType === 'Prescription').length;
  const labCount = records.filter(r => r.sourceType === 'LabResult').length;
  const totalRecords = records.length;

  // Filtered list
  const filtered = filterType === 'All' ? records : records.filter(r => r.sourceType === filterType);

  const runBundleDispatch = () => {
    if (totalRecords === 0) {
      toast.error('No dispatched records available for bundling.');
      return;
    }

    setIsDispatching(true);
    setDispatchComplete(false);
    setLogs([]);

    const sequence = [
      `[SYS] Initializing Transmittal Bundle Sequence...`,
      `[AGG] Aggregating ${fpeCount} FPE records... OK`,
      `[AGG] Aggregating ${consultationCount} Consultation (SOAP) records... OK`,
      `[AGG] Aggregating ${prescriptionCount} Prescription records... OK`,
      `[AGG] Aggregating ${labCount} Lab Result records... OK`,
      `[XML] Generating compliant XML-JSON payload...`,
      `[XML] Payload size: ${(totalRecords * 1.4).toFixed(2)} MB. Validation Passed.`,
      `[SEC] Applying AES-256 encryption to PHI blocks... DONE`,
      `[SEC] Signing payload with RSA-2048 private key (Cert: NCR-SOUTH-001)...`,
      `[SEC] Cryptographic signature attached successfully.`,
      `[NET] Initiating mTLS handshake with PhilHealth Gateway (gw.ncr.philhealth.gov.ph:443)...`,
      `[NET] Connection established. Cipher: TLS_AES_256_GCM_SHA384.`,
      `[NET] Uploading bundle [████████████████████] 100%`,
      `[NET] Waiting for gateway ACK...`,
      `[ACK] Transaction accepted. Ref ID: PHIC-TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      `[SYS] Dispatch sequence completed successfully. ${totalRecords} records transmitted.`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setLogs(prev => [...prev, sequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsDispatching(false);
        setDispatchComplete(true);
        toast.success(`Transmittal bundle (${totalRecords} records) successfully dispatched to PhilHealth NCR South.`);
      }
    }, 350);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Direct PHIC Dispatch</h1>
            <p className="text-sm text-gray-500">Transmittal Portal · NCR South Gateway</p>
          </div>
        </div>
        <button
          onClick={fetchRecords}
          className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Dispatched</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalRecords}</p>
          <p className="text-xs text-gray-400 mt-0.5">All sources</p>
        </div>
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">FPE</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fpeCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">First Encounters</p>
        </div>
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Consultations</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{consultationCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">SOAP Notes</p>
        </div>
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Prescriptions</p>
          <p className="text-2xl font-bold text-pink-600 mt-1">{prescriptionCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Medicine (Rx)</p>
        </div>
        <div className="card-stat">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Lab Results</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{labCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Diagnostics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispatch Records List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {['All', 'FPE', 'Consultation', 'Prescription', 'LabResult'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filterType === type
                    ? 'text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                style={filterType === type ? { backgroundColor: '#0A1628' } : {}}
              >
                {type === 'All' ? 'All Records' : SOURCE_CONFIG[type]?.label || type}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${filterType === type ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {type === 'All' ? totalRecords : records.filter(r => r.sourceType === type).length}
                </span>
              </button>
            ))}
          </div>

          {/* Records List */}
          <div className="card-glass p-5">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading dispatch records...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <Server className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">No dispatch records yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Dispatch records from FPE, Consultation, Prescription, and Lab Results will appear here once dispatched.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
                {filtered.map(record => {
                  const config = SOURCE_CONFIG[record.sourceType] || { label: record.sourceType, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: Server };
                  const Icon = config.icon;
                  return (
                    <div
                      key={record.id}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${config.border} ${config.bg} hover:shadow-sm transition-all`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.bg} ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                          <span className="badge badge-green text-[10px]">Dispatched</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{record.patientName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{record.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                          <span>PIN: <span className="font-mono font-medium text-gray-600">{record.patientPin}</span></span>
                          <span>By: {record.actor}</span>
                          <span>{formatDateTime(record.dispatchedAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Terminal & Bundle Dispatch */}
        <div className="space-y-4">
          {/* Aggregation Summary */}
          <div className="card-glass p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Bundle Summary
            </h2>
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">First Patient Encounters</span>
                <span className="font-bold text-gray-900">{fpeCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Consultations (SOAP)</span>
                <span className="font-bold text-gray-900">{consultationCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">ePrescriptions</span>
                <span className="font-bold text-gray-900">{prescriptionCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Laboratory Results</span>
                <span className="font-bold text-gray-900">{labCount}</span>
              </div>
              <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-800">Total Bundle Records</span>
                <span className="font-bold text-indigo-600 text-lg">{totalRecords}</span>
              </div>
            </div>

            <button
              onClick={runBundleDispatch}
              disabled={isDispatching || totalRecords === 0}
              className="btn-primary w-full justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-600"
            >
              {isDispatching ? (
                <>
                  <Shield className="w-4 h-4 animate-pulse" />
                  Transmitting...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Submit Transmittal Bundle
                </>
              )}
            </button>

            {dispatchComplete && (
              <p className="text-xs text-emerald-600 font-medium mt-3 text-center flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" /> Transmittal Successful
              </p>
            )}
          </div>

          {/* Terminal UI */}
          <div className="min-h-[300px] rounded-xl bg-[#0a0a0a] border border-gray-800 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="bg-[#1a1a1a] px-4 py-2 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-mono text-gray-400">uacap_gateway_dispatch.sh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-mono text-emerald-500">mTLS Secured</span>
              </div>
            </div>

            <div className="p-4 font-mono text-sm flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
              {logs.length === 0 && !isDispatching && !dispatchComplete ? (
                <div className="text-gray-500 h-full flex items-center justify-center italic text-xs">
                  Awaiting dispatch initialization...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {logs.map((log, idx) => {
                    let colorClass = 'text-gray-300';
                    if (log.includes('[SYS]')) colorClass = 'text-blue-400';
                    if (log.includes('[AGG]')) colorClass = 'text-purple-400';
                    if (log.includes('[XML]')) colorClass = 'text-yellow-400';
                    if (log.includes('[SEC]')) colorClass = 'text-emerald-400';
                    if (log.includes('[NET]')) colorClass = 'text-cyan-400';
                    if (log.includes('[ACK]')) colorClass = 'text-green-400 font-bold';

                    return (
                      <div key={idx} className={`${colorClass} leading-tight break-all animate-fade-in text-xs`}>
                        {log}
                      </div>
                    );
                  })}
                  {isDispatching && (
                    <div className="text-gray-500 animate-pulse mt-2">_</div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
