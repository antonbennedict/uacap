'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { Member, Clinic, FPERecord } from '@/lib/types';
import { Stethoscope, Search, User, CheckCircle, UploadCloud, AlertCircle, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

export default function FPEPage() {
  const { saveFPERecord } = useAppStore();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [fpeRecords, setFpeRecords] = useState<FPERecord[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Form State
  const [vitalSigns, setVitalSigns] = useState({
    heightCm: '',
    weightKg: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    fastingBloodSugar: '',
  });
  const [lifestyle, setLifestyle] = useState({
    smokingStatus: 'Never' as 'Never' | 'Former' | 'Current',
    alcoholConsumption: 'Never' as 'Never' | 'Occasional' | 'Regular',
  });
  const [medicalHistory, setMedicalHistory] = useState('');
  const [initialTrancheAmount, setInitialTrancheAmount] = useState('680');

  const currentFPE = selectedMember ? fpeRecords.find((fpe) => fpe.memberPin === selectedMember.philhealthPin) : null;
  const isDispatched = currentFPE?.status === 'Dispatched';

  // Load existing data when member is selected
  useEffect(() => {
    if (currentFPE) {
      setVitalSigns({
        heightCm: currentFPE.vitalSigns.heightCm.toString(),
        weightKg: currentFPE.vitalSigns.weightKg.toString(),
        bloodPressureSystolic: currentFPE.vitalSigns.bloodPressureSystolic.toString(),
        bloodPressureDiastolic: currentFPE.vitalSigns.bloodPressureDiastolic.toString(),
        fastingBloodSugar: currentFPE.vitalSigns.fastingBloodSugar?.toString() ?? '',
      });
      setLifestyle(currentFPE.lifestyle);
      setMedicalHistory(currentFPE.medicalHistory);
    } else {
      setVitalSigns({ heightCm: '', weightKg: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', fastingBloodSugar: '' });
      setLifestyle({ smokingStatus: 'Never', alcoholConsumption: 'Never' });
      setMedicalHistory('');
      setInitialTrancheAmount('680');
    }
  }, [currentFPE]);

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

  const filteredMembers = allMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.philhealthPin.toLowerCase().includes(q)
    );
  });

  const handleSave = () => {
    if (!selectedMember) return;
    
    // Basic validation
    if (!vitalSigns.heightCm || !vitalSigns.weightKg || !vitalSigns.bloodPressureSystolic || !vitalSigns.bloodPressureDiastolic) {
      toast.error('Please fill in all required vital signs (Height, Weight, Blood Pressure).');
      return;
    }

    const record: FPERecord = {
      id: currentFPE?.id ?? `fpe-${Date.now()}`,
      memberPin: selectedMember.philhealthPin,
      clinicId: 'DEFAULT_CLINIC',
      encounterDate: currentFPE?.encounterDate ?? new Date().toISOString(),
      vitalSigns: {
        heightCm: parseFloat(vitalSigns.heightCm),
        weightKg: parseFloat(vitalSigns.weightKg),
        bloodPressureSystolic: parseInt(vitalSigns.bloodPressureSystolic),
        bloodPressureDiastolic: parseInt(vitalSigns.bloodPressureDiastolic),
        fastingBloodSugar: vitalSigns.fastingBloodSugar ? parseFloat(vitalSigns.fastingBloodSugar) : undefined,
      },
      lifestyle,
      medicalHistory,
      initialTrancheAmount: parseFloat(initialTrancheAmount),
      status: currentFPE?.status ?? 'Encoded',
      dispatchedAt: currentFPE?.dispatchedAt ?? null,
    };

    saveFPERecord(record);
    toast.success('FPE record saved successfully.');
  };

  const handleDispatch = () => {
    if (!currentFPE) {
      toast.error('Please save the FPE record first before dispatching.');
      return;
    }
    
    setIsDispatching(true);
    // Simulate network delay to PHIC servers
    setTimeout(() => {
      setIsDispatching(false);
      toast.success('FPE record successfully dispatched to PhilHealth database!');
    }, 1500);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center shadow-md" style={{ backgroundColor: '#0A1628' }}>
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FPE Encoding & Submit</h1>
            <p className="text-sm text-gray-500">First Patient Encounter · PhilHealth YAKAP</p>
          </div>
        </div>
      </div>

      {!selectedMember ? (
        /* Centered Patient Selection first state */
        <div className="max-w-xl mx-auto mt-12 card-glass p-6 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-700">Patient Selection</h2>
            <p className="text-xs text-gray-500 mt-0.5">Please search and select a patient to start or view FPE records.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
              onFocus={() => setMemberDropdownOpen(true)}
              placeholder="Search existing member by name or PIN..."
              className="form-input pl-9"
            />
            {memberDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No members found.</p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberSearch(`${m.firstName} ${m.lastName}`);
                        setMemberDropdownOpen(false);
                      }}
                      className="w-full flex justify-between px-4 py-3 hover:bg-emerald-50 text-left border-b border-gray-50 transition-colors text-sm items-center"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{m.firstName} {m.lastName}</span>
                        <span className="font-mono text-gray-400 text-xs">{m.philhealthPin}</span>
                      </div>
                      {fpeRecords.some(r => r.memberPin === m.philhealthPin) && (
                        <span className="badge badge-green text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">FPE on file</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Workspace when selected */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Form Fields */}
          <div className="md:col-span-2 space-y-6">
            {/* Patient Selector */}
            <div className="card-glass p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Patient Selection</h2>
                <button 
                  onClick={() => { setSelectedMember(null); setMemberSearch(''); }} 
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Change Patient
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
                  onFocus={() => setMemberDropdownOpen(true)}
                  placeholder="Search existing member by name or PIN..."
                  className="form-input pl-9"
                />
                {memberDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">No members found.</p>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMember(m);
                            setMemberSearch(`${m.firstName} ${m.lastName}`);
                            setMemberDropdownOpen(false);
                          }}
                          className="w-full flex justify-between px-4 py-3 hover:bg-emerald-50 text-left border-b border-gray-50 transition-colors text-sm items-center"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{m.firstName} {m.lastName}</span>
                            <span className="font-mono text-gray-400 text-xs">{m.philhealthPin}</span>
                          </div>
                          {fpeRecords.some(r => r.memberPin === m.philhealthPin) && (
                            <span className="badge badge-green text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">FPE on file</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Patient Details Row */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-3 text-xs bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">No.</span>
                  <span className="font-bold text-gray-900">{selectedMember.id.replace('member-', '')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Case No.</span>
                  <span className="font-bold text-emerald-700 font-mono">2026-{selectedMember.philhealthPin.replace(/-/g, '').slice(-6)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">PIN</span>
                  <span className="font-semibold text-gray-900 font-mono">{selectedMember.philhealthPin}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Last Name</span>
                  <span className="font-semibold text-gray-900 uppercase">{selectedMember.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">First Name</span>
                  <span className="font-semibold text-gray-900 uppercase">{selectedMember.firstName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Middle Name</span>
                  <span className="font-semibold text-gray-900 uppercase">{selectedMember.middleName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Extension</span>
                  <span className="text-sm font-semibold text-gray-900 uppercase">{selectedMember.extension || 'None'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Date of Birth</span>
                  <span className="font-semibold text-gray-900">{formatDate(selectedMember.dateOfBirth)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Client Type</span>
                  <span className="font-semibold text-gray-900">{selectedMember.clientType}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Effective Year</span>
                  <span className="font-semibold text-gray-900 font-mono">{new Date().getFullYear()}</span>
                </div>
              </div>
            </div>

            <div className="card-glass p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Vital Signs & Anthropometrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Height (cm) *</label>
                  <input
                    type="number"
                    value={vitalSigns.heightCm}
                    onChange={(e) => setVitalSigns(prev => ({ ...prev, heightCm: e.target.value }))}
                    disabled={isDispatched}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    value={vitalSigns.weightKg}
                    onChange={(e) => setVitalSigns(prev => ({ ...prev, weightKg: e.target.value }))}
                    disabled={isDispatched}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Blood Pressure (Systolic) *</label>
                  <input
                    type="number"
                    value={vitalSigns.bloodPressureSystolic}
                    onChange={(e) => setVitalSigns(prev => ({ ...prev, bloodPressureSystolic: e.target.value }))}
                    disabled={isDispatched}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Blood Pressure (Diastolic) *</label>
                  <input
                    type="number"
                    value={vitalSigns.bloodPressureDiastolic}
                    onChange={(e) => setVitalSigns(prev => ({ ...prev, bloodPressureDiastolic: e.target.value }))}
                    disabled={isDispatched}
                    className="form-input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fasting Blood Sugar (mg/dL) - Optional</label>
                  <input
                    type="number"
                    value={vitalSigns.fastingBloodSugar}
                    onChange={(e) => setVitalSigns(prev => ({ ...prev, fastingBloodSugar: e.target.value }))}
                    disabled={isDispatched}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="card-glass p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Lifestyle & History</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Smoking Status</label>
                  <select
                    value={lifestyle.smokingStatus}
                    onChange={(e) => setLifestyle(prev => ({ ...prev, smokingStatus: e.target.value as any }))}
                    disabled={isDispatched}
                    className="form-input"
                  >
                    <option>Never</option>
                    <option>Former</option>
                    <option>Current</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Alcohol Consumption</label>
                  <select
                    value={lifestyle.alcoholConsumption}
                    onChange={(e) => setLifestyle(prev => ({ ...prev, alcoholConsumption: e.target.value as any }))}
                    disabled={isDispatched}
                    className="form-input"
                  >
                    <option>Never</option>
                    <option>Occasional</option>
                    <option>Regular</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Medical History</label>
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  disabled={isDispatched}
                  rows={4}
                  placeholder="Document significant medical history..."
                  className="form-input resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Panel / Compliance & Actions */}
          <div className="space-y-6">
            {/* Circular 2024-0013 Compliance */}
            <div className="card-glass p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">PhilHealth Compliance (Circular 2024-0013)</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Initial Tranche Amount (PHP)</label>
                <input
                  type="number"
                  value={initialTrancheAmount}
                  onChange={(e) => setInitialTrancheAmount(e.target.value)}
                  disabled={isDispatched}
                  className="form-input max-w-xs"
                />
                <p className="text-[11px] text-gray-400 mt-1">40% capitation release upon successful FPE encoding.</p>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="space-y-4">
              <div className="card-glass p-5 border-t-4 border-t-navy-900" style={{ borderTopColor: '#0A1628' }}>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Record Status</h2>
                {isDispatched ? (
                  <div className="flex items-start gap-2 bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 my-4">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Dispatched to PHIC</p>
                      <p className="text-xs opacity-80 mt-1">
                        Transmitted on {formatDateTime(currentFPE!.dispatchedAt!)}
                      </p>
                    </div>
                  </div>
                ) : currentFPE ? (
                  <div className="flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-200 my-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Encoded (Draft)</p>
                      <p className="text-xs opacity-80 mt-1">Ready for PHIC dispatch.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-gray-50 text-gray-600 p-3 rounded-lg border border-gray-200 my-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">No FPE Record</p>
                      <p className="text-xs opacity-80 mt-1">Please encode patient data and save.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  {!isDispatched && (
                    <button onClick={handleSave} className="btn-secondary w-full justify-center">
                      <Save className="w-4 h-4" /> Save Local Draft
                    </button>
                  )}
                  
                  <button
                    onClick={handleDispatch}
                    disabled={isDispatched || !currentFPE || isDispatching}
                    className={`btn-primary w-full justify-center ${isDispatched ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-philgreen hover:bg-emerald-700'}`}
                  >
                    {isDispatching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isDispatched ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    {isDispatching ? 'Dispatching...' : isDispatched ? 'Successfully Dispatched' : 'Direct PHIC Dispatch'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
