'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { Member, LabTestType, LabResult } from '@/lib/types';
import { FlaskConical, Search, User, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';


const LAB_TESTS: LabTestType[] = ['CBC', 'Urinalysis', 'Chest X-Ray', 'Blood Chemistry', 'Lipid Profile', 'Cancer Screening', 'Mammogram', 'Ultrasound (upper abdomen, pelvic, and breast only)'];

const LAB_FIELDS: Record<LabTestType, { key: string; label: string; unit?: string; type: 'number' | 'text' | 'select'; options?: string[] }[]> = {
  'CBC': [
    { key: 'WBC', label: 'WBC', unit: '× 10³/μL', type: 'number' },
    { key: 'RBC', label: 'RBC', unit: '× 10⁶/μL', type: 'number' },
    { key: 'Hemoglobin', label: 'Hemoglobin', unit: 'g/dL', type: 'number' },
    { key: 'Hematocrit', label: 'Hematocrit', unit: '%', type: 'number' },
    { key: 'MCV', label: 'MCV', unit: 'fL', type: 'number' },
    { key: 'Platelets', label: 'Platelets', unit: '× 10³/μL', type: 'number' },
    { key: 'Neutrophils', label: 'Neutrophils', unit: '%', type: 'number' },
    { key: 'Lymphocytes', label: 'Lymphocytes', unit: '%', type: 'number' },
  ],
  'Urinalysis': [
    { key: 'Color', label: 'Color', unit: '', type: 'text' },
    { key: 'Clarity', label: 'Clarity', unit: '', type: 'text' },
    { key: 'pH', label: 'pH', unit: '', type: 'number' },
    { key: 'SpecificGravity', label: 'Specific Gravity', unit: '', type: 'number' },
    { key: 'Glucose', label: 'Glucose', unit: '', type: 'text' },
    { key: 'Protein', label: 'Protein', unit: '', type: 'text' },
    { key: 'WBC_micro', label: 'WBC (microscopy)', unit: '/hpf', type: 'text' },
    { key: 'RBC_micro', label: 'RBC (microscopy)', unit: '/hpf', type: 'text' },
  ],
  'Chest X-Ray': [],
  'Blood Chemistry': [
    { key: 'FBS', label: 'Fasting Blood Sugar', unit: 'mg/dL', type: 'number' },
    { key: 'Creatinine', label: 'Creatinine', unit: 'mg/dL', type: 'number' },
    { key: 'UricAcid', label: 'Uric Acid', unit: 'mg/dL', type: 'number' },
    { key: 'SGPT', label: 'SGPT/ALT', unit: 'U/L', type: 'number' },
    { key: 'SGOT', label: 'SGOT/AST', unit: 'U/L', type: 'number' },
    { key: 'BUN', label: 'BUN', unit: 'mg/dL', type: 'number' },
  ],
  'Lipid Profile': [
    { key: 'TotalCholesterol', label: 'Total Cholesterol', unit: 'mg/dL', type: 'number' },
    { key: 'LDL', label: 'LDL Cholesterol', unit: 'mg/dL', type: 'number' },
    { key: 'HDL', label: 'HDL Cholesterol', unit: 'mg/dL', type: 'number' },
    { key: 'Triglycerides', label: 'Triglycerides', unit: 'mg/dL', type: 'number' },
    { key: 'VLDL', label: 'VLDL', unit: 'mg/dL', type: 'number' },
  ],
  'Cancer Screening': [
    { key: 'pap-smear', label: 'Pap Smear Result', type: 'select', options: ['Negative', 'Positive', 'Inconclusive'] },
    { key: 'fob', label: 'Fecal Occult Blood', type: 'select', options: ['Negative', 'Positive'] }
  ],
  'Mammogram': [
    { key: 'birads', label: 'BI-RADS Category', type: 'select', options: ['0 - Incomplete', '1 - Negative', '2 - Benign', '3 - Probably Benign', '4 - Suspicious', '5 - Highly Suggestive of Malignancy', '6 - Known Biopsy Proven'] },
    { key: 'findings', label: 'Findings', type: 'text' }
  ],
  'Ultrasound (upper abdomen, pelvic, and breast only)': [
    { key: 'region', label: 'Region Examined', type: 'select', options: ['Upper Abdomen', 'Pelvic', 'Breast'] },
    { key: 'impression', label: 'Impression', type: 'text' }
  ],
};

const TEST_COLORS: Record<LabTestType, string> = {
  'CBC': 'bg-red-100 text-red-700',
  'Urinalysis': 'bg-yellow-100 text-yellow-700',
  'Chest X-Ray': 'bg-blue-100 text-blue-700',
  'Blood Chemistry': 'bg-amber-100 text-amber-700',
  'Lipid Profile': 'bg-rose-100 text-rose-700',
  'Cancer Screening': 'bg-fuchsia-100 text-fuchsia-700',
  'Mammogram': 'bg-pink-100 text-pink-700',
  'Ultrasound (upper abdomen, pelvic, and breast only)': 'bg-cyan-100 text-cyan-700'
};

export default function LabResultsPage() {
  const labResults: any[] = [];
  const saveLabResult = (a: any) => {};
  const verifyLabResult = (a: any) => {};
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTestType>('CBC');
  const [findings, setFindings] = useState<Record<string, string>>({});
  const [narrative, setNarrative] = useState('');
  const [encodedBy, setEncodedBy] = useState('Lab Officer Cruz');
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
    fetchMembers();
  }, []);

  const filteredMembers = allMembers.filter(m => {
    const q = memberSearch.toLowerCase();
    return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.philhealthPin.toLowerCase().includes(q);
  });

  const patientResults = selectedMember
    ? labResults.filter(r => r.memberPin === selectedMember.philhealthPin).sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime())
    : [];

  const handleTestChange = (test: LabTestType) => {
    setSelectedTest(test);
    setFindings({});
    setNarrative('');
  };

  const handleSave = () => {
    if (!selectedMember) { toast.error('Select a patient first.'); return; }

    const parsedFindings: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(findings)) {
      const num = parseFloat(v);
      parsedFindings[k] = isNaN(num) || LAB_FIELDS[selectedTest].find(f => f.key === k)?.type === 'text' ? v : num;
    }

    const result: LabResult = {
      id: `lab-${Date.now()}`,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      clinicId: 'DEFAULT_CLINIC',
      testType: selectedTest,
      requestedDate: new Date().toISOString(),
      resultDate: new Date().toISOString(),
      findings: parsedFindings,
      narrative,
      status: 'Resulted',
      encodedBy,
    };

    saveLabResult(result);
    toast.success(`${selectedTest} result encoded for ${result.memberName}.`);
    setFindings({});
    setNarrative('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow bg-rose-600">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Results Encoding</h1>
          <p className="text-sm text-gray-500">YAKAP Diagnostics · UACAP Laboratory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Encoding Form */}
        <div className="xl:col-span-2 space-y-5">
          {/* Patient */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Patient Selection</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
                onFocus={() => setMemberDropdownOpen(true)}
                placeholder="Search patient..." className="form-input pl-9" />
              {memberDropdownOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                  {filteredMembers.map(m => (
                    <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(`${m.firstName} ${m.lastName}`); setMemberDropdownOpen(false); }}
                      className="w-full flex justify-between px-4 py-3 hover:bg-rose-50 text-left border-b border-gray-50 text-sm">
                      <span className="font-medium">{m.firstName} {m.lastName}</span>
                      <span className="font-mono text-gray-400 text-xs">{m.philhealthPin}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Type */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Test Type</h2>
            <div className="flex flex-wrap gap-2">
              {LAB_TESTS.map(test => (
                <button key={test} onClick={() => handleTestChange(test)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    selectedTest === test
                      ? `${TEST_COLORS[test]} border-current shadow-sm`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {test}
                </button>
              ))}
            </div>
          </div>

          {/* Result Fields */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">{selectedTest} — Results Entry</h2>
            {selectedTest === 'Chest X-Ray' ? (
              <p className="text-xs text-gray-400 mb-3 italic">Chest X-Ray uses narrative findings only.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {LAB_FIELDS[selectedTest].map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      {field.label} {field.unit && <span className="text-gray-400">({field.unit})</span>}
                    </label>
                    <input type={field.type === 'number' ? 'number' : 'text'}
                      value={findings[field.key] ?? ''}
                      onChange={e => setFindings(p => ({ ...p, [field.key]: e.target.value }))}
                      className="form-input text-sm" />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Narrative Findings / Interpretation</label>
              <textarea value={narrative} onChange={e => setNarrative(e.target.value)} rows={3}
                placeholder="Narrative findings and interpretation..." className="form-input resize-none text-sm" />
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-500 block mb-1">Encoded By</label>
              <input type="text" value={encodedBy} onChange={e => setEncodedBy(e.target.value)} className="form-input text-sm" />
            </div>
            <button onClick={handleSave} disabled={!selectedMember}
              className="btn-primary mt-4 w-full justify-center bg-rose-600 hover:bg-rose-700 disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> Submit Lab Result
            </button>
          </div>
        </div>

        {/* Patient Chart */}
        <div className="card-glass p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-gray-400" /> Lab Chart
            {selectedMember && <span className="text-xs text-gray-400">— {selectedMember.firstName}</span>}
          </h2>
          {!selectedMember ? (
            <p className="text-xs text-gray-400 italic">Select a patient to view lab history.</p>
          ) : patientResults.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No lab results for this patient yet.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
              {patientResults.map(r => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-3 bg-white hover:shadow-sm transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`badge text-xs ${TEST_COLORS[r.testType as LabTestType]} border-0`}>{r.testType}</span>
                    <span className={`badge text-xs ${r.status === 'Verified' ? 'badge-green' : r.status === 'Resulted' ? 'badge-blue' : 'badge-yellow'}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{formatDateTime(r.requestedDate)} · {r.encodedBy}</p>
                  {Object.entries(r.findings).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs py-0.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-semibold text-gray-800">{String(v)}</span>
                    </div>
                  ))}
                  {r.narrative && <p className="text-xs text-gray-600 mt-2 italic leading-snug">{r.narrative}</p>}
                  {r.status === 'Resulted' && (
                    <button onClick={() => { verifyLabResult(r.id); toast.success('Result verified!'); }}
                      className="mt-2 text-xs text-emerald-600 hover:underline flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verify Result
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
