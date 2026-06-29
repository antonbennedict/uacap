'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import membersData from '@/lib/data/members.json';
import type { Member, SOAPNote } from '@/lib/types';
import { ClipboardList, User, Search, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

const allMembers: Member[] = membersData as Member[];

const ICD10_CODES = [
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'I11.9', description: 'Hypertensive heart disease without heart failure' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'E11.65', description: 'Type 2 DM with hyperglycemia' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'K21.0', description: 'GERD with oesophagitis' },
  { code: 'K29.7', description: 'Gastritis, unspecified' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'M25.5', description: 'Pain in joint' },
  { code: 'J45.9', description: 'Asthma, unspecified' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'R51', description: 'Headache' },
  { code: 'R10.9', description: 'Unspecified abdominal pain' },
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'L30.9', description: 'Dermatitis, unspecified' },
  { code: 'H10.9', description: 'Conjunctivitis, unspecified' },
  { code: 'B34.9', description: 'Viral infection, unspecified' },
  { code: 'Z00.0', description: 'General adult medical examination' },
];

const PHYSICIANS = [
  'Dr. Rosa Lim, MD', 'Dr. Pedro Ocampo, MD, FPCP',
  'Dr. Emmanuel Buenaventura, MD', 'Dr. Maribel Santos-Garcia, MD',
];

