'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import type { Member, SOAPNote } from '@/lib/types';
import { ClipboardList, User, Search, CheckCircle, Clock, ChevronDown, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

const ICD10_CODES = [
  { code: 'I10', description: 'Essential (Primary) Hypertension' },
  { code: 'E11', description: 'Type 2 Diabetes Mellitus' },
  { code: 'E11.9', description: 'Type 2 Diabetes Mellitus without complications' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified (Dyslipidemia / High Cholesterol)' },
  { code: 'E78.0', description: 'Pure Hypercholesterolemia' },
  { code: 'I25.9', description: 'Chronic Ischemic Heart Disease, unspecified' },
  { code: 'J45', description: 'Asthma' },
  { code: 'J45.909', description: 'Unspecified Asthma, uncomplicated' },
  { code: 'J44.9', description: 'Chronic Obstructive Pulmonary Disease (COPD), unspecified' },
  { code: 'A15.0', description: 'Tuberculosis of lung, confirmed by sputum microscopy with or without culture' },
  { code: 'A16.0', description: 'Tuberculosis of lung, bacteriologically and histologically negative (Clinically diagnosed PTB)' },
  { code: 'N39.0', description: 'Urinary Tract Infection (UTI), site unspecified' },
  { code: 'J06.9', description: 'Acute Upper Respiratory Infection (URTI), unspecified' },
  { code: 'J02.9', description: 'Acute Pharyngitis, unspecified (Sore Throat)' },
  { code: 'J18.9', description: 'Pneumonia, unspecified (Community-Acquired Pneumonia / CAP)' },
  { code: 'A09', description: 'Infectious Gastroenteritis and Colitis, unspecified (Acute Diarrhea / AGE)' },
  { code: 'Z00.0', description: 'General Medical Examination (Routine Adult Health Checkup)' },
  { code: 'Z12.31', description: 'Encounter for Screening Mammogram for Malignant Neoplasm of Breast (Unlocks Breast Ultrasound / Mammogram benefits)' },
  { code: 'Z12.4', description: 'Encounter for Screening for Malignant Neoplasm of Cervix (Unlocks Pap Smear coverage)' },
  { code: 'Z12.11', description: 'Encounter for Screening for Malignant Neoplasm of Colon (Unlocks Fecal Occult Blood Test / FOBT)' },
  { code: 'Z13.1', description: 'Encounter for Screening for Diabetes Mellitus (Unlocks Fasting Blood Sugar / HbA1c tests)' },
  { code: 'Z13.6', description: 'Encounter for Screening for Cardiovascular Disorders (Unlocks Lipid Profile and ECG tracking)' },
];

const LAB_EXAMS_LIST = [
  'Random Blood Sugar',
  'CBC w/ platelet count',
  'Chest X-Ray',
  'Creatinine',
  'Electrocardiogram (ECG)',
  'Fasting Blood Sugar',
  'Fecal Occult blood',
  'Fecalysis',
  'HbA1c',
  'Lipid Profile',
  'Oral Glucose Tolerance Test',
  'Pap Smear',
  'PPD Test(Tuberculosis)',
  'Sputum Microscopy',
  'Urinalysis',
  'Others'
];

const MANAGEMENT_LIST = [
  'Breastfeeding Program Education',
  'Counselling for Smoking Cessation',
  'Counselling for Lifestyle Modification',
  'Oral Check-up and Prophylaxis'
];

const CHIEF_COMPLAINTS_LIST = [
  'ABDOMINAL CRAMP/PAIN', 'ALTERED MENTAL SENSORIUM', 'ANOREXIA', 'BLEEDING GUMS', 'BLURRING OF VISION',
  'BODY WEAKNESS', 'CHEST PAIN/DISCOMFORT', 'CONSTIPATION', 'COUGH', 'DIARRHEA',
  'DIZZINESS', 'DYSPNEA', 'DYSURIA', 'EPISTAXIS', 'FEVER',
  'FREQUENCY OF URINATION', 'HEADACHE', 'HEMATEMESIS', 'HEMATURIA', 'HEMOPTYSIS',
  'IRRITABILITY', 'JAUNDICE', 'LOWER EXTREMITY EDEMA', 'MYALGIA', 'ORTHOPNEA',
  'PAIN', 'PALPITATIONS', 'SEIZURES', 'SKIN RASHES', 'STOOL: BLOODY/BLACK TARRY/MUCIOD',
  'SWEATING', 'URGENCY', 'VOMITTING/NAUSEA', 'WEIGHT LOSS', 'OTHERS'
];

const PHYSICIANS = [
  'Dr. Rosa Lim, MD', 'Dr. Pedro Ocampo, MD, FPCP',
  'Dr. Emmanuel Buenaventura, MD', 'Dr. Maribel Santos-Garcia, MD',
];

function ConsultationContent() {
  const searchParams = useSearchParams();
  const { saveSOAPNote } = useAppStore();
  const [soapNotes, setSoapNotes] = useState<any[]>([]);
  const finalizeSOAPNote = async (id: string) => { setSoapNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'Finalized' } : n)); };
  
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [justFinalizedNoteId, setJustFinalizedNoteId] = useState<string | null>(null);
  const [isCaseClicked, setIsCaseClicked] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [icd10Search, setIcd10Search] = useState('');
  const [icd10Open, setIcd10Open] = useState(false);
  const [physicianIdx, setPhysicianIdx] = useState(0);

  const [chiefComplaints, setChiefComplaints] = useState<string[]>([]);
  const [otherComplaint, setOtherComplaint] = useState('');
  const [historyOfIllness, setHistoryOfIllness] = useState('');
  const [objective, setObjective] = useState({ bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', oxygenSat: '', weight: '', height: '' });
  const [visualAcuityLeft, setVisualAcuityLeft] = useState('');
  const [visualAcuityRight, setVisualAcuityRight] = useState('');
  const [heightVal, setHeightVal] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inch'>('cm');
  const [weightVal, setWeightVal] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [bmiVal, setBmiVal] = useState('');
  const [otherPhysicalFindings, setOtherPhysicalFindings] = useState('');
  const [pediatricLength, setPediatricLength] = useState('');
  const [pediatricHead, setPediatricHead] = useState('');
  const [pediatricSkinfold, setPediatricSkinfold] = useState('');
  const [pediatricWaist, setPediatricWaist] = useState('');
  const [pediatricHip, setPediatricHip] = useState('');
  const [pediatricLimbs, setPediatricLimbs] = useState('');
  const [pediatricMuac, setPediatricMuac] = useState('');
  const [heentChecked, setHeentChecked] = useState<string[]>([]);
  const [heentOther, setHeentOther] = useState('');
  const [cblChecked, setCblChecked] = useState<string[]>([]);

  // Auto-calculate BMI
  useEffect(() => {
    const h = parseFloat(heightVal);
    const w = parseFloat(weightVal);
    if (!isNaN(h) && !isNaN(w) && h > 0 && w > 0) {
      const hMeters = heightUnit === 'cm' ? h / 100 : (h * 2.54) / 100;
      const wKg = weightUnit === 'kg' ? w : w * 0.45359237;
      const bmi = wKg / (hMeters * hMeters);
      setBmiVal(bmi.toFixed(1));
    } else {
      setBmiVal('');
    }
  }, [heightVal, heightUnit, weightVal, weightUnit]);

  // Fetch members dynamically
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

  const [assessment, setAssessment] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [selectedIcd, setSelectedIcd] = useState<{ code: string; description: string } | null>(null);
  const [plan, setPlan] = useState('');
  const [labExams, setLabExams] = useState<Record<string, { recommendation: 'Yes' | 'No' | ''; clientDecision: 'Request' | 'Refuse' | '' }>>({});
  const [otherExamVal, setOtherExamVal] = useState('');
  const [managementChecked, setManagementChecked] = useState<string[]>([]);
  const [managementOther, setManagementOther] = useState('');
  const [managementNotApplicable, setManagementNotApplicable] = useState(false);
  const [isActiveConsult, setIsActiveConsult] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchedNoteId, setDispatchedNoteId] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeSoapTab, setActiveSoapTab] = useState<'S' | 'O' | 'A' | 'P'>('S');
  const [satisfactionScore, setSatisfactionScore] = useState<string>('');
  const [isYearEndCompliant, setIsYearEndCompliant] = useState(false);

  const handleEditDraft = (note: any) => {
    setEditingDraftId(note.id);
    setIsActiveConsult(true);
    
    // Set subjective fields
    setChiefComplaints(note.rawChiefComplaints || []);
    setOtherComplaint(note.rawOtherComplaint || '');
    setHistoryOfIllness(note.rawHistoryOfIllness || '');
    
    // Set objective fields
    const obj = note.objective || {};
    setObjective({
      bloodPressure: obj.bloodPressure || '',
      heartRate: obj.heartRate ? String(obj.heartRate) : '',
      temperature: obj.temperature ? String(obj.temperature) : '',
      respiratoryRate: obj.respiratoryRate ? String(obj.respiratoryRate) : '',
      oxygenSat: obj.oxygenSat ? String(obj.oxygenSat) : '',
      weight: obj.weight ? String(obj.weight) : '',
      height: obj.height ? String(obj.height) : '',
    });
    setWeightVal(obj.weight ? String(obj.weight) : '');
    setHeightVal(obj.height ? String(obj.height) : '');
    
    // Set assessment fields
    setSelectedDiagnoses(note.rawSelectedDiagnoses || []);
    
    // Set plan/management fields
    setLabExams(note.rawLabExams || {});
    setOtherExamVal(note.rawOtherExamVal || '');
    setManagementChecked(note.rawManagementChecked || []);
    setManagementOther(note.rawManagementOther || '');
    setManagementNotApplicable(note.rawManagementNotApplicable || false);
    
    // Additional fields
    setSatisfactionScore(note.satisfactionScore || '');
    setIsYearEndCompliant(note.isYearEndCompliant || false);
    if (note.visitDate) {
      setVisitDate(note.visitDate.split('T')[0]);
    }
    
    const pIdx = PHYSICIANS.indexOf(note.physicianName);
    if (pIdx !== -1) {
      setPhysicianIdx(pIdx);
    }
    
    toast.info('Draft consultation loaded for editing.');
  };

  useEffect(() => {
    setEditingDraftId(null);
    setIsActiveConsult(false);
    setIsCaseClicked(false);
    setVisitDate(new Date().toISOString().split('T')[0]);
    setActiveSoapTab('S');
    setChiefComplaints([]);
    setOtherComplaint('');
    setHistoryOfIllness('');
    setObjective({ bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', oxygenSat: '', weight: '', height: '' });
    setVisualAcuityLeft('');
    setVisualAcuityRight('');
    setHeightVal('');
    setHeightUnit('cm');
    setWeightVal('');
    setWeightUnit('kg');
    setBmiVal('');
    setOtherPhysicalFindings('');
    setPediatricLength('');
    setPediatricHead('');
    setPediatricSkinfold('');
    setPediatricWaist('');
    setPediatricHip('');
    setPediatricLimbs('');
    setPediatricMuac('');
    setHeentChecked([]);
    setHeentOther('');
    setCblChecked([]);
    setSelectedDiagnoses([]);
    setLabExams({});
    setOtherExamVal('');
    setManagementChecked([]);
    setManagementOther('');
    setManagementNotApplicable(false);
    setSatisfactionScore('');
    setIsYearEndCompliant(false);
  }, [selectedMember]);
  
  // Fetch patient SOAP notes dynamically from database when selected member changes
  useEffect(() => {
    if (!selectedMember) {
      setSoapNotes([]);
      return;
    }
    const memberId = selectedMember.id;
    async function fetchSoapNotes() {
      try {
        const response = await fetch(`/api/consultations/soap?memberId=${memberId}`);
        const data = await response.json();
        if (data.soapNotes) {
          setSoapNotes(data.soapNotes);
        }
      } catch (err) {
        console.error('Failed to fetch soap notes:', err);
      }
    }
    fetchSoapNotes();
  }, [selectedMember]);

  const calcAge = (dob: string) => {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  };

  const calcAgeInMonths = (dob: string) => {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (30.4375 * 24 * 3600 * 1000));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const patientNotes = selectedMember
    ? soapNotes.filter(n => n.memberPin === selectedMember.philhealthPin).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    : [];

  const getTransactionNumber = (note: any, memberPin: string, notes: any[]) => {
    const pinClean = memberPin.replace(/-/g, '');
    const chronologicalNotes = [...notes].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
    const index = chronologicalNotes.findIndex(n => n.id === note.id);
    const sequentialNum = index !== -1 ? index + 1 : chronologicalNotes.length + 1;
    return `TXN-CONS-${pinClean}-${String(sequentialNum).padStart(2, '0')}`;
  };

  const getConsultationNumber = (note: any, notes: any[]) => {
    const chronologicalNotes = [...notes].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
    const index = chronologicalNotes.findIndex(n => n.id === note.id);
    const sequentialNum = index !== -1 ? index + 1 : chronologicalNotes.length + 1;
    return `CONS-${sequentialNum}`;
  };

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
  }, [searchParams, allMembers]);

  const filteredMembers = allMembers.filter(m => {
    const q = memberSearch.toLowerCase();
    return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.philhealthPin.toLowerCase().includes(q);
  });

  const filteredIcd = ICD10_CODES.filter(c =>
    c.code.toLowerCase().includes(icd10Search.toLowerCase()) ||
    c.description.toLowerCase().includes(icd10Search.toLowerCase())
  );

  const handleSaveDraft = async () => {
    if (!selectedMember) { toast.error('Select a patient first.'); return; }
    const subjectiveText = [
      ...chiefComplaints,
      ...(chiefComplaints.includes('OTHERS') && otherComplaint.trim() ? [`OTHERS: ${otherComplaint.trim()}`] : [])
    ].join(', ') + (historyOfIllness.trim() ? ` | History: ${historyOfIllness.trim()}` : '');

    const h = parseFloat(heightVal) || 0;
    const w = parseFloat(weightVal) || 0;
    const hMetric = heightUnit === 'cm' ? h : h * 2.54;
    const wMetric = weightUnit === 'kg' ? w : w * 0.453592;

    const matchedIcd = selectedDiagnoses.length > 0
      ? (ICD10_CODES.find(c => c.description === selectedDiagnoses[0]) || { code: 'Z00.0', description: selectedDiagnoses[0] })
      : { code: '', description: '' };

    const labItems: string[] = [];
    Object.entries(labExams).forEach(([examName, data]) => {
      const name = examName === 'Others' && otherExamVal.trim() ? `Others (${otherExamVal.trim()})` : examName;
      const rec = data.recommendation ? `Rec: ${data.recommendation}` : '';
      const decision = data.clientDecision ? `Client: ${data.clientDecision}` : '';
      if (rec || decision) {
        labItems.push(`${name} [${[rec, decision].filter(Boolean).join(', ')}]`);
      }
    });

    const mgtItems = managementNotApplicable ? ['Not Applicable'] : [...managementChecked];
    if (!managementNotApplicable && managementOther.trim()) {
      mgtItems.push(`Others: ${managementOther.trim()}`);
    }

    const planText = [
      labItems.length > 0 ? `Lab/Imaging Exam: ${labItems.join('; ')}` : '',
      mgtItems.length > 0 ? `Management: ${mgtItems.join('; ')}` : ''
    ].filter(Boolean).join(' | ') || 'No plan specified.';

    const note: SOAPNote = {
      id: editingDraftId || `soap-${Date.now()}`,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      clinicId: 'DEFAULT_CLINIC',
      visitDate: new Date(visitDate).toISOString(),
      subjective: subjectiveText,
      assessment: selectedDiagnoses.join('; '),
      icd10Code: matchedIcd.code,
      icd10Description: matchedIcd.description,
      plan: planText,
      prescriptionIds: [],
      physicianName: PHYSICIANS[physicianIdx],
      objective: {
        bloodPressure: objective.bloodPressure,
        heartRate: parseFloat(objective.heartRate) || 0,
        temperature: parseFloat(objective.temperature) || 0,
        respiratoryRate: parseFloat(objective.respiratoryRate) || 0,
        oxygenSat: parseFloat(objective.oxygenSat) || 0,
        weight: wMetric,
        height: hMetric,
      },
      satisfactionScore: satisfactionScore || undefined,
      isYearEndCompliant,
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveSOAPNote({
        ...note,
        memberId: selectedMember.id,
        rawChiefComplaints: chiefComplaints,
        rawOtherComplaint: otherComplaint,
        rawHistoryOfIllness: historyOfIllness,
        rawSelectedDiagnoses: selectedDiagnoses,
        rawLabExams: labExams,
        rawOtherExamVal: otherExamVal,
        rawManagementChecked: managementChecked,
        rawManagementOther: managementOther,
        rawManagementNotApplicable: managementNotApplicable,
      });
      // Refetch soap notes to update list
      const response = await fetch(`/api/consultations/soap?memberId=${selectedMember.id}`);
      const data = await response.json();
      if (data.soapNotes) {
        setSoapNotes(data.soapNotes);
      }
      toast.success('Consultation saved as draft.');
    } catch (err) {
      toast.error('Failed to save consultation draft.');
    }
  };

  const handleDispatchConsultation = async (noteId: string) => {
    setIsDispatching(true);
    try {
      const note = soapNotes.find(n => n.id === noteId) || patientNotes.find(n => n.id === noteId);
      if (!note) throw new Error('Note not found');
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'Consultation',
          sourceId: noteId,
          patientName: note.memberName || `${selectedMember?.firstName} ${selectedMember?.lastName}`,
          patientPin: note.memberPin || selectedMember?.philhealthPin || '',
          description: `SOAP Note — ${note.icd10Code}: ${note.assessment || 'Consultation'}`,
          actor: note.physicianName || 'System',
        }),
      });
      setDispatchedNoteId(noteId);
      toast.success('Consultation dispatched to PhilHealth!');
    } catch (err) {
      toast.error('Failed to dispatch consultation.');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedMember) { toast.error('Select a patient first.'); return; }
    
    const labItems: string[] = [];
    Object.entries(labExams).forEach(([examName, data]) => {
      const name = examName === 'Others' && otherExamVal.trim() ? `Others (${otherExamVal.trim()})` : examName;
      const rec = data.recommendation ? `Rec: ${data.recommendation}` : '';
      const decision = data.clientDecision ? `Client: ${data.clientDecision}` : '';
      if (rec || decision) {
        labItems.push(`${name} [${[rec, decision].filter(Boolean).join(', ')}]`);
      }
    });

    const mgtItems = managementNotApplicable ? ['Not Applicable'] : [...managementChecked];
    if (!managementNotApplicable && managementOther.trim()) {
      mgtItems.push(`Others: ${managementOther.trim()}`);
    }

    const planText = [
      labItems.length > 0 ? `Lab/Imaging Exam: ${labItems.join('; ')}` : '',
      mgtItems.length > 0 ? `Management: ${mgtItems.join('; ')}` : ''
    ].filter(Boolean).join(' | ') || '';

    if (selectedDiagnoses.length === 0 || (chiefComplaints.length === 0 && !historyOfIllness.trim()) || !planText.trim()) {
      toast.error('Subjective, Diagnosis, and Plan (Exams or Management) are required to finalize.');
      return;
    }

    const h = parseFloat(heightVal);
    const w = parseFloat(weightVal);
    if (!objective.bloodPressure || isNaN(parseFloat(objective.heartRate)) || isNaN(parseFloat(objective.respiratoryRate)) || isNaN(h) || isNaN(w) || !bmiVal || isNaN(parseFloat(objective.temperature))) {
      toast.error('Blood Pressure, Heart Rate, Respiratory Rate, Height, Weight, BMI, and Temperature are required in the Objective section.');
      return;
    }

    const hMetric = heightUnit === 'cm' ? h : h * 2.54;
    const wMetric = weightUnit === 'kg' ? w : w * 0.453592;

    const subjectiveText = [
      ...chiefComplaints,
      ...(chiefComplaints.includes('OTHERS') && otherComplaint.trim() ? [`OTHERS: ${otherComplaint.trim()}`] : [])
    ].join(', ') + (historyOfIllness.trim() ? ` | History: ${historyOfIllness.trim()}` : '');

    const matchedIcd = (ICD10_CODES.find(c => c.description === selectedDiagnoses[0]) || { code: 'Z00.0', description: selectedDiagnoses[0] });

    const note: SOAPNote = {
      id: editingDraftId || `soap-${Date.now()}`,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      clinicId: 'DEFAULT_CLINIC',
      visitDate: new Date(visitDate).toISOString(),
      subjective: subjectiveText,
      assessment: selectedDiagnoses.join('; '),
      icd10Code: matchedIcd.code,
      icd10Description: matchedIcd.description,
      plan: planText,
      prescriptionIds: [],
      physicianName: PHYSICIANS[physicianIdx],
      objective: {
        bloodPressure: objective.bloodPressure,
        heartRate: parseFloat(objective.heartRate) || 0,
        temperature: parseFloat(objective.temperature) || 0,
        respiratoryRate: parseFloat(objective.respiratoryRate) || 0,
        oxygenSat: parseFloat(objective.oxygenSat) || 0,
        weight: wMetric,
        height: hMetric,
      },
      satisfactionScore: satisfactionScore || undefined,
      isYearEndCompliant,
      status: 'Finalized',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveSOAPNote({
        ...note,
        memberId: selectedMember.id,
        rawChiefComplaints: chiefComplaints,
        rawOtherComplaint: otherComplaint,
        rawHistoryOfIllness: historyOfIllness,
        rawSelectedDiagnoses: selectedDiagnoses,
        rawLabExams: labExams,
        rawOtherExamVal: otherExamVal,
        rawManagementChecked: managementChecked,
        rawManagementOther: managementOther,
        rawManagementNotApplicable: managementNotApplicable,
      });
      // Refetch soap notes to update list
      const response = await fetch(`/api/consultations/soap?memberId=${selectedMember.id}`);
      const data = await response.json();
      if (data.soapNotes) {
        setSoapNotes(data.soapNotes);
        const savedNote = data.soapNotes.find((n: any) => 
          n.id === editingDraftId || 
          (n.icd10Code === matchedIcd.code && n.plan === planText && n.subjective === subjectiveText)
        );
        if (savedNote) {
          setJustFinalizedNoteId(savedNote.id);
        } else if (data.soapNotes.length > 0) {
          setJustFinalizedNoteId(data.soapNotes[0].id);
        }
      }
      toast.success('Consultation finalized and added to patient chart! You can now transmit it to PhilHealth.');
    } catch (err) {
      toast.error('Failed to finalize consultation.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow" style={{ background: '#5B21B6' }}>
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">YAKAP Consultation</h1>
          <p className="text-sm text-gray-500">Consultation & Follow-up Documentation</p>
        </div>
      </div>

      {!selectedMember ? (
        /* Search First state: Hide form and history, display only selection */
        <div className="max-w-xl mx-auto mt-12 card-glass p-6 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-700">Patient Selection</h2>
            <p className="text-xs text-gray-500 mt-0.5">Please search and select a patient to start or view consultations.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={memberSearch}
              onChange={e => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
              onFocus={() => setMemberDropdownOpen(true)}
              placeholder="Search existing member by name or PIN..." className="form-input pl-9" />
            {memberDropdownOpen && (
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
      ) : (
        /* Workspace when selected */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left panel: Form or Details placeholder */}
          <div className="xl:col-span-2 space-y-5">
            {/* Patient Selector */}
            <div className="card-glass p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Patient Selection</h2>
                <button onClick={() => { setSelectedMember(null); setMemberSearch(''); }} className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
                  Change Patient
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
                  onFocus={() => setMemberDropdownOpen(true)}
                  placeholder="Search existing member by name or PIN..." className="form-input pl-9" />
                {memberDropdownOpen && (
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

              {/* Selected Patient Details Row */}
              {(() => {
                const note2025 = patientNotes.find(note => new Date(note.visitDate).getFullYear() === 2025);
                const effectiveYear = note2025 ? 2025 : 2026;
                return (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-3 text-xs bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-400 block mb-0.5 font-medium">No.</span>
                      <span className="font-bold text-gray-900">{allMembers.findIndex(m => m.id === selectedMember.id) + 1}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5 font-medium">Case No.</span>
                      <span 
                        onClick={() => {
                          if (!isCaseClicked) {
                            setIsCaseClicked(true);
                            toast.success('Case Details loaded. You can now consult the patient or view history!');
                          }
                        }}
                        className={`font-bold font-mono transition-all ${
                          !isCaseClicked 
                            ? 'text-purple-700 bg-purple-100 hover:bg-purple-200 cursor-pointer px-1.5 py-0.5 rounded shadow-sm hover:scale-105 inline-block animate-pulse' 
                            : 'text-purple-900 bg-purple-50 px-1 py-0.5 rounded'
                        }`}
                      >
                        {effectiveYear}-{selectedMember.philhealthPin.replace(/-/g, '').slice(-6)}
                        {!isCaseClicked && <span className="text-[9px] block text-purple-600 font-semibold text-center mt-0.5 font-sans">(Click to proceed)</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5 font-medium">PIN</span>
                      <span className="font-semibold text-gray-900 font-mono">{selectedMember.philhealthPin}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5 font-medium">Last Name</span>
                      <span className="font-semibold text-gray-800 uppercase">{selectedMember.lastName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5 font-medium">First Name</span>
                      <span className="font-semibold text-gray-800 uppercase">{selectedMember.firstName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5 font-medium">Middle Name</span>
                      <span className="font-semibold text-gray-800 uppercase">{selectedMember.middleName || 'N/A'}</span>
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
                      <span className="font-semibold text-gray-900 font-mono">{effectiveYear}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
 
            {isCaseClicked && (!isActiveConsult ? (
              /* If patient hasn't clicked Consult/Add yet, show the pre-consult state */
              patientNotes.length === 0 ? (
                /* No prior records view */
                <div className="card-glass p-6 text-center space-y-6">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">No Consultation History</h3>
                    <p className="text-xs text-gray-500 mt-1">This patient has no registered consultation records in this EMR.</p>
                  </div>
                  
                  {/* Patient Details & Transaction Box */}
                  <div className="max-w-md mx-auto text-left border border-gray-200 rounded-xl bg-white p-4 shadow-sm text-xs space-y-3">
                    <div className="bg-gray-50 -mx-4 -mt-4 px-4 py-2 border-b border-gray-200 rounded-t-xl flex justify-between items-center">
                      <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Patient Information Details</span>
                      <span className="font-mono font-bold text-purple-700">{getTransactionNumber({ id: 'new', visitDate: new Date().toISOString() }, selectedMember.philhealthPin, patientNotes)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <p className="text-gray-400">Full Name</p>
                        <p className="font-semibold text-gray-900">{selectedMember.firstName} {selectedMember.lastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">PhilHealth PIN</p>
                        <p className="font-semibold text-gray-900 font-mono">{selectedMember.philhealthPin}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Sex / Age</p>
                        <p className="font-semibold text-gray-900">{selectedMember.sex} · {calcAge(selectedMember.dateOfBirth)} yrs</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Date of Birth</p>
                        <p className="font-semibold text-gray-900">{formatDate(selectedMember.dateOfBirth)}</p>
                      </div>
                    </div>
                  </div>
 
                  <button
                    onClick={() => setIsActiveConsult(true)}
                    className="btn-primary mx-auto justify-center bg-purple-600 hover:bg-purple-700 text-sm py-2.5 px-6"
                  >
                    Add New Consultation
                  </button>
                </div>
              ) : (
                /* Has prior records view: show Consult button */
                <div className="card-glass p-6 text-center space-y-6">
                  <div className="w-14 h-14 bg-purple-50 rounded-2xl mx-auto flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Start Consultation</h3>
                    <p className="text-xs text-gray-500 mt-1">Review the patient's demographics below, then click to begin writing SOAP notes.</p>
                  </div>
 
                  <button
                    onClick={() => setIsActiveConsult(true)}
                    className="btn-primary mx-auto justify-center bg-purple-600 hover:bg-purple-700 text-sm py-2.5 px-6 font-bold flex items-center gap-2 shadow"
                  >
                    <ClipboardList className="w-4 h-4" /> Consult Patient
                  </button>
                </div>
              )
            ) : (
              /* Render the regular SOAP inputs */
              <>
                {editingDraftId && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm mb-4 w-full">
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Editing Draft Consultation</h4>
                      <p className="text-xs text-amber-700">You are currently editing an existing draft. Finalizing or saving will update this record.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingDraftId(null);
                        setChiefComplaints([]); setOtherComplaint(''); setHistoryOfIllness('');
                        setAssessment(''); setSelectedDiagnoses([]); setPlan(''); setSelectedIcd(null);
                        setLabExams({}); setOtherExamVal(''); setManagementChecked([]); setManagementOther('');
                        setObjective({ bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', oxygenSat: '', weight: '', height: '' });
                        setVisualAcuityLeft(''); setVisualAcuityRight(''); setHeightVal(''); setHeightUnit('cm'); setWeightVal(''); setWeightUnit('kg'); setBmiVal(''); setOtherPhysicalFindings('');
                        toast.info('Draft editing cancelled. Started a new consultation form.');
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel Edit & Start New
                    </button>
                  </div>
                )}
                {/* Consultation Details Card */}
                <div className="card-glass p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                    <h2 className="font-semibold text-gray-800">Consultation Session Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Transaction No.</label>
                      <input
                        type="text"
                        value={getTransactionNumber({ id: editingDraftId || 'new', visitDate: visitDate || new Date().toISOString() }, selectedMember.philhealthPin, patientNotes)}
                        readOnly
                        className="form-input text-sm bg-purple-50 text-purple-750 font-bold font-mono cursor-not-allowed border-purple-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-550 block mb-1">Effectivity Year</label>
                      <input
                        type="number"
                        value={new Date().getFullYear()}
                        readOnly
                        className="form-input text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Co-payment (PHP)</label>
                      <input
                        type="text"
                        value="0.00 Php"
                        readOnly
                        className="form-input text-sm bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Consultation Date</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={e => setVisitDate(e.target.value)}
                        className="form-input text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Patient Registration & Demographics Data Entry Module */}
                <div className="card-glass p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-purple-650" />
                    <h2 className="font-semibold text-gray-800">Patient Registration & Demographics</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Case No.</label>
                      <input
                        type="text"
                        value={`2026-${selectedMember.philhealthPin.replace(/-/g, '').slice(-6)}`}
                        readOnly
                        className="form-input text-sm bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Date of Registration</label>
                      <input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="form-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Client PIN</label>
                      <input
                        type="text"
                        defaultValue={selectedMember.philhealthPin}
                        className="form-input text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
                      <input
                        type="text"
                        defaultValue={selectedMember.clientType}
                        className="form-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Last Name</label>
                      <input
                        type="text"
                        defaultValue={selectedMember.lastName}
                        className="form-input text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">First Name</label>
                      <input
                        type="text"
                        defaultValue={selectedMember.firstName}
                        className="form-input text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Middle Name</label>
                      <input
                        type="text"
                        defaultValue={selectedMember.middleName || ''}
                        className="form-input text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Suffix</label>
                      <input
                        type="text"
                        defaultValue={selectedMember.extension || ''}
                        placeholder="e.g. Jr., III"
                        className="form-input text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Contact No.</label>
                      <input
                        type="text"
                        defaultValue={selectedMember.mobileNumber || ''}
                        className="form-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Sex</label>
                      <select defaultValue={selectedMember.sex} className="form-input text-sm">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Date of Birth</label>
                      <input
                        type="date"
                        defaultValue={selectedMember.dateOfBirth}
                        className="form-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Age</label>
                      <input
                        type="number"
                        value={calcAge(selectedMember.dateOfBirth)}
                        readOnly
                        className="form-input text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* SOAP Clickable Navigation Tab */}
                <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-sm gap-1">
                  {[
                    { tab: 'S', num: '1', label: 'Subjective', bg: 'bg-blue-50 text-blue-700', activeBg: 'bg-blue-600 text-white', border: 'border-blue-200' },
                    { tab: 'O', num: '2', label: 'Objective', bg: 'bg-emerald-50 text-emerald-700', activeBg: 'bg-emerald-600 text-white', border: 'border-emerald-200' },
                    { tab: 'A', num: '3', label: 'Assessment', bg: 'bg-amber-50 text-amber-700', activeBg: 'bg-amber-600 text-white', border: 'border-amber-200' },
                    { tab: 'P', num: '4', label: 'Plan', bg: 'bg-purple-50 text-purple-700', activeBg: 'bg-purple-600 text-white', border: 'border-purple-200' }
                  ].map(({ tab, num, label, bg, activeBg, border }) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveSoapTab(tab as any)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
                        activeSoapTab === tab
                          ? `${activeBg} shadow-sm border-transparent`
                          : `${bg} ${border} hover:bg-opacity-80`
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md flex items-center justify-center bg-white/20 text-[10px]">{num}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* S — Subjective */}
                {activeSoapTab === 'S' && (
                  <div className="card-glass p-5 space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">1</div>
                      <div>
                        <h2 className="font-semibold text-gray-800">Subjective Section</h2>
                        <span className="text-[11px] text-gray-400">Patient complaints & clinical history</span>
                      </div>
                    </div>

                    {/* A. Chief Complaint */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">A. Chief Complaint</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto border border-gray-100 p-4 rounded-xl bg-gray-50/30 scrollbar-thin">
                        {CHIEF_COMPLAINTS_LIST.map(complaint => {
                          const isChecked = chiefComplaints.includes(complaint);
                          return (
                            <label key={complaint} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-colors text-xs text-gray-700 font-medium">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setChiefComplaints(prev => prev.filter(c => c !== complaint));
                                  } else {
                                    setChiefComplaints(prev => [...prev, complaint]);
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                              />
                              <span>{complaint}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Render text input if OTHERS is checked */}
                      {chiefComplaints.includes('OTHERS') && (
                        <div className="mt-3 animate-fadeIn">
                          <label className="text-xs font-semibold text-gray-650 block mb-1">Specify Other Complaint</label>
                          <input
                            type="text"
                            value={otherComplaint}
                            onChange={e => setOtherComplaint(e.target.value)}
                            placeholder="Please specify other chief complaints..."
                            className="form-input text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* B. History of present illness */}
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">B. History of Present Illness</h3>
                      <textarea
                        value={historyOfIllness}
                        onChange={e => setHistoryOfIllness(e.target.value)}
                        rows={4}
                        placeholder="Describe chronological course of symptoms, onset, quality, severity, aggravating/alleviating factors..."
                        className="form-input resize-none text-sm"
                      />

                      <div className="flex justify-end pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setActiveSoapTab('O')}
                          className="btn-primary justify-center bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          Next: Objective (2)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* O — Objective */}
                {activeSoapTab === 'O' && (
                  <div className="card-glass p-5 space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">2</div>
                      <div>
                        <h2 className="font-semibold text-gray-800">Objective Section</h2>
                        <span className="text-[11px] text-gray-400">Physical examination, vital signs, and clinical findings</span>
                      </div>
                    </div>

                    {/* A. Objective/Physical Examination */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">A. Objective / Physical Examination</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Blood Pressure (mmHg) <span className="text-red-500">*</span></label>
                          <input type="text" value={objective.bloodPressure}
                            onChange={e => setObjective(p => ({ ...p, bloodPressure: e.target.value }))}
                            placeholder="e.g. 120/80" className="form-input text-sm font-mono" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Heart Rate (/min) <span className="text-red-500">*</span></label>
                          <input type="number" value={objective.heartRate}
                            onChange={e => setObjective(p => ({ ...p, heartRate: e.target.value }))}
                            placeholder="e.g. 72" className="form-input text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Respiratory Rate (/min) <span className="text-red-500">*</span></label>
                          <input type="number" value={objective.respiratoryRate}
                            onChange={e => setObjective(p => ({ ...p, respiratoryRate: e.target.value }))}
                            placeholder="e.g. 16" className="form-input text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Temperature (°C) <span className="text-red-500">*</span></label>
                          <input type="number" step="0.1" value={objective.temperature}
                            onChange={e => setObjective(p => ({ ...p, temperature: e.target.value }))}
                            placeholder="e.g. 36.5" className="form-input text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Height <span className="text-red-500">*</span></label>
                          <div className="flex gap-2">
                            <input type="number" step="0.1" value={heightVal}
                              onChange={e => setHeightVal(e.target.value)}
                              placeholder={heightUnit === 'cm' ? '160' : '63'} className="form-input text-sm flex-1" />
                            <select value={heightUnit} onChange={e => setHeightUnit(e.target.value as any)}
                              className="form-input text-sm w-20 bg-gray-50">
                              <option value="cm">cm</option>
                              <option value="inch">inch</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Weight <span className="text-red-500">*</span></label>
                          <div className="flex gap-2">
                            <input type="number" step="0.1" value={weightVal}
                              onChange={e => setWeightVal(e.target.value)}
                              placeholder={weightUnit === 'kg' ? '60' : '132'} className="form-input text-sm flex-1" />
                            <select value={weightUnit} onChange={e => setWeightUnit(e.target.value as any)}
                              className="form-input text-sm w-20 bg-gray-50">
                              <option value="kg">kg</option>
                              <option value="lb">lb</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">BMI <span className="text-red-500">*</span></label>
                          <input type="text" value={bmiVal} readOnly placeholder="Auto-calculated"
                            className="form-input text-sm bg-gray-50 text-gray-700 font-mono font-bold cursor-not-allowed" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Visual Acuity (Left Eye / Right Eye)</label>
                          <div className="flex gap-2">
                            <input type="text" value={visualAcuityLeft}
                              onChange={e => setVisualAcuityLeft(e.target.value)}
                              placeholder="Left Eye (e.g. 20/20)" className="form-input text-sm flex-1" />
                            <input type="text" value={visualAcuityRight}
                              onChange={e => setVisualAcuityRight(e.target.value)}
                              placeholder="Right Eye (e.g. 20/20)" className="form-input text-sm flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* B. Pediatric Client (0-24 Months) */}
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          B. Pediatric Client (0-24 Months)
                        </h3>
                        {selectedMember && calcAgeInMonths(selectedMember.dateOfBirth) <= 24 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            Patient is {calcAgeInMonths(selectedMember.dateOfBirth)} months (Applicable)
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Optional (Aged &gt; 24 months)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Length (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pediatricLength}
                            onChange={e => setPediatricLength(e.target.value)}
                            placeholder="e.g. 60"
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Head Circumference (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pediatricHead}
                            onChange={e => setPediatricHead(e.target.value)}
                            placeholder="e.g. 40"
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Skinfold Thickness (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pediatricSkinfold}
                            onChange={e => setPediatricSkinfold(e.target.value)}
                            placeholder="e.g. 0.8"
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Waist Circumference (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pediatricWaist}
                            onChange={e => setPediatricWaist(e.target.value)}
                            placeholder="e.g. 45"
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Hip Circumference (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pediatricHip}
                            onChange={e => setPediatricHip(e.target.value)}
                            placeholder="e.g. 48"
                            className="form-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Limbs Circumference (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pediatricLimbs}
                            onChange={e => setPediatricLimbs(e.target.value)}
                            placeholder="e.g. 15"
                            className="form-input text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Middle and Upper Arm Circumference (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pediatricMuac}
                            onChange={e => setPediatricMuac(e.target.value)}
                            placeholder="e.g. 13.5"
                            className="form-input text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* C. PERTINENT FINDINGS PER SYSTEM */}
                    <div className="border-t border-gray-100 pt-4 space-y-5">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        C. PERTINENT FINDINGS PER SYSTEM
                      </h3>

                      {/* HEENT Section */}
                      <div className="bg-gray-50/40 p-4 rounded-xl border border-gray-100 space-y-3">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">HEENT</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {[
                            'Essentially Normal',
                            'Abnormal pupillary reaction',
                            'Cervical lymphadenopathy',
                            'Dry mucous membrane',
                            'Icteric sclerae',
                            'Pale conjunctivae',
                            'Sunken eyeballs',
                            'Sunken fontanelle',
                            'Others'
                          ].map(item => {
                            const isChecked = heentChecked.includes(item);
                            return (
                              <label key={item} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors text-xs text-gray-700 font-medium">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setHeentChecked(prev => prev.filter(x => x !== item));
                                    } else {
                                      setHeentChecked(prev => [...prev, item]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                                />
                                <span>{item}</span>
                              </label>
                            );
                          })}
                        </div>
                        {heentChecked.includes('Others') && (
                          <div className="mt-3 animate-fadeIn">
                            <label className="text-xs font-semibold text-gray-650 block mb-1">Specify HEENT Finding</label>
                            <input
                              type="text"
                              value={heentOther}
                              onChange={e => setHeentOther(e.target.value)}
                              placeholder="Describe other HEENT findings..."
                              className="form-input text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Chest/Breast/Lungs Section */}
                      <div className="bg-gray-50/40 p-4 rounded-xl border border-gray-100 space-y-3">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Chest / Breast / Lungs</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {[
                            'Essentially normal',
                            'Asymmetrical chest expansion',
                            'Decreased breath sounds'
                          ].map(item => {
                            const isChecked = cblChecked.includes(item);
                            return (
                              <label key={item} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors text-xs text-gray-700 font-medium">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setCblChecked(prev => prev.filter(x => x !== item));
                                    } else {
                                      setCblChecked(prev => [...prev, item]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                                />
                                <span>{item}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setActiveSoapTab('A')}
                          className="btn-primary justify-center bg-emerald-650 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          Next: Assessment (3)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* A — Assessment */}
                {activeSoapTab === 'A' && (
                  <div className="card-glass p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">3</div>
                      <h2 className="font-semibold text-gray-800">Assessment</h2>
                      <span className="text-xs text-gray-400">Diagnosis with ICD-10 code</span>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Diagnosis <span className="text-red-500">*</span></label>
                      <select
                        onChange={e => {
                          const val = e.target.value;
                          if (val && !selectedDiagnoses.includes(val)) {
                            setSelectedDiagnoses(prev => [...prev, val]);
                          }
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="form-input text-sm"
                      >
                        <option value="" disabled>Select a diagnosis from the list...</option>
                        {ICD10_CODES.map(c => (
                          <option key={c.code} value={c.description}>
                            {c.code} — {c.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Diagnoses List */}
                    {selectedDiagnoses.length > 0 ? (
                      <div className="mb-4 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100 bg-white text-xs">
                          <thead className="bg-gray-50 text-gray-400 font-semibold uppercase">
                            <tr>
                              <th className="px-4 py-2 text-left w-12">No.</th>
                              <th className="px-4 py-2 text-left">Diagnosis Name</th>
                              <th className="px-4 py-2 text-center w-20">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700">
                            {selectedDiagnoses.map((diag, index) => (
                              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-2.5 font-bold font-mono">{index + 1}</td>
                                <td className="px-4 py-2.5 font-medium">{diag}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDiagnoses(prev => prev.filter((_, i) => i !== index))}
                                    className="text-red-500 hover:text-red-750 font-bold transition-colors"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-3 rounded-lg mb-4 italic">
                        No diagnoses selected yet. Please select at least one from the dropdown above.
                      </p>
                    )}
                    
                    <div className="flex justify-end pt-3 border-t border-gray-100 mt-4">
                      <button
                        type="button"
                        onClick={() => setActiveSoapTab('P')}
                        className="btn-primary justify-center bg-amber-600 hover:bg-amber-700 px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        Next: Plan (4)
                      </button>
                    </div>
                  </div>
                )}

                {/* P — Plan */}
                {activeSoapTab === 'P' && (
                  <>
                  <div className="card-glass p-5 space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">4</div>
                      <div>
                        <h2 className="font-semibold text-gray-800">Plan Section</h2>
                        <span className="text-[11px] text-gray-400">Diagnostics, imaging, and patient management plans</span>
                      </div>
                    </div>

                    {/* A. Laboratory/Imaging Examination */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">A. Laboratory/Imaging Examination</h3>
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 bg-white text-xs">
                          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                            <tr>
                              <th className="px-4 py-3 text-left">Laboratory/Imaging</th>
                              <th className="px-4 py-3 text-center w-56">Doctor Recommendation</th>
                              <th className="px-4 py-3 text-center w-56">Client</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700">
                            {LAB_EXAMS_LIST.map(exam => {
                              const data = labExams[exam] || { recommendation: '', clientDecision: '' };
                              return (
                                <tr key={exam} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3 font-semibold text-gray-800">
                                    {exam === 'Others' ? (
                                      <div className="space-y-1.5">
                                        <span className="block text-purple-650 font-bold">Others (Specify below)</span>
                                        <input
                                          type="text"
                                          value={otherExamVal}
                                          onChange={e => setOtherExamVal(e.target.value)}
                                          placeholder="Type other diagnostic test name..."
                                          className="form-input text-xs w-full py-1"
                                        />
                                      </div>
                                    ) : exam}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="inline-flex items-center gap-3">
                                      <label className="inline-flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`rec-${exam}`}
                                          checked={data.recommendation === 'Yes'}
                                          onChange={() => setLabExams(prev => ({ ...prev, [exam]: { ...prev[exam], recommendation: 'Yes' } }))}
                                          className="text-purple-650 focus:ring-purple-500"
                                        />
                                        <span>Yes</span>
                                      </label>
                                      <label className="inline-flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`rec-${exam}`}
                                          checked={data.recommendation === 'No'}
                                          onChange={() => setLabExams(prev => ({ ...prev, [exam]: { ...prev[exam], recommendation: 'No' } }))}
                                          className="text-purple-650 focus:ring-purple-500"
                                        />
                                        <span>No</span>
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setLabExams(prev => ({ ...prev, [exam]: { ...prev[exam], recommendation: '' } }))}
                                        className="text-[10px] text-gray-400 hover:text-gray-600 underline ml-1"
                                      >
                                        Deselect
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="inline-flex items-center gap-3">
                                      <label className="inline-flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`client-${exam}`}
                                          checked={data.clientDecision === 'Request'}
                                          onChange={() => setLabExams(prev => ({ ...prev, [exam]: { ...prev[exam], clientDecision: 'Request' } }))}
                                          className="text-purple-650 focus:ring-purple-500"
                                        />
                                        <span>Request</span>
                                      </label>
                                      <label className="inline-flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`client-${exam}`}
                                          checked={data.clientDecision === 'Refuse'}
                                          onChange={() => setLabExams(prev => ({ ...prev, [exam]: { ...prev[exam], clientDecision: 'Refuse' } }))}
                                          className="text-purple-650 focus:ring-purple-500"
                                        />
                                        <span>Refuse</span>
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setLabExams(prev => ({ ...prev, [exam]: { ...prev[exam], clientDecision: '' } }))}
                                        className="text-[10px] text-gray-400 hover:text-gray-600 underline ml-1"
                                      >
                                        Deselect
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* B. Management (check if done) */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">B. Management (check if done)</h3>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-red-650 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 hover:bg-red-100/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={managementNotApplicable}
                            onChange={e => {
                              const checked = e.target.checked;
                              setManagementNotApplicable(checked);
                              if (checked) {
                                setManagementChecked([]);
                                setManagementOther('');
                              }
                            }}
                            className="rounded border-red-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                          />
                          <span>Not Applicable</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-gray-50/40 p-4 rounded-xl border border-gray-100">
                        {MANAGEMENT_LIST.map(mgt => {
                          const isChecked = managementChecked.includes(mgt);
                          return (
                            <label key={mgt} className={`flex items-start gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors text-xs text-gray-700 font-medium ${managementNotApplicable ? 'opacity-40 pointer-events-none' : ''}`}>
                              <input
                                type="checkbox"
                                disabled={managementNotApplicable}
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setManagementChecked(prev => prev.filter(x => x !== mgt));
                                  } else {
                                    setManagementChecked(prev => [...prev, mgt]);
                                  }
                                }}
                                className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 mt-0.5"
                              />
                              <span>{mgt}</span>
                            </label>
                          );
                        })}
                        <label className={`flex items-start gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors text-xs text-gray-700 font-medium md:col-span-2 border-t border-gray-100/50 mt-1 pt-3 ${managementNotApplicable ? 'opacity-40 pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            disabled={managementNotApplicable}
                            checked={managementChecked.includes('Others')}
                            onChange={() => {
                              if (managementChecked.includes('Others')) {
                                setManagementChecked(prev => prev.filter(x => x !== 'Others'));
                              } else {
                                setManagementChecked(prev => [...prev, 'Others']);
                              }
                            }}
                            className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 mt-0.5"
                          />
                          <span className="font-bold text-purple-600">Others (Specify below)</span>
                        </label>
                      </div>

                      {!managementNotApplicable && managementChecked.includes('Others') && (
                        <div className="mt-3 animate-fadeIn">
                          <label className="text-xs font-semibold text-gray-650 block mb-1">Specify Other Management Instructions</label>
                          <input
                            type="text"
                            value={managementOther}
                            onChange={e => setManagementOther(e.target.value)}
                            placeholder="Enter specific medication plans, therapeutic details, or other advice..."
                            className="form-input text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* C. Circular 2024-0013 Compliance */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">C. Consultation Outcomes (PhilHealth Circular 2024-0013)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-650 block mb-1">Patient Satisfaction Score</label>
                        <select
                          value={satisfactionScore}
                          onChange={(e) => setSatisfactionScore(e.target.value)}
                          className="form-input text-sm"
                        >
                          <option value="">-- Select --</option>
                          <option value="HAPPY">Happy</option>
                          <option value="NEUTRAL">Neutral</option>
                          <option value="SAD">Sad</option>
                        </select>
                      </div>
                      <div className="flex items-center mt-6">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={isYearEndCompliant}
                            onChange={(e) => setIsYearEndCompliant(e.target.checked)}
                            className="rounded border-gray-300 text-purple-650 focus:ring-purple-500 w-4 h-4"
                          />
                          Mark as Year-End Compliant Consultation
                        </label>
                      </div>
                    </div>
                  </div>
                  </>
                )}
              </>
            ))}
          </div>

          {/* Right Panel */}
          <div className="space-y-5">
            {isCaseClicked && (
              <>
                {/* Attending Physician & Actions */}
            {isActiveConsult && (
              <div className="card-glass p-5">
                <div className="space-y-2 font-sans">
                  {!justFinalizedNoteId ? (
                    <button onClick={handleFinalize} disabled={!selectedMember} className="btn-primary w-full justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Finalize Consultation
                    </button>
                  ) : (
                    <>
                      <div className="text-center p-3 bg-purple-50 text-purple-750 rounded-xl text-xs font-bold mb-2">
                        Consultation Finalized!
                      </div>
                      <button
                        onClick={() => handleDispatchConsultation(justFinalizedNoteId)}
                        disabled={isDispatching || dispatchedNoteId === justFinalizedNoteId}
                        className={`btn-primary w-full justify-center ${
                          dispatchedNoteId === justFinalizedNoteId
                            ? 'bg-gray-105 text-gray-400 cursor-not-allowed border-transparent'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
                        }`}
                      >
                        {isDispatching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : dispatchedNoteId === justFinalizedNoteId ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <UploadCloud className="w-4 h-4" />
                        )}
                        {isDispatching ? 'Dispatching...' : (dispatchedNoteId === justFinalizedNoteId ? 'Successfully Dispatched' : 'Direct PHIC Dispatch')}
                      </button>
                      
                      <button
                        onClick={() => {
                          // Reset form and redirect to search
                          setJustFinalizedNoteId(null);
                          setEditingDraftId(null);
                          setChiefComplaints([]); setOtherComplaint(''); setHistoryOfIllness('');
                          setAssessment(''); setSelectedDiagnoses([]); setPlan(''); setSelectedIcd(null);
                          setLabExams({}); setOtherExamVal(''); setManagementChecked([]); setManagementOther('');
                          setObjective({ bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', oxygenSat: '', weight: '', height: '' });
                          setVisualAcuityLeft(''); setVisualAcuityRight(''); setHeightVal(''); setHeightUnit('cm'); setWeightVal(''); setWeightUnit('kg'); setBmiVal(''); setOtherPhysicalFindings('');
                          setSelectedMember(null);
                          setMemberSearch('');
                          setIsActiveConsult(false);
                          setIsCaseClicked(false);
                        }}
                        className="btn-secondary w-full justify-center text-xs font-bold py-2 mt-2"
                      >
                        Close & Done
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Patient Chart History */}
            {!isActiveConsult && (
              <div className="card-glass p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" /> Patient Chart History
              </h2>
              {patientNotes.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No prior consultations for this patient.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  {patientNotes.map(note => {
                    const isFinalized = note.status === 'Finalized';
                    if (isFinalized) {
                      return (
                        <div key={note.id} className="border border-gray-100 rounded-xl p-3.5 bg-white hover:shadow-sm transition-shadow text-xs space-y-1.5 border-l-4 border-l-emerald-500 bg-emerald-50/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-emerald-850 bg-emerald-100/40 px-2 py-0.5 rounded">Finalized Consultation</span>
                            <span className="badge badge-green text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">{note.status}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-y-1">
                            <div>
                              <span className="text-gray-400 font-medium">Consultation No: </span>
                              <span className="font-semibold text-gray-800 font-mono">{getConsultationNumber(note, patientNotes)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 font-medium">Transaction No: </span>
                              <span className="font-semibold text-purple-700 font-mono">{getTransactionNumber(note, note.memberPin, patientNotes)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 font-medium">Patient PIN: </span>
                              <span className="font-semibold text-gray-800 font-mono">{note.memberPin}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 font-medium">Effectivity Year: </span>
                              <span className="font-semibold text-gray-800">{new Date(note.visitDate).getFullYear()}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 font-medium">Consultation Date: </span>
                              <span className="font-semibold text-gray-800">{new Date(note.visitDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 font-medium">Consultation by: </span>
                              <span className="font-semibold text-gray-850">{note.physicianName}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleDispatchConsultation(note.id)}
                              disabled={isDispatching || dispatchedNoteId === note.id}
                              className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all w-full justify-center ${
                                dispatchedNoteId === note.id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                              }`}
                            >
                              {isDispatching ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Dispatching...</>
                              ) : dispatchedNoteId === note.id ? (
                                <><CheckCircle className="w-3 h-3" /> Dispatched</>
                              ) : (
                                <><UploadCloud className="w-3 h-3" /> Direct PHIC Dispatch</>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Otherwise show Draft view
                    return (
                      <div 
                        key={note.id} 
                        onClick={() => handleEditDraft(note)}
                        className="border border-gray-100 rounded-xl p-3 bg-white hover:shadow-sm transition-shadow cursor-pointer border-amber-250 bg-amber-50/20 hover:bg-amber-50/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{new Date(note.visitDate).toLocaleDateString('en-PH')}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="badge text-xs badge-yellow">{note.status}</span>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">Click to edit</span>
                          </div>
                        </div>
                        <p className="text-xs font-mono text-amber-600">{note.icd10Code}</p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5">{note.assessment}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.plan}</p>
                        <p className="text-xs text-gray-400 mt-1">{note.physicianName}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}
              </>
            )}
          </div>
        </div>
      )}
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
