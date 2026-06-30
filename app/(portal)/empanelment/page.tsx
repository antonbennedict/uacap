'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { Member } from '@/lib/types';
import {
  UserSearch, ScanFace, ShieldCheck, FileCheck2,
  Search, ChevronRight, Check, Loader2, AlertCircle, Printer,
  Download, ClipboardList, Heart, Camera, BadgeCheck,
  Fingerprint, Eye, PenLine, Eraser, RotateCcw,
  CheckCircle2, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';

// ── Wizard Steps ─────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Select Patient',    icon: UserSearch,  color: '#3B82F6' },
  { id: 2, label: 'PCU Liveness',      icon: ScanFace,    color: '#8B5CF6' },
  { id: 3, label: 'Informed Consent',  icon: ShieldCheck, color: '#F59E0B' },
  { id: 4, label: 'YES Slip',          icon: FileCheck2,  color: '#10B981' },
];

// ── Consent Items ────────────────────────────────────────────
const CONSENT_ITEMS = [
  {
    id: 'c1',
    title: 'PhilHealth Data Privacy Consent',
    text: 'I hereby consent to the collection, use, and processing of my personal and health information by PhilHealth and its accredited health care institutions (HCIs) in accordance with the Data Privacy Act of 2012 (R.A. 10173) for the purposes of health insurance benefits administration, claims processing, and healthcare service delivery.',
  },
  {
    id: 'c2',
    title: 'YAKAP Program Enrollment',
    text: 'I voluntarily enroll in the YAKAP (Your All-around Kumprehensibong Alaga ng Pamilya) Program and agree to receive primary care services, preventive health interventions, and wellness monitoring from my designated Primary Care Unit (PCU). I understand that my health data may be shared among program-accredited facilities for continuity of care.',
  },
  {
    id: 'c3',
    title: 'eKonsulta Digital Records Authorization',
    text: 'I authorize the designated PCU to maintain digital health records through the eKonsulta EMR system, including SOAP notes, laboratory results, prescriptions, and diagnostic findings. I understand these records are confidential and protected under applicable Philippine laws.',
  },
  {
    id: 'c4',
    title: 'Biometric Verification Consent',
    text: 'I consent to biometric identity verification (facial recognition or fingerprint scan) as part of the PCU liveness check during each consultation visit. This ensures accurate patient identification and prevents fraudulent benefit claims.',
  },
  {
    id: 'c5',
    title: 'Terms & Conditions Acknowledgment',
    text: 'I have read, understood, and agree to all terms and conditions of the YAKAP eKonsulta Primary Care Benefit program. I understand that misrepresentation of my identity or health information may result in disqualification from benefits and applicable legal consequences.',
  },
];

// ── Scan log entries ─────────────────────────────────────────
const SCAN_LOGS: string[] = [
  '[CAM] Initializing camera module...',
  '[AI] Loading facial recognition model v3.2...',
  '[AI] PhilHealth Liveness Detection Engine ready',
  '[SCAN] Capturing video stream at 30fps...',
  '[AI] Detecting face landmarks...',
  '[AI] Face detected — 68 landmark points mapped',
  '[LIVE] Running anti-spoofing check (depth analysis)...',
  '[LIVE] Blink detection: PASS ✓',
  '[LIVE] Head movement analysis: PASS ✓',
  '[LIVE] Texture liveness check: PASS ✓',
  '[BIOM] Generating facial biometric template...',
  '[MATCH] Comparing against PhilHealth registry...',
  '[MATCH] Identity confirmed — confidence: 98.7%',
  '[SYS] Liveness verification COMPLETE ✓',
];