function ConsultationContent() {
  const searchParams = useSearchParams();
  const { soapNotes, saveSOAPNote, finalizeSOAPNote } = useAppStore();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [icd10Search, setIcd10Search] = useState('');
  const [icd10Open, setIcd10Open] = useState(false);
  const [physicianIdx, setPhysicianIdx] = useState(0);

  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState({ bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', oxygenSat: '', weight: '', height: '' });
  const [assessment, setAssessment] = useState('');
  const [selectedIcd, setSelectedIcd] = useState<{ code: string; description: string } | null>(null);
  const [plan, setPlan] = useState('');

  const patientNotes = selectedMember
    ? soapNotes.filter(n => n.memberPin === selectedMember.philhealthPin).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    : [];

  // Pre-fill from URL ?pin= (from triage desk)
  useEffect(() => {
    const pin = searchParams.get('pin');
    if (pin) {
      const member = allMembers.find(m => m.philhealthPin === pin);
      if (member) {
        setSelectedMember(member);
        setMemberSearch(`${member.firstName} ${member.lastName}`);
      }
    }
  }, [searchParams]);

  const filteredMembers = allMembers.filter(m => {
    const q = memberSearch.toLowerCase();
    return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.philhealthPin.toLowerCase().includes(q);
  });

  const filteredIcd = ICD10_CODES.filter(c =>
    c.code.toLowerCase().includes(icd10Search.toLowerCase()) ||
    c.description.toLowerCase().includes(icd10Search.toLowerCase())
  );

  const handleSaveDraft = () => {
    if (!selectedMember) { toast.error('Select a patient first.'); return; }
    const note: SOAPNote = {
      id: `soap-${Date.now()}`,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      clinicId: selectedMember.registeredClinicId,
      visitDate: new Date().toISOString(),
      subjective, assessment,
      icd10Code: selectedIcd?.code ?? '',
      icd10Description: selectedIcd?.description ?? '',
      plan, prescriptionIds: [],
      physicianName: PHYSICIANS[physicianIdx],
      objective: {
        bloodPressure: objective.bloodPressure,
        heartRate: parseFloat(objective.heartRate) || 0,
        temperature: parseFloat(objective.temperature) || 0,
        respiratoryRate: parseFloat(objective.respiratoryRate) || 0,
        oxygenSat: parseFloat(objective.oxygenSat) || 0,
        weight: parseFloat(objective.weight) || 0,
        height: parseFloat(objective.height) || 0,
      },
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };
    saveSOAPNote(note);
    toast.success('SOAP Note saved as draft.');
  };

  const handleFinalize = () => {
    if (!selectedMember) { toast.error('Select a patient first.'); return; }
    if (!subjective || !assessment || !plan || !selectedIcd) {
      toast.error('S, A, ICD-10, and P are required to finalize.');
      return;
    }
    const note: SOAPNote = {
      id: `soap-${Date.now()}`,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      clinicId: selectedMember.registeredClinicId,
      visitDate: new Date().toISOString(),
      subjective, assessment,
      icd10Code: selectedIcd.code,
      icd10Description: selectedIcd.description,
      plan, prescriptionIds: [],
      physicianName: PHYSICIANS[physicianIdx],
      objective: {
        bloodPressure: objective.bloodPressure,
        heartRate: parseFloat(objective.heartRate) || 0,
        temperature: parseFloat(objective.temperature) || 0,
        respiratoryRate: parseFloat(objective.respiratoryRate) || 0,
        oxygenSat: parseFloat(objective.oxygenSat) || 0,
        weight: parseFloat(objective.weight) || 0,
        height: parseFloat(objective.height) || 0,
      },
      status: 'Finalized',
      createdAt: new Date().toISOString(),
    };
    saveSOAPNote(note);
    finalizeSOAPNote(note.id);
    // Reset form
    setSubjective(''); setAssessment(''); setPlan(''); setSelectedIcd(null);
    setObjective({ bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', oxygenSat: '', weight: '', height: '' });
    toast.success('SOAP Note finalized and added to patient chart!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow" style={{ background: '#5B21B6' }}>
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">YAKAP SOAP Notes</h1>
          <p className="text-sm text-gray-500">Consultation & Follow-up Documentation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* SOAP Form */}
        <div className="xl:col-span-2 space-y-5">
          {/* Patient Selector */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Patient Selection</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
                onFocus={() => setMemberDropdownOpen(true)}
                placeholder="Search patient by name or PIN..." className="form-input pl-9" />
              {memberDropdownOpen && memberSearch && (
                <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                  {filteredMembers.map(m => (
                    <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(`${m.firstName} ${m.lastName}`); setMemberDropdownOpen(false); }}
                      className="w-full flex justify-between px-4 py-3 hover:bg-purple-50 text-left border-b border-gray-50 text-sm">
                      <span className="font-medium">{m.firstName} {m.lastName}</span>
                      <span className="font-mono text-gray-400 text-xs">{m.philhealthPin}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* S — Subjective */}
          <div className="card-glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">S</div>
              <h2 className="font-semibold text-gray-800">Subjective</h2>
              <span className="text-xs text-gray-400">Patient complaints & history</span>
            </div>
            <textarea value={subjective} onChange={e => setSubjective(e.target.value)} rows={3}
              placeholder="Patient reports... History of present illness: ... Associated symptoms: ..."
              className="form-input resize-none text-sm" />
          </div>

          {/* O — Objective */}
          <div className="card-glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">O</div>
              <h2 className="font-semibold text-gray-800">Objective</h2>
              <span className="text-xs text-gray-400">Physical examination & vital signs</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'bloodPressure', label: 'Blood Pressure', placeholder: '120/80 mmHg' },
                { key: 'heartRate', label: 'Heart Rate (bpm)', placeholder: '72' },
                { key: 'temperature', label: 'Temperature (°C)', placeholder: '36.5' },
                { key: 'respiratoryRate', label: 'Resp. Rate (/min)', placeholder: '16' },
                { key: 'oxygenSat', label: 'O₂ Saturation (%)', placeholder: '98' },
                { key: 'weight', label: 'Weight (kg)', placeholder: '65' },
                { key: 'height', label: 'Height (cm)', placeholder: '160' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                  <input type="text" value={objective[key as keyof typeof objective]}
                    onChange={e => setObjective(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} className="form-input text-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* A — Assessment */}
          <div className="card-glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">A</div>
              <h2 className="font-semibold text-gray-800">Assessment</h2>
              <span className="text-xs text-gray-400">Diagnosis with ICD-10 code</span>
            </div>
            <textarea value={assessment} onChange={e => setAssessment(e.target.value)} rows={2}
              placeholder="Clinical assessment and diagnosis..." className="form-input resize-none text-sm mb-3" />
            
            {/* ICD-10 Selector */}
            <div className="relative">
              <label className="text-xs font-medium text-gray-500 block mb-1">ICD-10 Code</label>
              <div className="relative">
                <input type="text" value={selectedIcd ? `${selectedIcd.code} — ${selectedIcd.description}` : icd10Search}
                  onChange={e => { setIcd10Search(e.target.value); setSelectedIcd(null); setIcd10Open(true); }}
                  onFocus={() => setIcd10Open(true)}
                  placeholder="Search ICD-10 code or diagnosis..." className="form-input text-sm pr-8" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {icd10Open && (
                <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                  {filteredIcd.map(c => (
                    <button key={c.code} onClick={() => { setSelectedIcd(c); setIcd10Search(''); setIcd10Open(false); }}
                      className="w-full flex gap-3 px-4 py-2.5 hover:bg-amber-50 text-left border-b border-gray-50">
                      <code className="text-amber-600 font-mono text-xs font-bold w-16 flex-shrink-0">{c.code}</code>
                      <span className="text-sm text-gray-700">{c.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIcd && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {selectedIcd.code} — {selectedIcd.description}
              </p>
            )}
          </div>

          {/* P — Plan */}
          <div className="card-glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">P</div>
              <h2 className="font-semibold text-gray-800">Plan</h2>
              <span className="text-xs text-gray-400">Management & follow-up plan</span>
            </div>
            <textarea value={plan} onChange={e => setPlan(e.target.value)} rows={3}
              placeholder="Treatment plan: medications, labs ordered, dietary advice, follow-up schedule..."
              className="form-input resize-none text-sm" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Physician & Actions */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Attending Physician</h2>
            <select value={physicianIdx} onChange={e => setPhysicianIdx(parseInt(e.target.value))} className="form-input text-sm mb-4">
              {PHYSICIANS.map((p, i) => <option key={i} value={i}>{p}</option>)}
            </select>

            <div className="space-y-2 pt-3 border-t border-gray-100">
              <button onClick={handleSaveDraft} className="btn-secondary w-full justify-center">Save Draft</button>
              <button onClick={handleFinalize} disabled={!selectedMember} className="btn-primary w-full justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Finalize Note
              </button>
            </div>
          </div>

          {/* Patient Chart History */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /> Patient Chart History
            </h2>
            {!selectedMember ? (
              <p className="text-xs text-gray-400 italic">Select a patient to view their consultation history.</p>
            ) : patientNotes.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No prior SOAP notes for this patient.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                {patientNotes.map(note => (
                  <div key={note.id} className="border border-gray-100 rounded-xl p-3 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{new Date(note.visitDate).toLocaleDateString('en-PH')}</span>
                      <span className={`badge text-xs ${note.status === 'Finalized' ? 'badge-green' : 'badge-yellow'}`}>{note.status}</span>
                    </div>
                    <p className="text-xs font-mono text-amber-600">{note.icd10Code}</p>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5">{note.assessment}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.plan}</p>
                    <p className="text-xs text-gray-400 mt-1">{note.physicianName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
      <ConsultationContent />
    </Suspense>
  );
}
