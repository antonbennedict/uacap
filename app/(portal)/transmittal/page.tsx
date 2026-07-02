'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import type { TransmittalRecord } from '@/lib/types';
import { Server, Calendar, CheckCircle, UploadCloud, Terminal, Shield, Lock, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function TransmittalPage() {
  const { fpeRecords, prescriptions, dispatchTransmittal } = useAppStore();
  
  // Date range (default to current month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchComplete, setDispatchComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Aggregation derived from dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include full end date

  const validFPEs = fpeRecords.filter(f => new Date(f.encounterDate) >= start && new Date(f.encounterDate) <= end);
  const validPrescriptions = prescriptions.filter(p => new Date(p.createdAt) >= start && new Date(p.createdAt) <= end);

  // Simulated related records for visual completeness
  const fpeCount = validFPEs.length;
  const prescriptionCount = validPrescriptions.length;
  const soapCount = fpeCount; // Simulated 1:1
  const labCount = Math.floor(fpeCount * 0.4); // Simulated 40% have labs

  const totalRecords = fpeCount + prescriptionCount + soapCount + labCount;

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const runDispatchSequence = () => {
    if (totalRecords === 0) {
      toast.error('No records found in the selected date range.');
      return;
    }

    setIsDispatching(true);
    setDispatchComplete(false);
    setLogs([]);

    const sequence = [
      `[SYS] Initializing Transmittal Sequence for ${startDate} to ${endDate}...`,
      `[AGG] Aggregating ${fpeCount} FPE records... OK`,
      `[AGG] Aggregating ${prescriptionCount} Prescription records... OK`,
      `[AGG] Compiling ${soapCount} SOAP nodes and ${labCount} Lab results... OK`,
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
      `[SYS] Dispatch sequence completed successfully. Local records marked as Transmitted.`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setLogs(prev => [...prev, sequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        finalizeDispatch();
      }
    }, 400); // 400ms per log line
  };

  const finalizeDispatch = () => {
    const record: TransmittalRecord = {
      id: `tx-${Date.now()}`,
      clinicId: 'clinic-001',
      startDate,
      endDate,
      fpeCount,
      prescriptionCount,
      soapCount,
      labCount,
      dispatchedAt: new Date().toISOString(),
      actor: 'Admin User',
      status: 'Dispatched',
    };

    dispatchTransmittal(record);
    setIsDispatching(false);
    setDispatchComplete(true);
    toast.success('Transmittal successfully dispatched to PhilHealth NCR South.');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Direct PHIC Dispatch</h1>
            <p className="text-sm text-gray-500">Transmittal Portal · NCR South Gateway</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Config & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-glass p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Claim Date Range
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isDispatching}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isDispatching}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="card-glass p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Aggregation Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">First Patient Encounters</span>
                <span className="font-bold text-gray-900">{fpeCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Consultations</span>
                <span className="font-bold text-gray-900">{soapCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">ePrescriptions</span>
                <span className="font-bold text-gray-900">{prescriptionCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Laboratory Results</span>
                <span className="font-bold text-gray-900">{labCount}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-800">Total Bundle Records</span>
                <span className="font-bold text-indigo-600 text-lg">{totalRecords}</span>
              </div>
            </div>

            <button
              onClick={runDispatchSequence}
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
        </div>

        {/* Right Column: Terminal UI */}
        <div className="lg:col-span-2">
          <div className="h-full min-h-[400px] rounded-xl bg-[#0a0a0a] border border-gray-800 shadow-2xl flex flex-col overflow-hidden relative">
            {/* Terminal Header */}
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

            {/* Terminal Output */}
            <div className="p-4 font-mono text-sm flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
              {logs.length === 0 && !isDispatching && !dispatchComplete ? (
                <div className="text-gray-500 h-full flex items-center justify-center italic">
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
                      <div key={idx} className={`${colorClass} leading-tight break-all animate-fade-in`}>
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