// ── Helpers ──────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}
function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}
function nowString() {
  return new Date().toLocaleString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function genSlipNo() {
  return `YES-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
}

// ════════════════════════════════════════════════════════════
// Step Indicator
// ════════════════════════════════════════════════════════════
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const done   = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: done ? '#10B981' : active ? s.color : '#E5E7EB',
                  boxShadow: active ? `0 0 0 4px ${s.color}33` : 'none',
                }}
              >
                {done
                  ? <Check className="w-5 h-5 text-white" />
                  : <Icon className="w-5 h-5" style={{ color: active ? '#fff' : '#9CA3AF' }} />
                }
              </div>
              <span className="text-xs font-semibold whitespace-nowrap"
                style={{ color: done ? '#10B981' : active ? s.color : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="w-16 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300"
                style={{ background: done ? '#10B981' : '#E5E7EB' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 1 — Select Patient
// ════════════════════════════════════════════════════════════
function Step1({
  onSelect,
}: {
  onSelect: (m: Member) => void;
}) {
  const { members } = useAppStore();
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [picked,   setPicked]   = useState<Member | null>(null);

  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) { toast.error('Enter a PhilHealth PIN or name.'); return; }
    setLoading(true); setSearched(false); setPicked(null);
    await new Promise(r => setTimeout(r, 600));
    const lower = q.toLowerCase();
    const found = members.filter(m => {
      const full = `${m.firstName} ${m.middleName} ${m.lastName}`.toLowerCase();
      return full.includes(lower) || m.philhealthPin.toLowerCase().includes(lower);
    });
    setResults(found);
    setSearched(true);
    setLoading(false);
    if (!found.length) toast.warning('No members found.');
    else toast.success(`${found.length} member(s) found.`);
  }, [query, members]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
          <UserSearch className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Select Patient for Empanelment</h2>
        <p className="text-sm text-gray-500 mt-1">Search by PhilHealth PIN, first name, or last name</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="empanelment-search"
            className="form-input pl-9"
            placeholder="e.g. 09-123456789-0 or Juan Dela Cruz"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
          />
        </div>
        <button id="empanelment-search-btn"
          onClick={doSearch}
          disabled={loading}
          className="btn-primary px-5 disabled:opacity-50"
          style={{ background: '#3B82F6' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-2 animate-fade-in">
          {results.length === 0
            ? (
              <div className="card-glass p-8 text-center">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No matching members found</p>
              </div>
            )
            : results.map(m => (
              <button key={m.id}
                id={`patient-option-${m.id}`}
                onClick={() => setPicked(m)}
                className={`w-full text-left card-glass p-4 border-2 transition-all duration-200 hover:shadow-md ${
                  picked?.id === m.id ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'
                }`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                    {m.firstName[0]}{m.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {m.lastName}, {m.firstName} {m.middleName}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{m.philhealthPin}</p>
                    <p className="text-xs text-gray-400">{m.membershipType} · {m.address}, {m.city}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`badge text-xs ${m.membershipStatus === 'Active' ? 'badge-green' : 'badge-red'}`}>
                      {m.membershipStatus}
                    </span>
                    <span className="text-xs text-gray-400">{calcAge(m.dateOfBirth)} yrs · {m.sex}</span>
                  </div>
                  {picked?.id === m.id && <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                </div>
              </button>
            ))
          }
        </div>
      )}

      {/* Proceed */}
      {picked && (
        <div className="animate-fade-in space-y-3">
          <div className="card-glass p-4 border border-blue-200 bg-blue-50/40 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">{picked.firstName} {picked.lastName}</p>
              <p className="text-xs text-blue-600 font-mono">{picked.philhealthPin}</p>
            </div>
          </div>
          <button
            id="proceed-to-liveness-btn"
            onClick={() => onSelect(picked)}
            className="btn-primary w-full justify-center text-base py-3"
            style={{ background: '#3B82F6' }}>
            Proceed to PCU Liveness Verification
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 2 — PCU Liveness / Face Scan
// ════════════════════════════════════════════════════════════
type LivenessPhase = 'idle' | 'initializing' | 'scanning' | 'processing' | 'verified';

function Step2({ member, onVerified }: { member: Member; onVerified: () => void }) {
  const [phase,        setPhase]        = useState<LivenessPhase>('idle');
  const [progress,     setProgress]     = useState(0);
  const [logs,         setLogs]         = useState<string[]>([]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [score,        setScore]        = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Clean up on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const startScan = () => {
    setPhase('initializing');
    setProgress(0);
    setLogs([]);
    setFaceDetected(false);
    setScore(0);

    // Schedule each log line with individual timeouts — avoids closure/stale-i issues
    SCAN_LOGS.forEach((entry, idx) => {
      timerRef.current = setTimeout(() => {
        setLogs(prev => [...prev, entry]);   // entry is captured correctly here

        const pct = Math.round((idx + 1) / SCAN_LOGS.length * 100);
        setProgress(pct);
        setScore(parseFloat(Math.min(98.7, (idx + 1) * 7.05).toFixed(1)));

        if (idx === 4) { setPhase('scanning'); setFaceDetected(true); }
        if (idx === 9) setPhase('processing');
        if (idx === SCAN_LOGS.length - 1) {
          setPhase('verified');
          setScore(98.7);
          setProgress(100);
        }
      }, idx * 450);
    });
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('idle'); setProgress(0); setLogs([]); setFaceDetected(false); setScore(0);
  };

  const ringColor  = phase === 'verified' ? '#10B981' : phase !== 'idle' ? '#8B5CF6' : '#D1D5DB';
  const ringPulse  = (phase === 'scanning' || phase === 'processing') ? 'animate-pulse' : '';
  const logColor   = (l: string) =>
    l.startsWith('[CAM]')  ? 'text-blue-400'   :
    l.startsWith('[AI]')   ? 'text-violet-400'  :
    l.startsWith('[SCAN]') ? 'text-cyan-400'    :
    l.startsWith('[LIVE]') ? 'text-yellow-400'  :
    l.startsWith('[BIOM]') ? 'text-pink-400'    :
    l.startsWith('[MATCH]')? 'text-emerald-400' :
    l.startsWith('[SYS]')  ? 'text-emerald-300' :
    'text-gray-300';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
          <ScanFace className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">PCU Liveness Verification</h2>
        <p className="text-sm text-gray-500 mt-1">
          Patient: <span className="font-semibold text-gray-700">{member.firstName} {member.lastName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Camera viewport card */}
        <div className="card-glass p-5 flex flex-col items-center gap-4">
          {/* Face ring */}
          <div className="relative w-48 h-48">
            <div className={`absolute inset-0 rounded-full border-4 transition-all duration-500 ${ringPulse}`}
              style={{ borderColor: ringColor }} />
            {/* Corner brackets */}
            {(['tl','tr','bl','br'] as const).map(p => (
              <div key={p} className="absolute w-7 h-7" style={{
                top:    p.startsWith('t') ? 2 : undefined, bottom: p.startsWith('b') ? 2 : undefined,
                left:   p.endsWith('l')   ? 2 : undefined, right:  p.endsWith('r')   ? 2 : undefined,
                borderTop:    p.startsWith('t') ? `3px solid ${ringColor}` : undefined,
                borderBottom: p.startsWith('b') ? `3px solid ${ringColor}` : undefined,
                borderLeft:   p.endsWith('l')   ? `3px solid ${ringColor}` : undefined,
                borderRight:  p.endsWith('r')   ? `3px solid ${ringColor}` : undefined,
                borderRadius: p === 'tl' ? '4px 0 0 0' : p === 'tr' ? '0 4px 0 0'
                            : p === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
              }} />
            ))}
            {/* Face display */}
            <div className="absolute inset-4 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: phase === 'idle' ? '#F3F4F6' : 'linear-gradient(180deg,#1e1b4b,#2e1065)' }}>
              {phase === 'idle'
                ? <Camera className="w-12 h-12 text-gray-300" />
                : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Stylized face */}
                    <div className="relative">
                      <div className="w-16 h-20 rounded-full border-2 flex flex-col items-center justify-center gap-2"
                        style={{ borderColor: faceDetected ? '#A78BFA' : '#4B5563' }}>
                        <div className="flex gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-300" />
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-300" />
                        </div>
                        <div className="w-1 h-2 rounded-full bg-violet-400/50" />
                        <div className={`w-6 h-1.5 rounded-full ${phase === 'verified' ? 'bg-emerald-400' : 'bg-violet-300'}`} />
                      </div>
                      {/* Scan line */}
                      {(phase === 'scanning' || phase === 'processing') && (
                        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden rounded-full">
                          <div className="h-0.5 w-full animate-bounce"
                            style={{ background: '#A78BFA', marginTop: '50%', opacity: 0.8 }} />
                        </div>
                      )}
                    </div>
                    {/* Landmark dots */}
                    {faceDetected && (
                      <>
                        {[{top:'18%',left:'28%'},{top:'18%',right:'28%'},
                          {top:'35%',left:'22%'},{top:'35%',right:'22%'},
                          {top:'50%',left:'32%'},{top:'50%',right:'32%'},
                          {top:'65%',left:'38%'},{top:'65%',right:'38%'},
                          {top:'25%',left:'38%'},{top:'25%',right:'38%'}
                        ].map((s, i) => (
                          <div key={i} className="absolute w-1 h-1 rounded-full bg-violet-300"
                            style={s as React.CSSProperties} />
                        ))}
                      </>
                    )}
                    {/* Verified overlay */}
                    {phase === 'verified' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center">
                          <Check className="w-6 h-6 text-emerald-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          </div>

          {/* Score bar */}
          {phase !== 'idle' && (
            <div className="w-full animate-fade-in space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Liveness Score</span>
                <span className="font-bold" style={{ color: phase === 'verified' ? '#10B981' : '#8B5CF6' }}>
                  {score.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score}%`,
                    background: phase === 'verified'
                      ? '#10B981'
                      : 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                  }} />
              </div>
            </div>
          )}

          {/* Status pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              background: phase === 'verified'
                ? '#D1FAE5' : phase === 'idle' ? '#F3F4F6' : '#EDE9FE',
              color: phase === 'verified'
                ? '#065F46' : phase === 'idle' ? '#6B7280' : '#4C1D95',
            }}>
            {phase === 'idle'         && <><Camera     className="w-4 h-4" /> Ready to Scan</>}
            {phase === 'initializing' && <><Loader2    className="w-4 h-4 animate-spin" /> Initializing...</>}
            {phase === 'scanning'     && <><Eye        className="w-4 h-4 animate-pulse" /> Scanning face...</>}
            {phase === 'processing'   && <><Fingerprint className="w-4 h-4 animate-pulse" /> Processing biometrics...</>}
            {phase === 'verified'     && <><BadgeCheck className="w-4 h-4" /> Identity Verified</>}
          </div>

          {/* Buttons */}
          {phase === 'idle' && (
            <button id="start-face-scan-btn"
              onClick={startScan}
              className="btn-primary w-full justify-center"
              style={{ background: '#8B5CF6' }}>
              <ScanFace className="w-4 h-4" /> Start Face Scan
            </button>
          )}
          {phase === 'verified' && (
            <button onClick={reset} className="btn-secondary w-full justify-center">
              <RotateCcw className="w-4 h-4" /> Rescan
            </button>
          )}
        </div>

        {/* Terminal log */}
        <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0a0a0a] flex flex-col"
          style={{ minHeight: 320 }}>
          <div className="bg-[#1a1a1a] px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-gray-400 text-xs font-mono ml-1">liveness_scan.log</span>
            </div>
            {phase !== 'idle' && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${phase === 'verified' ? 'bg-emerald-400' : 'bg-green-400 animate-pulse'}`} />
                <span className={`text-xs font-mono ${phase === 'verified' ? 'text-emerald-400' : 'text-green-400'}`}>
                  {phase === 'verified' ? 'DONE' : 'LIVE'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1">
            {logs.length === 0
              ? <span className="text-gray-600 italic">Awaiting scan initiation...</span>
              : logs.map((entry, i) => (
                <div key={i} className={`leading-tight animate-fade-in ${logColor(entry)}`}>
                  {entry}
                </div>
              ))
            }
            {(phase === 'initializing' || phase === 'scanning' || phase === 'processing') && (
              <div className="text-gray-500 animate-pulse">_</div>
            )}
            <div ref={logEndRef} />
          </div>
          {phase !== 'idle' && (
            <div className="px-4 pb-3">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: phase === 'verified'
                      ? '#10B981'
                      : 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                  }} />
              </div>
              <p className="text-xs text-gray-600 font-mono mt-1">{progress}% complete</p>
            </div>
          )}
        </div>
      </div>

      {/* Proceed */}
      {phase === 'verified' && (
        <div className="animate-fade-in">
          <button
            id="proceed-to-consent-btn"
            onClick={onVerified}
            className="btn-primary w-full justify-center text-base py-3"
            style={{ background: '#8B5CF6' }}>
            Proceed to Informed Consent
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3 — Informed Consent + Signature Pad
// ════════════════════════════════════════════════════════════
function Step3({ member, onConsented }: { member: Member; onConsented: (sig: string) => void }) {
  const [checked,   setChecked]   = useState<Record<string, boolean>>({});
  const [signed,    setSigned]    = useState(false);
  const [sigDataUrl,setSigDataUrl] = useState('');
  const [hasDrawn,  setHasDrawn]  = useState(false);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isDrawing  = useRef(false);
  const lastPt     = useRef<{ x: number; y: number } | null>(null);

  const allChecked = CONSENT_ITEMS.every(c => checked[c.id]);

  // ── Canvas helpers ────────────────────────────────────────
  function getXY(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top)  * scaleY,
    };
  }

  function onPointerDown(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (signed) return;
    isDrawing.current = true;
    const pt = getXY(e);
    lastPt.current = pt;
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a5f';
    ctx.fill();
    setHasDrawn(true);
  }

  function onPointerMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!isDrawing.current || signed) return;
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const pt     = getXY(e);
    ctx.beginPath();
    ctx.moveTo(lastPt.current!.x, lastPt.current!.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPt.current = pt;
  }

  function onPointerUp() { isDrawing.current = false; lastPt.current = null; }

  function clearSig() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false); setSigned(false); setSigDataUrl('');
  }

  function confirmSig() {
    if (!hasDrawn) { toast.error('Please draw your signature first.'); return; }
    const url = canvasRef.current!.toDataURL('image/png');
    setSigDataUrl(url);
    setSigned(true);
    toast.success('Signature captured!');
  }

  function handleProceed() {
    if (!allChecked) { toast.error('Please check all consent items.'); return; }
    if (!signed)     { toast.error('Please sign before proceeding.'); return; }
    onConsented(sigDataUrl);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Informed Consent</h2>
        <p className="text-sm text-gray-500 mt-1">
          Patient: <span className="font-semibold text-gray-700">{member.firstName} {member.lastName}</span>
          {' '}· PIN: <span className="font-mono text-gray-600">{member.philhealthPin}</span>
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Consent items</span>
            <span className="font-semibold text-gray-700">
              {Object.values(checked).filter(Boolean).length} / {CONSENT_ITEMS.length}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(Object.values(checked).filter(Boolean).length / CONSENT_ITEMS.length) * 100}%`,
                background: allChecked ? '#F59E0B' : '#D97706',
              }} />
          </div>
        </div>
        {allChecked && (
          <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 animate-fade-in" />
        )}
      </div>

      {/* Consent items */}
      <div className="space-y-2.5">
        {CONSENT_ITEMS.map(item => (
          <div key={item.id}
            id={`consent-${item.id}`}
            className={`card-glass p-4 border-2 cursor-pointer transition-all duration-200 ${
              checked[item.id] ? 'border-amber-400 bg-amber-50/40' : 'border-transparent hover:border-gray-200'
            }`}
            onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))}>
            <div className="flex gap-3">
              <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                checked[item.id] ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'
              }`}>
                {checked[item.id] && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Signature pad */}
      <div className="card-glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Patient Signature</h3>
            {!hasDrawn && <span className="text-xs text-gray-400">— Draw your signature below</span>}
          </div>
          <div className="flex gap-2">
            {!signed ? (
              <>
                <button onClick={clearSig} id="clear-sig-btn"
                  className="btn-secondary text-xs py-1.5 px-3">
                  <Eraser className="w-3 h-3" /> Clear
                </button>
                <button onClick={confirmSig} id="confirm-sig-btn"
                  disabled={!hasDrawn}
                  className="btn-primary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#F59E0B' }}>
                  <Check className="w-3 h-3" /> Confirm
                </button>
              </>
            ) : (
              <button onClick={() => { setSigned(false); clearSig(); }}
                className="btn-secondary text-xs py-1.5 px-3">
                <RefreshCw className="w-3 h-3" /> Re-sign
              </button>
            )}
          </div>
        </div>

        <div className={`relative rounded-xl border-2 border-dashed overflow-hidden bg-gray-50 transition-colors ${
          signed ? 'border-amber-400 bg-amber-50/30' : 'border-gray-200'
        }`} style={{ height: 150 }}>
          <canvas
            ref={canvasRef}
            width={540}
            height={150}
            className="w-full h-full touch-none"
            style={{ cursor: signed ? 'default' : 'crosshair' }}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          />
          {!hasDrawn && !signed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-300 text-sm select-none">Sign here ✍</p>
            </div>
          )}
          {signed && (
            <div className="absolute bottom-2 right-2 pointer-events-none">
              <span className="badge badge-green text-xs">
                <Check className="w-3 h-3" /> Signed
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-2">
          By signing, <span className="font-semibold">{member.firstName} {member.lastName}</span> confirms
          understanding and agreement to all items above. Date: {nowString()}
        </p>
      </div>

      <button
        id="generate-yes-slip-btn"
        onClick={handleProceed}
        disabled={!allChecked || !signed}
        className="btn-primary w-full justify-center text-base py-3 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: allChecked && signed ? '#F59E0B' : undefined }}>
        <FileCheck2 className="w-5 h-5" />
        Generate YES Slip
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 4 — YES Slip
// ════════════════════════════════════════════════════════════
function Step4({ member, sigDataUrl, onDone }: {
  member: Member;
  sigDataUrl: string;
  onDone: () => void;
}) {
  // Generate slip details once on mount
  const slip = useRef({
    number:      genSlipNo(),
    generatedAt: nowString(),
  }).current;

  const expiry = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  })();

  const remaining = member.yakapBenefit.totalAllotment - member.yakapBenefit.usedAmount;

  function handlePrint() {
    window.print();
  }

  function handleSave() {
    toast.success('YES Slip saved to patient records successfully!');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Success header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <FileCheck2 className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Empanelment Complete!</h2>
        <p className="text-sm text-gray-500 mt-1">
          <span className="font-semibold text-emerald-700">{member.firstName} {member.lastName}</span> is now enrolled in YAKAP
        </p>
      </div>

      {/* ── YES SLIP DOCUMENT ─────────────────────────── */}
      <div id="yes-slip" className="card-glass overflow-hidden border border-gray-200 shadow-xl">
        {/* Green header */}
        <div className="px-7 py-5" style={{ background: 'linear-gradient(135deg, #00843D 0%, #005F2A 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart className="w-7 h-7 text-white fill-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">PhilHealth</p>
                <p className="text-white/80 text-sm">YAKAP eKonsulta Program</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-0.5">YES Slip No.</p>
              <p className="text-white font-bold text-lg font-mono tracking-wider">{slip.number}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-xs font-semibold">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Rainbow accent strip */}
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#00843D,#1D4ED8,#8B5CF6,#F59E0B,#EF4444)' }} />

        <div className="p-7 space-y-6">
          {/* Title */}
          <div className="text-center pb-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">
              YAKAP Empanelment Slip
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Your Empanelment Slip (YES) · Official Record of Primary Care Enrollment
            </p>
          </div>

          {/* Patient Information */}
          <section>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">
              Patient Information
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: 'Full Name',         value: `${member.firstName} ${member.middleName} ${member.lastName}${member.suffix ? ` ${member.suffix}` : ''}` },
                { label: 'PhilHealth PIN',    value: member.philhealthPin, mono: true },
                { label: 'Date of Birth',     value: formatDate(member.dateOfBirth) },
                { label: 'Age / Sex',         value: `${calcAge(member.dateOfBirth)} years · ${member.sex}` },
                { label: 'Civil Status',      value: member.civilStatus },
                { label: 'Membership Type',   value: member.membershipType },
                { label: 'Contact Number',    value: member.phone },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className={`text-sm font-semibold text-gray-900 ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-sm font-semibold text-gray-900">
                  {member.address}, {member.city}, {member.province} {member.zipCode}
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-dashed border-gray-200" />

          {/* Empanelment Details */}
          <section>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">
              Empanelment Details
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: 'Enrollment Date',       value: slip.generatedAt },
                { label: 'Valid Until',            value: expiry },
                { label: 'Liveness Verification', value: 'Completed ✓ (Confidence: 98.7%)' },
                { label: 'Biometric Template',    value: 'Registered ✓' },
                { label: 'Informed Consent',      value: 'Digitally Signed ✓' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{f.value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-400">Enrollment Status</p>
                <span className="badge badge-green text-xs">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              </div>
            </div>
          </section>

          <div className="border-t border-dashed border-gray-200" />

          {/* Benefits */}
          <section>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">
              YAKAP Benefit Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Annual Allotment',  value: `₱${member.yakapBenefit.totalAllotment.toLocaleString()}`, icon: '💰', bg: '#F0FDF4', border: '#BBF7D0' },
                { label: 'Used This Year',    value: `₱${member.yakapBenefit.usedAmount.toLocaleString()}`,     icon: '📊', bg: '#FEF3C7', border: '#FDE68A' },
                { label: 'Remaining Balance', value: `₱${remaining.toLocaleString()}`,                         icon: '✅', bg: '#EFF6FF', border: '#BFDBFE' },
              ].map(b => (
                <div key={b.label} className="rounded-xl p-3 text-center"
                  style={{ background: b.bg, border: `1px solid ${b.border}` }}>
                  <p className="text-xl mb-0.5">{b.icon}</p>
                  <p className="text-xs text-gray-500">{b.label}</p>
                  <p className="font-bold text-gray-900 text-sm">{b.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Consent summary */}
          <div className="rounded-xl p-4 border border-amber-100 bg-amber-50/50">
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider mb-2">
              Consent Items Acknowledged
            </p>
            <div className="space-y-1.5">
              {CONSENT_ITEMS.map(c => (
                <div key={c.id} className="flex items-start gap-2 text-xs text-amber-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{c.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signature block */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Patient Signature</p>
              {sigDataUrl && (
                <div className="border-b border-gray-400 pb-1 mb-1" style={{ minHeight: 64 }}>
                  <img src={sigDataUrl} alt="Patient Signature"
                    className="max-h-16 object-contain object-left w-full" />
                </div>
              )}
              <p className="text-xs font-semibold text-gray-800">{member.firstName} {member.lastName}</p>
              <p className="text-xs text-gray-400">{slip.generatedAt}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Authorized Clinic Officer</p>
              <div className="border-b border-gray-400 pb-1 mb-1" style={{ minHeight: 64 }}>
                <p className="text-xs text-gray-300 italic pt-8">Official Signature & Dry Seal</p>
              </div>
              <p className="text-xs font-semibold text-gray-800">PCU Clinic Administrator</p>
              <p className="text-xs text-gray-400">eKonsulta Accredited Facility</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl p-4 border border-blue-100 bg-blue-50/50">
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-bold">Important: </span>
              This YES Slip is official proof of YAKAP Primary Care enrollment. Present this document during
              every eKonsulta consultation. Benefits are non-transferable and subject to PhilHealth policies.
              For concerns, contact your registered PCU or PhilHealth at{' '}
              <span className="font-mono font-semibold">1-800-10-2273</span>.
            </p>
          </div>

          {/* Barcode decoration */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-end gap-px opacity-25">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-sm"
                  style={{ width: i % 3 === 0 ? 3 : 2, height: i % 5 === 0 ? 26 : i % 2 === 0 ? 18 : 12 }} />
              ))}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-mono">{slip.number}</p>
              <p className="text-xs text-gray-300">PhilHealth YAKAP YES v1.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 no-print">
        <button id="print-yes-slip-btn" onClick={handlePrint}
          className="btn-secondary justify-center">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button id="save-yes-slip-btn" onClick={handleSave}
          className="btn-secondary justify-center">
          <Download className="w-4 h-4" /> Save
        </button>
        <button id="done-empanelment-btn" onClick={onDone}
          className="btn-primary justify-center"
          style={{ background: '#10B981' }}>
          <Check className="w-4 h-4" /> Done
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN EMPANELMENT PAGE
// ════════════════════════════════════════════════════════════
export default function EmpanelmentPage() {
  const [step,      setStep]      = useState(1);
  const [patient,   setPatient]   = useState<Member | null>(null);
  const [sigDataUrl,setSigDataUrl] = useState('');

  const reset = () => { setStep(1); setPatient(null); setSigDataUrl(''); };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">YAKAP Empanelment</h1>
          <p className="text-sm text-gray-500">Primary Care Unit (PCU) Enrollment Wizard</p>
        </div>
        {step > 1 && (
          <button onClick={reset}
            className="btn-secondary text-xs py-1.5 px-3">
            <X className="w-3 h-3" /> Start Over
          </button>
        )}
      </div>

      {/* Step bar */}
      <StepIndicator current={step} />

      {/* Wizard panels */}
      <div className="animate-fade-in">
        {step === 1 && (
          <Step1
            onSelect={m => {
              setPatient(m);
              setStep(2);
              toast.success(`Patient selected: ${m.firstName} ${m.lastName}`);
            }}
          />
        )}
        {step === 2 && patient && (
          <Step2
            member={patient}
            onVerified={() => {
              setStep(3);
              toast.success('Liveness verification passed!');
            }}
          />
        )}
        {step === 3 && patient && (
          <Step3
            member={patient}
            onConsented={sig => {
              setSigDataUrl(sig);
              setStep(4);
              toast.success('Informed consent recorded!');
            }}
          />
        )}
        {step === 4 && patient && (
          <Step4
            member={patient}
            sigDataUrl={sigDataUrl}
            onDone={() => {
              reset();
              toast.success('Empanelment complete! Patient successfully enrolled in YAKAP.');
            }}
          />
        )}
      </div>
    </div>
  );
}
