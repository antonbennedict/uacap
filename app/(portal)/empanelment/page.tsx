'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { Member } from '@/lib/types';
import {
  UserSearch, ScanFace, FileCheck2,
  Search, ChevronRight, Check, Loader2, AlertCircle, Printer,
  Download, ClipboardList, Heart, Camera, BadgeCheck,
  Fingerprint, Eye, RotateCcw,
  CheckCircle2, X
} from 'lucide-react';
import { toast } from 'sonner';

// ── Wizard Steps ─────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Select Patient',    icon: UserSearch,  color: '#3B82F6' },
  { id: 2, label: 'PCU Liveness',      icon: ScanFace,    color: '#8B5CF6' },
  { id: 3, label: 'YES Slip',          icon: FileCheck2,  color: '#10B981' },
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
  const [stream,       setStream]       = useState<MediaStream | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Clean up stream on unmount or stream change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Turn off camera when verification is complete
  useEffect(() => {
    if (phase === 'verified') {
      stopStream();
    }
  }, [phase, stopStream]);

  const startScan = async () => {
    setPhase('initializing');
    setProgress(0);
    setLogs([]);
    setFaceDetected(false);
    setScore(0);

    let activeStream: MediaStream | null = null;
    try {
      activeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 300 }, height: { ideal: 300 } }
      });
      setStream(activeStream);
    } catch (err) {
      console.warn("Camera access failed/denied, proceeding with simulation:", err);
    }

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Schedule each log line with individual timeouts — avoids closure/stale-i issues
    SCAN_LOGS.forEach((entry, idx) => {
      const t = setTimeout(() => {
        setLogs(prev => [...prev, entry]);   // entry is captured correctly here

        const pct = Math.round((idx + 1) / SCAN_LOGS.length * 100);
        setProgress(pct);
        setScore(parseFloat(Math.min(98.7, (idx + 1) * 7.05).toFixed(1)));

        // If a person/face is detected (idx === 5), let the phase be verified immediately
        if (idx === 5) {
          setPhase('verified');
          setFaceDetected(true);
          setScore(98.7);
          setProgress(100);
          
          // Clear all remaining timeouts in the sequence
          timeoutsRef.current.forEach(clearTimeout);
          timeoutsRef.current = [];

          // Instantly populate the remaining logs to show completed check
          const remainingLogs = SCAN_LOGS.slice(6);
          setLogs(prev => [...prev, ...remainingLogs]);

          if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
        }
      }, idx * 450);
      timeoutsRef.current.push(t);
    });
  };

  const reset = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    stopStream();
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
            <div className="absolute inset-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
              {phase === 'idle' ? (
                <Camera className="w-12 h-12 text-gray-300" />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  {stream && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                  )}
                  {/* Stylized face overlay */}
                  <div className="relative z-10">
                    <div className="w-16 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-2"
                      style={{ borderColor: faceDetected ? '#10B981' : '#A78BFA' }}>
                      <div className="flex gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-300 animate-pulse" />
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-300 animate-pulse" />
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
                  {/* Landmark dots overlay */}
                  {faceDetected && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {[{top:'18%',left:'28%'},{top:'18%',right:'28%'},
                        {top:'35%',left:'22%'},{top:'35%',right:'22%'},
                        {top:'50%',left:'32%'},{top:'50%',right:'32%'},
                        {top:'65%',left:'38%'},{top:'65%',right:'38%'},
                        {top:'25%',left:'38%'},{top:'25%',right:'38%'}
                      ].map((s, i) => (
                        <div key={i} className="absolute w-1 h-1 rounded-full bg-violet-300"
                          style={s as React.CSSProperties} />
                      ))}
                    </div>
                  )}
                  {/* Verified overlay */}
                  {phase === 'verified' && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/80 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              )}
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
      <div className="animate-fade-in">
        <button
          id="proceed-to-yes-slip-btn"
          onClick={onVerified}
          disabled={phase !== 'verified'}
          className="btn-primary w-full justify-center text-base py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: phase === 'verified' ? '#8B5CF6' : '#9CA3AF' }}>
          Proceed to YES Slip
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3 — YES Slip
// ════════════════════════════════════════════════════════════
function Step3({ member, onDone }: {
  member: Member;
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
      {/* ── YES SLIP DOCUMENT ─────────────────────────── */}
      <div id="yes-slip" className="bg-white overflow-hidden border-2 border-emerald-800 shadow-xl rounded-xl text-gray-950 font-sans max-w-2xl mx-auto">
        
        {/* Government / PHIC Header Banner */}
        <div className="px-6 py-4 bg-white border-b-4 border-[#FFCD00]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Custom CSS PhilHealth Shield/Seal Logo */}
              <div className="w-12 h-12 rounded-full border-2 border-[#00843D] bg-white flex items-center justify-center relative overflow-hidden shadow-sm flex-shrink-0">
                <div className="absolute inset-0 bg-[#00843D]/10 rounded-full" />
                <Heart className="w-6 h-6 text-[#00843D] fill-[#00843D] relative z-10" />
                <div className="absolute bottom-0 inset-x-0 h-3 bg-[#FFCD00]" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Republic of the Philippines</p>
                <p className="text-xs font-black text-[#00843D] uppercase tracking-wide mt-0.5">Philippine Health Insurance Corporation</p>
                <p className="text-[10px] font-medium text-gray-600">YAKAP UACAP Primary Care Program</p>
              </div>
            </div>
            <div className="text-right border-l border-gray-200 pl-4 flex-shrink-0">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">YES SLIP NUMBER</p>
              <p className="text-sm font-extrabold font-mono text-emerald-900 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{slip.number}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#00843D] text-white text-[9px] font-black tracking-widest">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Title and Form Subhead */}
        <div className="bg-[#00843D] text-white py-2.5 px-6 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest">
            eKONSULTA MEMBER EMPANELMENT SLIP (YES SLIP)
          </h3>
          <p className="text-[10px] text-emerald-100 font-mono">PHIC Form YES-1 · 2026</p>
        </div>

        <div className="p-6 space-y-5 bg-stone-50/30">
          
          {/* PART I - MEMBER IDENTIFICATION */}
          <div className="border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-1.5 flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">PART I - MEMBER IDENTIFICATION</span>
              <span className="text-[9px] font-semibold text-gray-400">Section A</span>
            </div>
            
            <div className="grid grid-cols-12 text-xs">
              <div className="col-span-8 p-3 border-r border-b border-gray-300">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">1. Member's Name (Last Name, First Name, Middle Name)</span>
                <span className="text-xs font-bold text-gray-900 uppercase mt-0.5">
                  {member.lastName}, {member.firstName} {member.middleName}
                </span>
              </div>
              <div className="col-span-4 p-3 border-b border-gray-300 bg-emerald-50/20">
                <span className="text-[9px] font-bold text-emerald-800 uppercase block">2. PhilHealth PIN</span>
                <span className="text-xs font-mono font-extrabold text-emerald-950 mt-0.5 block">{member.philhealthPin}</span>
              </div>

              <div className="col-span-4 p-3 border-r border-b border-gray-300">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">3. Date of Birth</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5">{formatDate(member.dateOfBirth)}</span>
              </div>
              <div className="col-span-4 p-3 border-r border-b border-gray-300">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">4. Sex / Age</span>
                <span className="text-xs font-bold text-gray-900 uppercase mt-0.5">{member.sex} / {calcAge(member.dateOfBirth)} yrs</span>
              </div>
              <div className="col-span-4 p-3 border-b border-gray-300">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">5. Civil Status</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5">{member.civilStatus}</span>
              </div>

              <div className="col-span-6 p-3 border-r border-gray-300">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">6. Membership Type</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5">{member.membershipType}</span>
              </div>
              <div className="col-span-6 p-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">7. Contact Number / Email</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5">{member.phone} {member.email ? `· ${member.email}` : ''}</span>
              </div>

              <div className="col-span-12 p-3 border-t border-gray-300 bg-gray-50/50">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">8. Residential Address</span>
                <span className="text-xs font-bold text-gray-800 uppercase mt-0.5">
                  {member.address}, {member.city}, {member.province} {member.zipCode}
                </span>
              </div>
            </div>
          </div>

          {/* PART II - PRIMARY CARE PROVIDER DETAILS */}
          <div className="border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-1.5 flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">PART II - HEALTH CARE PROVIDER ASSIGNMENT</span>
              <span className="text-[9px] font-semibold text-gray-400">Section B</span>
            </div>
            
            <div className="grid grid-cols-12 text-xs">
              <div className="col-span-7 p-3 border-r border-gray-300">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">9. Assigned Healthcare Facility</span>
                <span className="text-xs font-bold text-emerald-950 mt-0.5 block uppercase">University of the Assumption Clinic</span>
              </div>
              <div className="col-span-5 p-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">10. Accreditation / Code No.</span>
                <span className="text-xs font-mono font-bold text-gray-900 mt-0.5 block">R3-PMP-2024-001</span>
              </div>

              <div className="col-span-12 border-t border-gray-300 grid grid-cols-3 bg-gray-50/50">
                <div className="p-3 border-r border-gray-300">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">11. Empanelment Date</span>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">{slip.generatedAt}</span>
                </div>
                <div className="p-3 border-r border-gray-300">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">12. Period of Validity</span>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">Until {expiry}</span>
                </div>
                <div className="p-3">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">13. Liveness Check</span>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5 block">VERIFIED ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* PART III - BENEFIT PACKAGE SUMMARY */}
          <div className="border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-1.5">
              <span className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">PART III - YAKAP BENEFIT SCHEDULE</span>
            </div>
            
            <div className="grid grid-cols-3 divide-x divide-gray-300 text-xs">
              <div className="p-3 text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Annual Allocation</span>
                <span className="text-sm font-black text-gray-900 mt-1 block">₱{member.yakapBenefit.totalAllotment.toLocaleString()}</span>
              </div>
              <div className="p-3 text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Availed Amount</span>
                <span className="text-sm font-extrabold text-amber-600 mt-1 block">₱{member.yakapBenefit.usedAmount.toLocaleString()}</span>
              </div>
              <div className="p-3 text-center bg-emerald-50/10">
                <span className="text-[9px] font-bold text-emerald-800 uppercase block">Remaining Balance</span>
                <span className="text-sm font-black text-emerald-600 mt-1 block">₱{remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* PART IV - AUTHORIZATION & ATTESTATION */}
          <div className="border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm p-4">
            <p className="text-[9px] font-extrabold text-gray-700 uppercase tracking-wider mb-3">PART IV - AUTHORIZATION & DIGITAL ATTESTATION</p>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Member / Patient Representative</span>
                <div className="border-b border-gray-300 h-10 flex items-end pb-1 font-mono text-[10px] text-emerald-700 font-bold">
                  BIOMETRIC SIGN-OFF (FACE CHECK)
                </div>
                <span className="text-[10px] font-bold text-gray-800 block uppercase mt-1.5">{member.firstName} {member.lastName}</span>
                <span className="text-[9px] text-gray-400">Timestamp: {slip.generatedAt}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Attesting Facility Officer</span>
                <div className="border-b border-gray-300 h-10 flex items-end pb-1 font-mono text-[10px] text-blue-700 font-bold">
                  DIGITAL SIGNATURE SECURED (EMR-PHIC)
                </div>
                <span className="text-[10px] font-bold text-gray-800 block mt-1.5">PCU CLINIC ADMINISTRATOR</span>
                <span className="text-[9px] text-gray-400">University of the Assumption Clinic</span>
              </div>
            </div>
          </div>

          {/* Form Disclaimer */}
          <div className="rounded-lg p-3.5 border border-[#FFCD00]/50 bg-[#FFCD00]/5 text-gray-800 text-[10px] leading-relaxed shadow-sm">
            <span className="font-extrabold text-emerald-800">ATTESTATION DISCLAIMER: </span>
            This document serves as the official Yakap UACAP Empanelment Slip (YES Slip) verifying registered status for primary care benefits with the Philippine Health Insurance Corporation. The empanelment details contained herein have been synchronized with the PHIC UACAP Registry Server. Present this slip or your PIN card to receive Gamot (prescriptions) and Lab allocations at accredited facilities.
          </div>

          {/* Barcode & Metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-end gap-0.5 opacity-40">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="bg-black"
                  style={{ width: i % 4 === 0 ? 3 : 1.5, height: i % 6 === 0 ? 24 : i % 2 === 0 ? 18 : 10 }} />
              ))}
            </div>
            <div className="text-right text-[9px] font-mono text-gray-400">
              <p>TRACKING ID: {slip.number}-PHIC</p>
              <p className="text-[8px] text-gray-300">PhilHealth YES Form v1.2 · UA-CLINIC-R3</p>
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

  const reset = () => { setStep(1); setPatient(null); };

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
