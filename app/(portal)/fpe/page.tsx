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
  const [isCaseClicked, setIsCaseClicked] = useState(false);
  const [isActiveFPE, setIsActiveFPE] = useState(false);
  const [activeFPETab, setActiveFPETab] = useState<number>(1);
  const [encounterDate, setEncounterDate] = useState(new Date().toISOString().split('T')[0]);

  const [profileData, setProfileData] = useState({
    caseNo: '',
    philhealthPin: '',
    effectivityYear: '',
    lastName: '',
    firstName: '',
    middleName: '',
    extension: '',
    age: '',
    dob: '',
    sex: '',
    clientType: '',
  });

  const handleDobChange = (val: string) => {
    const calculatedAge = val ? (new Date().getFullYear() - new Date(val).getFullYear()).toString() : '';
    setProfileData(prev => ({ ...prev, dob: val, age: calculatedAge }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 1. Client Profile (loaded dynamically from selectedMember)
  // 2. Medical & Surgical History
  const [medicalSurgicalHistory, setMedicalSurgicalHistory] = useState({
    conditions: [] as string[],
    allergies: '',
    cancerOrgan: '',
    hepatitisType: '',
    highestBpSystolic: '',
    highestBpDiastolic: '',
    pulmonaryTbCategory: '',
    extraTbCategory: '',
    otherConditions: '',
  });

  const [previousSurgeries, setPreviousSurgeries] = useState<{ procedure: string, date: string }[]>([]);
  const [newSurgery, setNewSurgery] = useState({ procedure: '', date: '' });

  const handleConditionChange = (cond: string, checked: boolean) => {
    setMedicalSurgicalHistory(prev => {
      let nextConditions = [...prev.conditions];
      if (cond === 'None') {
        nextConditions = checked ? ['None'] : [];
      } else {
        if (checked) {
          nextConditions = nextConditions.filter(c => c !== 'None');
          nextConditions.push(cond);
        } else {
          nextConditions = nextConditions.filter(c => c !== cond);
        }
      }
      return { ...prev, conditions: nextConditions };
    });
  };

  // 3. Family & Personal History
  const [familyPersonalHistory, setFamilyPersonalHistory] = useState({
    familyConditions: [] as string[],
    allergies: '',
    cancerOrgan: '',
    hepatitisType: '',
    highestBpSystolic: '',
    highestBpDiastolic: '',
    pulmonaryTbCategory: '',
    extraTbCategory: '',
    otherConditions: '',
    smoking: 'No' as 'Yes' | 'No' | 'Quit',
    smokingPacksPerYear: '',
    alcohol: 'No' as 'Yes' | 'No' | 'Quit',
    alcoholBottlesPerDay: '',
    illicitDrugs: 'No' as 'Yes' | 'No',
    sexuallyActive: 'No' as 'Yes' | 'No',
  });

  const handleFamilyConditionChange = (cond: string, checked: boolean) => {
    setFamilyPersonalHistory(prev => {
      let nextConditions = [...prev.familyConditions];
      if (cond === 'None') {
        nextConditions = checked ? ['None'] : [];
      } else {
        if (checked) {
          nextConditions = nextConditions.filter(c => c !== 'None');
          nextConditions.push(cond);
        } else {
          nextConditions = nextConditions.filter(c => c !== cond);
        }
      }
      return { ...prev, familyConditions: nextConditions };
    });
  };

  // 4. Immunizations
  const [immunizations, setImmunizations] = useState({
    childVaccines: [] as string[],
    adultVaccines: [] as string[],
    pregVaccines: [] as string[],
    eldVaccines: [] as string[],
    otherVaccines: '',
  });

  const handleVaccineChange = (category: 'child' | 'adult' | 'preg' | 'eld', vaccine: string, checked: boolean) => {
    setImmunizations(prev => {
      let list: string[] = [];
      if (category === 'child') list = [...prev.childVaccines];
      else if (category === 'adult') list = [...prev.adultVaccines];
      else if (category === 'preg') list = [...prev.pregVaccines];
      else if (category === 'eld') list = [...prev.eldVaccines];

      if (vaccine === 'None') {
        list = checked ? ['None'] : [];
      } else {
        if (checked) {
          list = list.filter(v => v !== 'None');
          list.push(vaccine);
        } else {
          list = list.filter(v => v !== vaccine);
        }
      }

      return {
        ...prev,
        [`${category}Vaccines`]: list
      };
    });
  };

  // 5. OB-Gyne History
  const [obGyneHistory, setObGyneHistory] = useState({
    menarcheAge: '',
    lmp: '',
    gravida: '',
    para: '',
    abortions: '',
    living: '',
    birthControl: '',
  });

  // 6. Pertinent Physical Examination Findings (Vitals & Physicals)
  const [vitalsAndPhysicals, setVitalsAndPhysicals] = useState({
    heightCm: '',
    heightIn: '',
    weightKg: '',
    weightLb: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    bmi: '',
    leftEye: '',
    rightEye: '',
    isPediatricActive: false,
    lengthCm: '',
    headCircumferenceCm: '',
    skinfoldThicknessCm: '',
    waistCircumferenceCm: '',
    hipCircumferenceCm: '',
    limbsCircumferenceCm: '',
    muacCm: '',
    bloodType: '',
    generalSurvey: 'Awake and alert' as 'Awake and alert' | 'Altered Sensorium',
    alteredSensoriumRemarks: '',
  });

  const [findingsPerSystem, setFindingsPerSystem] = useState({
    heent: { list: ['Essentially Normal'], otherText: '' },
    chest: { list: ['Essentially normal'], otherText: '' },
    heart: { list: ['Essentially normal'], otherText: '' },
    abdomen: { list: ['Essentially normal'], otherText: '' },
    genitourinary: { list: ['Essentially normal'], otherText: '' },
    dre: { list: ['Not Applicable'], otherText: '' },
    skin: { list: ['Essentially normal'], otherText: '' },
    neuro: { list: ['Essentially normal'], otherText: '' }
  });

  const handleSystemFindingChange = (system: keyof typeof findingsPerSystem, value: string, checked: boolean) => {
    setFindingsPerSystem(prev => {
      let nextList = [...prev[system].list];
      const normalVals = ['Essentially Normal', 'Essentially normal', 'Not Applicable'];
      const isNormalVal = normalVals.includes(value);

      if (checked) {
        if (isNormalVal) {
          nextList = [value];
        } else {
          nextList = nextList.filter(v => !normalVals.includes(v));
          nextList.push(value);
        }
      } else {
        nextList = nextList.filter(v => v !== value);
      }
      return {
        ...prev,
        [system]: {
          ...prev[system],
          list: nextList
        }
      };
    });
  };

  const handleHeightChange = (cm: string) => {
    const val = parseFloat(cm);
    const inches = val ? (val / 2.54).toFixed(2) : '';
    setVitalsAndPhysicals(prev => ({ ...prev, heightCm: cm, heightIn: inches }));
  };

  const handleWeightChange = (kg: string) => {
    const val = parseFloat(kg);
    const lbs = val ? (val * 2.20462).toFixed(2) : '';
    setVitalsAndPhysicals(prev => ({ ...prev, weightKg: kg, weightLb: lbs }));
  };

  const handleCalculateBmi = () => {
    const wt = parseFloat(vitalsAndPhysicals.weightKg);
    const ht = parseFloat(vitalsAndPhysicals.heightCm) / 100;
    if (wt && ht) {
      const calculatedBmi = (wt / (ht * ht)).toFixed(2);
      setVitalsAndPhysicals(prev => ({ ...prev, bmi: calculatedBmi }));
      toast.success(`BMI calculated: ${calculatedBmi}`);
    } else {
      toast.error('Height (cm) and Weight (kg) are required to compute BMI.');
    }
  };

  // 7. NCD High-Risk Assessment
  const [ncdHighRiskAssessment, setNcdHighRiskAssessment] = useState({
    processedFoodsWeekly: '',
    vegServingsDaily: '',
    fruitServingsDaily: '',
    moderateActivityWeekly: '',
    diagnosedDiabetes: '',
    diabetesMeds: '',
    polyphagia: '',
    polydipsia: '',
    polyuria: '',
    raisedBloodGlucose: '',
    fbsMgDl: '',
    fbsMmolL: '',
    fbsDate: '',
    raisedBloodLipids: '',
    cholesterolVal: '',
    cholesterolDate: '',
    urineKetones: '',
    ketonesVal: '',
    ketonesDate: '',
    urineProtein: '',
    proteinVal: '',
    proteinDate: '',
    anginaHeartAttack: '',
    qChestPain: '',
    qPainCenterLeftArm: '',
    qWalkUphill: '',
    qSlowDown: '',
    qPainStandStill: '',
    qPainAwayTenMins: '',
    qSevereChestPain: '',
    strokeTia: '',
    qDifficultyTalkingWeakness: '',
    riskLevel: '',
  });

  const [riskLevel, setRiskLevel] = useState('Low Risk');
  const [initialTrancheAmount, setInitialTrancheAmount] = useState('680');

  const currentFPE = selectedMember ? fpeRecords.find((fpe) => fpe.memberPin === selectedMember.philhealthPin) : null;
  const isDispatched = currentFPE?.status === 'Dispatched' || (currentFPE?.status as string) === 'Finalized';

  // Load existing data when member is selected
  useEffect(() => {
    if (selectedMember) {
      const pin = selectedMember.philhealthPin;
      const defaultCaseNo = `FPE-2026-${pin.replace(/-/g, '').slice(-6)}`;
      setProfileData({
        caseNo: currentFPE?.caseNo ?? defaultCaseNo,
        philhealthPin: pin,
        effectivityYear: currentFPE?.effectivityYear?.toString() ?? new Date().getFullYear().toString(),
        lastName: selectedMember.lastName,
        firstName: selectedMember.firstName,
        middleName: selectedMember.middleName || '',
        extension: selectedMember.extension || '',
        dob: selectedMember.dateOfBirth ? new Date(selectedMember.dateOfBirth).toISOString().split('T')[0] : '',
        age: selectedMember.dateOfBirth ? (new Date().getFullYear() - new Date(selectedMember.dateOfBirth).getFullYear()).toString() : '',
        sex: selectedMember.sex,
        clientType: selectedMember.clientType,
      });
    } else {
      setProfileData({ caseNo: '', philhealthPin: '', effectivityYear: '', lastName: '', firstName: '', middleName: '', extension: '', age: '', dob: '', sex: '', clientType: '' });
    }

    if (currentFPE) {
      setEncounterDate(currentFPE.encounterDate ? new Date(currentFPE.encounterDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      const medSurg = (currentFPE.medicalSurgicalHistory as any) || {};
      setMedicalSurgicalHistory({
        conditions: medSurg.conditions || [],
        allergies: medSurg.allergies || '',
        cancerOrgan: medSurg.cancerOrgan || '',
        hepatitisType: medSurg.hepatitisType || '',
        highestBpSystolic: medSurg.highestBpSystolic || '',
        highestBpDiastolic: medSurg.highestBpDiastolic || '',
        pulmonaryTbCategory: medSurg.pulmonaryTbCategory || '',
        extraTbCategory: medSurg.extraTbCategory || '',
        otherConditions: medSurg.otherConditions || '',
      });

      let parsedSurgeries = [];
      if (Array.isArray(medSurg.previousSurgeries)) {
        parsedSurgeries = medSurg.previousSurgeries;
      } else if (typeof medSurg.previousSurgeries === 'string' && medSurg.previousSurgeries) {
        parsedSurgeries = medSurg.previousSurgeries.split(', ').map((s: string) => {
          const parts = s.match(/(.+)\s+\((.+)\)/);
          return {
            procedure: parts ? parts[1] : s,
            date: parts ? parts[2] : '',
          };
        });
      }
      setPreviousSurgeries(parsedSurgeries);

      const famPers = (currentFPE.familyPersonalHistory as any) || {};
      setFamilyPersonalHistory({
        familyConditions: famPers.familyConditions || [],
        allergies: famPers.allergies || '',
        cancerOrgan: famPers.cancerOrgan || '',
        hepatitisType: famPers.hepatitisType || '',
        highestBpSystolic: famPers.highestBpSystolic || '',
        highestBpDiastolic: famPers.highestBpDiastolic || '',
        pulmonaryTbCategory: famPers.pulmonaryTbCategory || '',
        extraTbCategory: famPers.extraTbCategory || '',
        otherConditions: famPers.otherConditions || '',
        smoking: famPers.smoking || 'No',
        smokingPacksPerYear: famPers.smokingPacksPerYear || '',
        alcohol: famPers.alcohol || 'No',
        alcoholBottlesPerDay: famPers.alcoholBottlesPerDay || '',
        illicitDrugs: famPers.illicitDrugs || 'No',
        sexuallyActive: famPers.sexuallyActive || 'No',
      });

      const imm = (currentFPE.immunizations as any) || {};
      setImmunizations({
        childVaccines: imm.childVaccines || [],
        adultVaccines: imm.adultVaccines || [],
        pregVaccines: imm.pregVaccines || [],
        eldVaccines: imm.eldVaccines || [],
        otherVaccines: imm.otherVaccines || '',
      });

      const ob = (currentFPE.obGyneHistory as any) || {};
      setObGyneHistory({
        menarcheAge: ob.menarcheAge || '',
        lmp: ob.lmp || '',
        gravida: ob.gravida || '',
        para: ob.para || '',
        abortions: ob.abortions || '',
        living: ob.living || '',
        birthControl: ob.birthControl || '',
      });

      const vitals = (currentFPE.vitalsAndPhysicals as any) || {};
      setVitalsAndPhysicals({
        heightCm: vitals.heightCm?.toString() || '',
        heightIn: vitals.heightIn?.toString() || '',
        weightKg: vitals.weightKg?.toString() || '',
        weightLb: vitals.weightLb?.toString() || '',
        bloodPressureSystolic: vitals.bloodPressureSystolic?.toString() || '',
        bloodPressureDiastolic: vitals.bloodPressureDiastolic?.toString() || '',
        heartRate: vitals.heartRate?.toString() || '',
        respiratoryRate: vitals.respiratoryRate?.toString() || '',
        temperature: vitals.temperature?.toString() || '',
        bmi: vitals.bmi?.toString() || '',
        leftEye: vitals.leftEye?.toString() || '',
        rightEye: vitals.rightEye?.toString() || '',
        isPediatricActive: !!vitals.isPediatricActive,
        lengthCm: vitals.lengthCm?.toString() || '',
        headCircumferenceCm: vitals.headCircumferenceCm?.toString() || '',
        skinfoldThicknessCm: vitals.skinfoldThicknessCm?.toString() || '',
        waistCircumferenceCm: vitals.waistCircumferenceCm?.toString() || '',
        hipCircumferenceCm: vitals.hipCircumferenceCm?.toString() || '',
        limbsCircumferenceCm: vitals.limbsCircumferenceCm?.toString() || '',
        muacCm: vitals.muacCm?.toString() || '',
        bloodType: vitals.bloodType || '',
        generalSurvey: vitals.generalSurvey || 'Awake and alert',
        alteredSensoriumRemarks: vitals.alteredSensoriumRemarks || '',
      });

      setFindingsPerSystem(vitals.findingsPerSystem || {
        heent: { list: ['Essentially Normal'], otherText: '' },
        chest: { list: ['Essentially normal'], otherText: '' },
        heart: { list: ['Essentially normal'], otherText: '' },
        abdomen: { list: ['Essentially normal'], otherText: '' },
        genitourinary: { list: ['Essentially normal'], otherText: '' },
        dre: { list: ['Not Applicable'], otherText: '' },
        skin: { list: ['Essentially normal'], otherText: '' },
        neuro: { list: ['Essentially normal'], otherText: '' }
      });

      const ncd = (currentFPE.ncdHighRiskAssessment as any) || {};
      setNcdHighRiskAssessment({
        processedFoodsWeekly: ncd.processedFoodsWeekly || '',
        vegServingsDaily: ncd.vegServingsDaily || '',
        fruitServingsDaily: ncd.fruitServingsDaily || '',
        moderateActivityWeekly: ncd.moderateActivityWeekly || '',
        diagnosedDiabetes: ncd.diagnosedDiabetes || '',
        diabetesMeds: ncd.diabetesMeds || '',
        polyphagia: ncd.polyphagia || '',
        polydipsia: ncd.polydipsia || '',
        polyuria: ncd.polyuria || '',
        raisedBloodGlucose: ncd.raisedBloodGlucose || '',
        fbsMgDl: ncd.fbsMgDl || '',
        fbsMmolL: ncd.fbsMmolL || '',
        fbsDate: ncd.fbsDate || '',
        raisedBloodLipids: ncd.raisedBloodLipids || '',
        cholesterolVal: ncd.cholesterolVal || '',
        cholesterolDate: ncd.cholesterolDate || '',
        urineKetones: ncd.urineKetones || '',
        ketonesVal: ncd.ketonesVal || '',
        ketonesDate: ncd.ketonesDate || '',
        urineProtein: ncd.urineProtein || '',
        proteinVal: ncd.proteinVal || '',
        proteinDate: ncd.proteinDate || '',
        anginaHeartAttack: ncd.anginaHeartAttack || '',
        qChestPain: ncd.qChestPain || '',
        qPainCenterLeftArm: ncd.qPainCenterLeftArm || '',
        qWalkUphill: ncd.qWalkUphill || '',
        qSlowDown: ncd.qSlowDown || '',
        qPainStandStill: ncd.qPainStandStill || '',
        qPainAwayTenMins: ncd.qPainAwayTenMins || '',
        qSevereChestPain: ncd.qSevereChestPain || '',
        strokeTia: ncd.strokeTia || '',
        qDifficultyTalkingWeakness: ncd.qDifficultyTalkingWeakness || '',
        riskLevel: ncd.riskLevel || '',
      });

      setRiskLevel(currentFPE.riskLevel || 'Low Risk');
      setInitialTrancheAmount(currentFPE.initialTrancheAmount?.toString() || '680');
    } else {
      setMedicalSurgicalHistory({ conditions: [], allergies: '', cancerOrgan: '', hepatitisType: '', highestBpSystolic: '', highestBpDiastolic: '', pulmonaryTbCategory: '', extraTbCategory: '', otherConditions: '' });
      setPreviousSurgeries([]);
      setNewSurgery({ procedure: '', date: '' });
      setFamilyPersonalHistory({ familyConditions: [], allergies: '', cancerOrgan: '', hepatitisType: '', highestBpSystolic: '', highestBpDiastolic: '', pulmonaryTbCategory: '', extraTbCategory: '', otherConditions: '', smoking: 'No', smokingPacksPerYear: '', alcohol: 'No', alcoholBottlesPerDay: '', illicitDrugs: 'No', sexuallyActive: 'No' });
      setImmunizations({ childVaccines: [], adultVaccines: [], pregVaccines: [], eldVaccines: [], otherVaccines: '' });
      setObGyneHistory({ menarcheAge: '', lmp: '', gravida: '', para: '', abortions: '', living: '', birthControl: '' });
      setVitalsAndPhysicals({
        heightCm: '',
        heightIn: '',
        weightKg: '',
        weightLb: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        respiratoryRate: '',
        temperature: '',
        bmi: '',
        leftEye: '',
        rightEye: '',
        isPediatricActive: false,
        lengthCm: '',
        headCircumferenceCm: '',
        skinfoldThicknessCm: '',
        waistCircumferenceCm: '',
        hipCircumferenceCm: '',
        limbsCircumferenceCm: '',
        muacCm: '',
        bloodType: '',
        generalSurvey: 'Awake and alert',
        alteredSensoriumRemarks: '',
      });
      setFindingsPerSystem({
        heent: { list: ['Essentially Normal'], otherText: '' },
        chest: { list: ['Essentially normal'], otherText: '' },
        heart: { list: ['Essentially normal'], otherText: '' },
        abdomen: { list: ['Essentially normal'], otherText: '' },
        genitourinary: { list: ['Essentially normal'], otherText: '' },
        dre: { list: ['Not Applicable'], otherText: '' },
        skin: { list: ['Essentially normal'], otherText: '' },
        neuro: { list: ['Essentially normal'], otherText: '' }
      });
      setNcdHighRiskAssessment({
        processedFoodsWeekly: '',
        vegServingsDaily: '',
        fruitServingsDaily: '',
        moderateActivityWeekly: '',
        diagnosedDiabetes: '',
        diabetesMeds: '',
        polyphagia: '',
        polydipsia: '',
        polyuria: '',
        raisedBloodGlucose: '',
        fbsMgDl: '',
        fbsMmolL: '',
        fbsDate: '',
        raisedBloodLipids: '',
        cholesterolVal: '',
        cholesterolDate: '',
        urineKetones: '',
        ketonesVal: '',
        ketonesDate: '',
        urineProtein: '',
        proteinVal: '',
        proteinDate: '',
        anginaHeartAttack: '',
        qChestPain: '',
        qPainCenterLeftArm: '',
        qWalkUphill: '',
        qSlowDown: '',
        qPainStandStill: '',
        qPainAwayTenMins: '',
        qSevereChestPain: '',
        strokeTia: '',
        qDifficultyTalkingWeakness: '',
        riskLevel: '',
      });
      setRiskLevel('Low Risk');
      setInitialTrancheAmount('680');
      setEncounterDate(new Date().toISOString().split('T')[0]);
    }
  }, [currentFPE, selectedMember]);

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

  useEffect(() => {
    const records = allMembers.flatMap(m => (m as any).fpeRecords || []);
    setFpeRecords(records);
  }, [allMembers]);

  const filteredMembers = allMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.philhealthPin.toLowerCase().includes(q)
    );
  });

  const handleSave = async (finalize: any = false) => {
    const shouldFinalize = finalize === true;
    if (!selectedMember) return;
    
    // Basic validation
    if (!encounterDate) {
      toast.error('Health Screening & Assessment Date is required.');
      return;
    }

    if (medicalSurgicalHistory.conditions.length === 0) {
      toast.error('Past Medical History selection is required. Check at least one option (or "None") in Category 2.');
      return;
    }

    if (familyPersonalHistory.familyConditions.length === 0) {
      toast.error('Family Medical History selection is required. Check at least one option (or "None") in Category 3.');
      return;
    }

    if (!vitalsAndPhysicals.bloodPressureSystolic || !vitalsAndPhysicals.bloodPressureDiastolic || !vitalsAndPhysicals.heightCm || !vitalsAndPhysicals.weightKg || !vitalsAndPhysicals.heartRate || !vitalsAndPhysicals.respiratoryRate || !vitalsAndPhysicals.temperature || !vitalsAndPhysicals.bmi) {
      toast.error('Please fill in all required fields marked with * in Category 6 (BP, Height, Weight, HR, RR, Temp, BMI).');
      return;
    }

    const record = {
      id: currentFPE?.id ?? `fpe-${Date.now()}`,
      memberId: selectedMember.id,
      caseNo: profileData.caseNo,
      encounterDate: new Date(encounterDate).toISOString(),
      effectivityYear: parseInt(profileData.effectivityYear) || new Date().getFullYear(),
      philhealthPin: profileData.philhealthPin,
      lastName: profileData.lastName,
      firstName: profileData.firstName,
      middleName: profileData.middleName,
      extension: profileData.extension,
      dob: profileData.dob,
      sex: profileData.sex,
      clientType: profileData.clientType,
      medicalSurgicalHistory: {
        ...medicalSurgicalHistory,
        previousSurgeries: previousSurgeries,
      },
      familyPersonalHistory,
      immunizations,
      obGyneHistory: selectedMember.sex === 'FEMALE' ? obGyneHistory : null,
      vitalsAndPhysicals: {
        ...vitalsAndPhysicals,
        findingsPerSystem,
        heightCm: parseFloat(vitalsAndPhysicals.heightCm) || 0,
        weightKg: parseFloat(vitalsAndPhysicals.weightKg) || 0,
        bloodPressureSystolic: parseInt(vitalsAndPhysicals.bloodPressureSystolic) || 0,
        bloodPressureDiastolic: parseInt(vitalsAndPhysicals.bloodPressureDiastolic) || 0,
      },
      ncdHighRiskAssessment,
      riskLevel: ncdHighRiskAssessment.riskLevel || 'Low Risk',
      initialTrancheAmount: parseFloat(initialTrancheAmount) || 680,
      status: shouldFinalize ? 'Finalized' : (currentFPE?.status ?? 'Encoded'),
    };

    await saveFPERecord(record);
    
    // Refetch members so we get the new fpeRecord
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.members) {
        setAllMembers(data.members);
        const updatedMember = data.members.find((m: any) => m.id === selectedMember.id);
        if (updatedMember) {
          setSelectedMember(updatedMember);
        }
      }
    } catch (error) {
      console.error('Failed to refetch members:', error);
    }

    toast.success('FPE record saved successfully.');
  };

  const handleDispatch = () => {
    if (!currentFPE) {
      toast.error('Please save the FPE record first before dispatching.');
      return;
    }
    
    setIsDispatching(true);
    // Simulate network delay to PHIC servers
    setTimeout(async () => {
      try {
        const record = {
          ...currentFPE,
          status: 'Dispatched',
        };
        await saveFPERecord(record);
        // Also create a dispatch record for the Transmittal aggregation
        await fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: 'FPE',
            sourceId: currentFPE.id,
            patientName: `${selectedMember?.firstName} ${selectedMember?.lastName}`,
            patientPin: selectedMember?.philhealthPin || currentFPE.memberPin || '',
            description: `First Patient Encounter — Risk Level: ${currentFPE.riskLevel || 'N/A'}`,
            actor: 'Clinic Administrator',
          }),
        });
        setIsDispatching(false);
        toast.success('FPE record successfully dispatched to PhilHealth database!');
      } catch (err) {
        setIsDispatching(false);
        toast.error('Failed to update FPE status to Dispatched.');
      }
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
            <h1 className="text-2xl font-bold text-gray-900 font-sans">FPE Encoding & Submit</h1>
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
            <h2 className="text-base font-semibold text-gray-700 font-sans">Patient Selection</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">Please search and select a patient to start or view FPE records.</p>
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
                        const hasFPE = fpeRecords.some(r => r.memberPin === m.philhealthPin);
                        setIsCaseClicked(!hasFPE);
                        setIsActiveFPE(false);
                        setActiveFPETab(1);
                      }}
                      className="w-full flex justify-between px-4 py-3 hover:bg-emerald-50 text-left border-b border-gray-50 transition-colors text-sm items-center font-sans"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in font-sans">
          {/* Form Fields */}
          <div className="md:col-span-2 space-y-6">
            {/* Patient Selector */}
            <div className="card-glass p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Patient Selection</h2>
                <button 
                  onClick={() => { setSelectedMember(null); setMemberSearch(''); setIsCaseClicked(false); setIsActiveFPE(false); setActiveFPETab(1); }} 
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
                  <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto font-sans">
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
                            const hasFPE = fpeRecords.some(r => r.memberPin === m.philhealthPin);
                            setIsCaseClicked(!hasFPE);
                            setIsActiveFPE(false);
                            setActiveFPETab(1);
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
              {currentFPE && (
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
                          toast.success('Case Details loaded. You can now encode FPE or view record!');
                        }
                      }}
                      className={`font-bold font-mono transition-all ${
                        !isCaseClicked 
                          ? 'text-purple-750 bg-purple-100 hover:bg-purple-200 cursor-pointer px-1.5 py-0.5 rounded shadow-sm hover:scale-105 inline-block animate-pulse' 
                          : 'text-purple-900 bg-purple-50 px-1 py-0.5 rounded'
                      }`}
                    >
                      2026-{selectedMember.philhealthPin.replace(/-/g, '').slice(-6)}
                      {!isCaseClicked && <span className="text-[9px] block text-purple-650 font-semibold text-center mt-0.5 font-sans">(Click to proceed)</span>}
                    </span>
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
              )}
            </div>

            {isCaseClicked && (!isActiveFPE ? (
              /* Pre-encoding choices */
              !currentFPE ? (
                /* No prior records view */
                <div className="card-glass p-6 text-center space-y-6">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-sans">No FPE Record</h3>
                    <p className="text-xs text-gray-500 mt-1 font-sans">This patient has no registered First Patient Encounter (FPE) record in this EMR.</p>
                  </div>
                  
                  {/* Patient Details & Transaction Box */}
                  <div className="max-w-md mx-auto text-left border border-gray-200 rounded-xl bg-white p-4 shadow-sm text-xs space-y-3 font-sans">
                    <div className="bg-gray-50 -mx-4 -mt-4 px-4 py-2 border-b border-gray-200 rounded-t-xl flex justify-between items-center">
                      <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Patient Information Details</span>
                      <span className="font-mono font-bold text-purple-700">TXN-FPE-{selectedMember.philhealthPin.replace(/-/g, '')}</span>
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
                        <p className="font-semibold text-gray-900">{selectedMember.sex} · {new Date().getFullYear() - new Date(selectedMember.dateOfBirth).getFullYear()} yrs</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Date of Birth</p>
                        <p className="font-semibold text-gray-900">{formatDate(selectedMember.dateOfBirth)}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsActiveFPE(true)}
                    className="btn-primary mx-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-sm py-2.5 px-6 font-sans font-bold"
                  >
                    Add New Record
                  </button>
                </div>
              ) : (
                /* Has existing FPE */
                <div className="card-glass p-6 text-center space-y-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-sans">FPE Record Found</h3>
                    <p className="text-xs text-gray-500 mt-1 font-sans">Review the patient's demographics below, then click to begin viewing or editing the FPE record.</p>
                  </div>

                  <button
                    onClick={() => setIsActiveFPE(true)}
                    className="btn-primary mx-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-sm py-2.5 px-6 font-sans font-bold flex items-center gap-2 shadow"
                  >
                    <Stethoscope className="w-4 h-4" /> View / Edit FPE
                  </button>
                </div>
              )
            ) : (
              /* FPE Encoding 7-Category Tab System */
              <>
                {/* 7 Categories Tab Bar */}
                <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-3 bg-white p-2 rounded-xl border border-gray-100">
                  {[
                    { id: 1, label: '1. Client Profile', bg: 'bg-blue-50 text-blue-700', activeBg: 'bg-blue-600 text-white', border: 'border-blue-200' },
                    { id: 2, label: '2. Medical & Surgical', bg: 'bg-emerald-50 text-emerald-700', activeBg: 'bg-emerald-600 text-white', border: 'border-emerald-200' },
                    { id: 3, label: '3. Family & Personal', bg: 'bg-purple-50 text-purple-700', activeBg: 'bg-purple-600 text-white', border: 'border-purple-200' },
                    { id: 4, label: '4. Immunizations', bg: 'bg-orange-50 text-orange-700', activeBg: 'bg-orange-600 text-white', border: 'border-orange-200' },
                    { id: 5, label: '5. OB-Gyne', bg: 'bg-pink-50 text-pink-700', activeBg: 'bg-pink-600 text-white', border: 'border-pink-200', hide: selectedMember.sex !== 'FEMALE' },
                    { id: 6, label: '6. Physical Exam', bg: 'bg-teal-50 text-teal-700', activeBg: 'bg-teal-600 text-white', border: 'border-teal-200' },
                    { id: 7, label: '7. NCD Assessment', bg: 'bg-red-50 text-red-700', activeBg: 'bg-red-600 text-white', border: 'border-red-200' },
                  ].filter(t => !t.hide).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveFPETab(t.id)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all border ${
                        activeFPETab === t.id
                          ? `${t.activeBg} shadow-sm border-transparent`
                          : `${t.bg} ${t.border} hover:bg-opacity-80`
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content 1: Client Profile */}
                {activeFPETab === 1 && (
                  <div className="card-glass p-5 space-y-5">
                    <h2 className="text-base font-bold text-gray-850 flex items-center gap-2 border-b pb-2">
                      <User className="w-5 h-5 text-blue-500" /> Client Profile
                    </h2>

                    {/* Reminder Note */}
                    <div className="bg-amber-50 border border-amber-250 rounded-xl p-3.5 text-xs text-amber-850 flex items-start gap-2.5 shadow-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                      <div>
                        <span className="font-bold block mb-0.5">Photo Enrollment Reminder</span>
                        <p className="opacity-95 font-medium">Reminder to capture a photo of the beneficiary in lieu of the ATC requirement.</p>
                      </div>
                    </div>

                    {/* Health Screening & Assessment Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-gray-100 pb-3 pt-1">
                      <label className="text-xs font-bold text-gray-700">Health Screening & Assessment Date *</label>
                      <input
                        type="date"
                        value={encounterDate}
                        onChange={(e) => setEncounterDate(e.target.value)}
                        disabled={isDispatched}
                        required
                        className="form-input text-xs max-w-xs font-semibold"
                      />
                    </div>

                    {/* Individual Health Profile Section */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-1">INDIVIDUAL HEALTH PROFILE</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-550 mb-1">Case Number</label>
                          <input
                            type="text"
                            value={profileData.caseNo}
                            onChange={(e) => setProfileData(prev => ({ ...prev, caseNo: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-550 mb-1">PhilHealth Identification Number</label>
                          <input
                            type="text"
                            value={profileData.philhealthPin}
                            onChange={(e) => setProfileData(prev => ({ ...prev, philhealthPin: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-550 mb-1">Effectivity Year</label>
                          <input
                            type="number"
                            value={profileData.effectivityYear}
                            onChange={(e) => setProfileData(prev => ({ ...prev, effectivityYear: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Client Details Section */}
                    <div className="space-y-3 pt-3">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-1">Client Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Middle Name</label>
                          <input
                            type="text"
                            value={profileData.middleName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, middleName: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Extension Name</label>
                          <input
                            type="text"
                            value={profileData.extension}
                            onChange={(e) => setProfileData(prev => ({ ...prev, extension: e.target.value }))}
                            disabled={isDispatched}
                            placeholder="e.g. Jr., III"
                            className="form-input text-xs uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={profileData.dob}
                            onChange={(e) => handleDobChange(e.target.value)}
                            disabled={isDispatched}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Age</label>
                          <input
                            type="number"
                            value={profileData.age}
                            onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sex</label>
                          <select
                            value={profileData.sex}
                            onChange={(e) => setProfileData(prev => ({ ...prev, sex: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs"
                          >
                            <option>MALE</option>
                            <option>FEMALE</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Client Type</label>
                          <select
                            value={profileData.clientType}
                            onChange={(e) => setProfileData(prev => ({ ...prev, clientType: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs"
                          >
                            <option>MEMBER</option>
                            <option>DEPENDENT</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Next Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setActiveFPETab(2)}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content 2: Medical & Surgical History */}
                {activeFPETab === 2 && (
                  <div className="card-glass p-5 space-y-4 font-sans">
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <Stethoscope className="w-5 h-5 text-emerald-500" /> Medical & Surgical History
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Column 1: PAST MEDICAL HISTORY Checkboxes */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">PAST MEDICAL HISTORY (required)</label>
                        <div className="space-y-1">
                          {[
                            'Allergy',
                            'Asthma',
                            'Cancer',
                            'Cerebrovascular Disease',
                            'Coronary Artery Disease',
                            'Diabetes Mellitus',
                            'Emphysema',
                            'Epilepsy/Seizure Disorder',
                            'Hepatitis',
                            'Hyperlipidemia',
                            'Hypertension',
                            'Peptic Ulcer',
                            'Pneumonia',
                            'Thyroid Disease',
                            'Pulmonary Tuberculosis',
                            'Extrapulmonary Tuberculosis',
                            'Urinary Tract Infection',
                            'Mental Illness',
                            'Others',
                            'None'
                          ].map(cond => (
                            <label key={cond} className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-gray-50 rounded text-xs font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={medicalSurgicalHistory.conditions.includes(cond)}
                                disabled={isDispatched}
                                onChange={(e) => handleConditionChange(cond, e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <span>{cond}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Specific Inputs */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-605 mb-1">Specific Allergy</label>
                          <input
                            type="text"
                            value={medicalSurgicalHistory.allergies}
                            onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, allergies: e.target.value }))}
                            disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Allergy')}
                            placeholder={medicalSurgicalHistory.conditions.includes('Allergy') ? "Specify allergies..." : "Check 'Allergy' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify organ with cancer</label>
                          <input
                            type="text"
                            value={medicalSurgicalHistory.cancerOrgan}
                            onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, cancerOrgan: e.target.value }))}
                            disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Cancer')}
                            placeholder={medicalSurgicalHistory.conditions.includes('Cancer') ? "Specify organ..." : "Check 'Cancer' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify hepatitis type</label>
                          <input
                            type="text"
                            value={medicalSurgicalHistory.hepatitisType}
                            onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, hepatitisType: e.target.value }))}
                            disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Hepatitis')}
                            placeholder={medicalSurgicalHistory.conditions.includes('Hepatitis') ? "Specify hepatitis type..." : "Check 'Hepatitis' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Highest blood pressure</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={medicalSurgicalHistory.highestBpSystolic}
                              onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, highestBpSystolic: e.target.value }))}
                              disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Hypertension')}
                              placeholder="Sys"
                              className="form-input text-xs w-20 text-center font-mono"
                            />
                            <span className="text-gray-500 font-bold">/</span>
                            <input
                              type="number"
                              value={medicalSurgicalHistory.highestBpDiastolic}
                              onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, highestBpDiastolic: e.target.value }))}
                              disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Hypertension')}
                              placeholder="Dia"
                              className="form-input text-xs w-20 text-center font-mono"
                            />
                            <span className="text-xs text-gray-500 font-semibold">mmHg</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify Pulmonary Tuberculosis category</label>
                          <input
                            type="text"
                            value={medicalSurgicalHistory.pulmonaryTbCategory}
                            onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, pulmonaryTbCategory: e.target.value }))}
                            disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Pulmonary Tuberculosis')}
                            placeholder={medicalSurgicalHistory.conditions.includes('Pulmonary Tuberculosis') ? "Specify category..." : "Check 'Pulmonary Tuberculosis' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify Extrapulmonary Tuberculosis category</label>
                          <input
                            type="text"
                            value={medicalSurgicalHistory.extraTbCategory}
                            onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, extraTbCategory: e.target.value }))}
                            disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Extrapulmonary Tuberculosis')}
                            placeholder={medicalSurgicalHistory.conditions.includes('Extrapulmonary Tuberculosis') ? "Specify category..." : "Check 'Extrapulmonary Tuberculosis' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">(Others, please specify)</label>
                          <input
                            type="text"
                            value={medicalSurgicalHistory.otherConditions}
                            onChange={(e) => setMedicalSurgicalHistory(prev => ({ ...prev, otherConditions: e.target.value }))}
                            disabled={isDispatched || !medicalSurgicalHistory.conditions.includes('Others')}
                            placeholder={medicalSurgicalHistory.conditions.includes('Others') ? "Specify other conditions..." : "Check 'Others' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PAST SURGICAL HISTORY */}
                    <div className="pt-3 border-t border-gray-100 space-y-3 font-sans">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">PAST SURGICAL HISTORY</label>
                      
                      {/* Three-column inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6">
                          <label className="block text-[11px] font-semibold text-gray-550 mb-1 font-sans">Operation</label>
                          <input
                            type="text"
                            value={newSurgery.procedure}
                            onChange={(e) => setNewSurgery(prev => ({ ...prev, procedure: e.target.value }))}
                            disabled={isDispatched}
                            placeholder="e.g. Appendectomy"
                            className="form-input text-xs font-sans"
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-[11px] font-semibold text-gray-550 mb-1 font-sans">Date (mm/dd/yyyy)</label>
                          <input
                            type="date"
                            value={newSurgery.date}
                            onChange={(e) => setNewSurgery(prev => ({ ...prev, date: e.target.value }))}
                            disabled={isDispatched}
                            className="form-input text-xs font-sans"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newSurgery.procedure.trim()) {
                                toast.error('Please enter the operation name.');
                                return;
                              }
                              setPreviousSurgeries(prev => [...prev, { procedure: newSurgery.procedure.trim(), date: newSurgery.date }]);
                              setNewSurgery({ procedure: '', date: '' });
                            }}
                            disabled={isDispatched}
                            className="btn-primary w-full justify-center bg-blue-600 hover:bg-blue-700 text-xs font-bold py-2 shadow-sm font-sans"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Display List of added surgeries */}
                      {previousSurgeries.length > 0 && (
                        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 font-sans">
                          {previousSurgeries.map((s, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 text-xs shadow-sm">
                              <div>
                                <span className="font-semibold text-gray-800">{s.procedure}</span>
                                {s.date && <span className="text-gray-400 font-mono ml-2">({formatDate(s.date)})</span>}
                              </div>
                              {!isDispatched && (
                                <button
                                  type="button"
                                  onClick={() => setPreviousSurgeries(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setActiveFPETab(1)}
                        className="btn-secondary text-xs font-bold px-4 py-2"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (medicalSurgicalHistory.conditions.length === 0) {
                            toast.error('Past Medical History selection is required. Check at least one option.');
                            return;
                          }
                          setActiveFPETab(3);
                        }}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-5 py-2 shadow"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content 3: Family & Personal History */}
                {activeFPETab === 3 && (
                  <div className="card-glass p-5 space-y-4 font-sans">
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <User className="w-5 h-5 text-purple-500" /> Family & Personal History
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Column 1: FAMILY MEDICAL HISTORY Checkboxes */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">FAMILY MEDICAL HISTORY (required)</label>
                        <div className="space-y-1">
                          {[
                            'Allergy',
                            'Asthma',
                            'Cancer',
                            'Cerebrovascular Disease',
                            'Coronary Artery Disease',
                            'Diabetes Mellitus',
                            'Emphysema',
                            'Epilepsy/Seizure Disorder',
                            'Hepatitis',
                            'Hyperlipidemia',
                            'Hypertension',
                            'Peptic Ulcer',
                            'Pneumonia',
                            'Thyroid Disease',
                            'Pulmonary Tuberculosis',
                            'Extrapulmonary Tuberculosis',
                            'Urinary Tract Infection',
                            'Mental Illness',
                            'Others',
                            'None'
                          ].map(cond => (
                            <label key={cond} className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-gray-50 rounded text-xs font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={familyPersonalHistory.familyConditions.includes(cond)}
                                disabled={isDispatched}
                                onChange={(e) => handleFamilyConditionChange(cond, e.target.checked)}
                                className="rounded text-purple-650 focus:ring-purple-500 w-4 h-4"
                              />
                              <span>{cond}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Specific Inputs */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specific Allergy</label>
                          <input
                            type="text"
                            value={familyPersonalHistory.allergies}
                            onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, allergies: e.target.value }))}
                            disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Allergy')}
                            placeholder={familyPersonalHistory.familyConditions.includes('Allergy') ? "Specify allergies..." : "Check 'Allergy' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify organ with cancer</label>
                          <input
                            type="text"
                            value={familyPersonalHistory.cancerOrgan}
                            onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, cancerOrgan: e.target.value }))}
                            disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Cancer')}
                            placeholder={familyPersonalHistory.familyConditions.includes('Cancer') ? "Specify organ..." : "Check 'Cancer' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify hepatitis type</label>
                          <input
                            type="text"
                            value={familyPersonalHistory.hepatitisType}
                            onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, hepatitisType: e.target.value }))}
                            disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Hepatitis')}
                            placeholder={familyPersonalHistory.familyConditions.includes('Hepatitis') ? "Specify hepatitis type..." : "Check 'Hepatitis' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Highest blood pressure</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={familyPersonalHistory.highestBpSystolic}
                              onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, highestBpSystolic: e.target.value }))}
                              disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Hypertension')}
                              placeholder="Sys"
                              className="form-input text-xs w-20 text-center font-mono"
                            />
                            <span className="text-gray-500 font-bold">/</span>
                            <input
                              type="number"
                              value={familyPersonalHistory.highestBpDiastolic}
                              onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, highestBpDiastolic: e.target.value }))}
                              disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Hypertension')}
                              placeholder="Dia"
                              className="form-input text-xs w-20 text-center font-mono"
                            />
                            <span className="text-xs text-gray-500 font-semibold">mmHg</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify Pulmonary Tuberculosis category</label>
                          <input
                            type="text"
                            value={familyPersonalHistory.pulmonaryTbCategory}
                            onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, pulmonaryTbCategory: e.target.value }))}
                            disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Pulmonary Tuberculosis')}
                            placeholder={familyPersonalHistory.familyConditions.includes('Pulmonary Tuberculosis') ? "Specify category..." : "Check 'Pulmonary Tuberculosis' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Specify Extrapulmonary Tuberculosis category</label>
                          <input
                            type="text"
                            value={familyPersonalHistory.extraTbCategory}
                            onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, extraTbCategory: e.target.value }))}
                            disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Extrapulmonary Tuberculosis')}
                            placeholder={familyPersonalHistory.familyConditions.includes('Extrapulmonary Tuberculosis') ? "Specify category..." : "Check 'Extrapulmonary Tuberculosis' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">(Others, please specify)</label>
                          <input
                            type="text"
                            value={familyPersonalHistory.otherConditions}
                            onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, otherConditions: e.target.value }))}
                            disabled={isDispatched || !familyPersonalHistory.familyConditions.includes('Others')}
                            placeholder={familyPersonalHistory.familyConditions.includes('Others') ? "Specify other conditions..." : "Check 'Others' to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PERSONAL/SOCIAL HISTORY Section */}
                    <div className="pt-4 border-t border-gray-100 space-y-4 font-sans">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">PERSONAL/SOCIAL HISTORY</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Smoking Section */}
                        <div className="bg-gray-55/40 p-3 rounded-lg border border-gray-100 space-y-2 bg-gray-50/50">
                          <label className="block font-bold text-gray-700">Smoking</label>
                          <div className="flex items-center gap-4">
                            {['Yes', 'No', 'Quit'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="smokingRadio"
                                  value={opt}
                                  checked={familyPersonalHistory.smoking === opt}
                                  onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, smoking: e.target.value as any }))}
                                  disabled={isDispatched}
                                  className="text-purple-650 focus:ring-purple-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">No. of packs/year?</label>
                            <input
                              type="text"
                              value={familyPersonalHistory.smokingPacksPerYear}
                              onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, smokingPacksPerYear: e.target.value }))}
                              disabled={isDispatched || familyPersonalHistory.smoking === 'No'}
                              placeholder={familyPersonalHistory.smoking !== 'No' ? "Specify packs/year..." : "Select Yes or Quit to enable"}
                              className="form-input text-xs"
                            />
                          </div>
                        </div>

                        {/* Alcohol Section */}
                        <div className="bg-gray-55/40 p-3 rounded-lg border border-gray-100 space-y-2 bg-gray-50/50">
                          <label className="block font-bold text-gray-700">Alcohol</label>
                          <div className="flex items-center gap-4">
                            {['Yes', 'No', 'Quit'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="alcoholRadio"
                                  value={opt}
                                  checked={familyPersonalHistory.alcohol === opt}
                                  onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, alcohol: e.target.value as any }))}
                                  disabled={isDispatched}
                                  className="text-purple-650 focus:ring-purple-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">No. of bottles/day?</label>
                            <input
                              type="text"
                              value={familyPersonalHistory.alcoholBottlesPerDay}
                              onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, alcoholBottlesPerDay: e.target.value }))}
                              disabled={isDispatched || familyPersonalHistory.alcohol === 'No'}
                              placeholder={familyPersonalHistory.alcohol !== 'No' ? "Specify bottles/day..." : "Select Yes or Quit to enable"}
                              className="form-input text-xs"
                            />
                          </div>
                        </div>

                        {/* Illicit Drugs Section */}
                        <div className="bg-gray-55/40 p-3 rounded-lg border border-gray-100 space-y-2 bg-gray-50/50">
                          <label className="block font-bold text-gray-700">Illicit Drugs</label>
                          <div className="flex items-center gap-4">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="illicitDrugsRadio"
                                  value={opt}
                                  checked={familyPersonalHistory.illicitDrugs === opt}
                                  onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, illicitDrugs: e.target.value as any }))}
                                  disabled={isDispatched}
                                  className="text-purple-650 focus:ring-purple-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Sexual History Screening Section */}
                        <div className="bg-gray-55/40 p-3 rounded-lg border border-gray-100 space-y-2 bg-gray-50/50">
                          <label className="block font-bold text-gray-700">Sexual History Screening</label>
                          <div className="space-y-1">
                            <span className="block text-[10px] font-semibold text-gray-500">Sexually Active?</span>
                            <div className="flex items-center gap-4">
                              {['Yes', 'No'].map(opt => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="sexuallyActiveRadio"
                                    value={opt}
                                    checked={familyPersonalHistory.sexuallyActive === opt}
                                    onChange={(e) => setFamilyPersonalHistory(prev => ({ ...prev, sexuallyActive: e.target.value as any }))}
                                    disabled={isDispatched}
                                    className="text-purple-650 focus:ring-purple-500 w-4 h-4"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>


                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setActiveFPETab(2)}
                        className="btn-secondary text-xs font-bold px-4 py-2"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (familyPersonalHistory.familyConditions.length === 0) {
                            toast.error('Family Medical History selection is required. Check at least one option.');
                            return;
                          }
                          setActiveFPETab(4);
                        }}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-5 py-2 shadow"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content 4: Immunizations */}
                {activeFPETab === 4 && (
                  <div className="card-glass p-5 space-y-5 font-sans">
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <CheckCircle className="w-5 h-5 text-orange-500" /> Immunizations
                    </h2>

                    <div className="space-y-4">
                      {/* FOR CHILDREN */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">FOR CHILDREN</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            'BCG',
                            'OPV1',
                            'OPV2',
                            'OPV3',
                            'DPT1',
                            'DPT2',
                            'DPT3',
                            'Measles',
                            'Hepatitis B1',
                            'Hepatitis B2',
                            'Hepatitis B3',
                            'Hepatitis A',
                            'Varicella (Chicken Pox)',
                            'None'
                          ].map(vacc => (
                            <label key={vacc} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-55 rounded text-xs font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={immunizations.childVaccines.includes(vacc)}
                                disabled={isDispatched}
                                onChange={(e) => handleVaccineChange('child', vacc, e.target.checked)}
                                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                              />
                              <span>{vacc}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* FOR ADULT */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">FOR ADULT</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            'HPV',
                            'MMR',
                            'None'
                          ].map(vacc => (
                            <label key={vacc} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-55 rounded text-xs font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={immunizations.adultVaccines.includes(vacc)}
                                disabled={isDispatched}
                                onChange={(e) => handleVaccineChange('adult', vacc, e.target.checked)}
                                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                              />
                              <span>{vacc}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* FOR PREGNANT WOMEN */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">FOR PREGNANT WOMEN</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            'Tetanus Toxoid',
                            'None'
                          ].map(vacc => (
                            <label key={vacc} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-55 rounded text-xs font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={immunizations.pregVaccines.includes(vacc)}
                                disabled={isDispatched}
                                onChange={(e) => handleVaccineChange('preg', vacc, e.target.checked)}
                                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                              />
                              <span>{vacc}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* FOR ELDERLY AND IMMUNOCOMPROMISED */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">FOR ELDERLY AND IMMUNOCOMPROMISED</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            'Pneumococcal Vaccine',
                            'Flu Vaccine',
                            'None'
                          ].map(vacc => (
                            <label key={vacc} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-55 rounded text-xs font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={immunizations.eldVaccines.includes(vacc)}
                                disabled={isDispatched}
                                onChange={(e) => handleVaccineChange('eld', vacc, e.target.checked)}
                                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                              />
                              <span>{vacc}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* OTHERS, PLEASE SPECIFY */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">OTHERS, PLEASE SPECIFY</label>
                        <textarea
                          value={immunizations.otherVaccines}
                          onChange={(e) => setImmunizations(prev => ({ ...prev, otherVaccines: e.target.value }))}
                          disabled={isDispatched}
                          rows={2}
                          placeholder="Specify other immunization information..."
                          className="form-input text-xs resize-none"
                        />
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setActiveFPETab(3)}
                        className="btn-secondary text-xs font-bold px-4 py-2"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextTab = selectedMember?.sex === 'FEMALE' ? 5 : 6;
                          setActiveFPETab(nextTab);
                        }}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-5 py-2 shadow"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content 5: OB-Gyne History */}
                {activeFPETab === 5 && selectedMember.sex === 'FEMALE' && (
                  <div className="card-glass p-5 space-y-5 font-sans">
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <User className="w-5 h-5 text-pink-500" /> OB-Gyne History
                    </h2>
                    
                    <div className="py-8 text-center text-xs text-gray-400 font-medium">
                      OB-Gyne History fields are temporarily blank.
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setActiveFPETab(4)}
                        className="btn-secondary text-xs font-bold px-4 py-2"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFPETab(6)}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-5 py-2 shadow"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}                {/* Tab Content 6: Pertinent Physical Examination Findings */}
                {activeFPETab === 6 && (
                  <div className="card-glass p-5 space-y-6 font-sans">
                    <div>
                      <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                        <Stethoscope className="w-5 h-5 text-teal-500" /> Pertinent Physical Examination Findings
                      </h2>
                      <p className="text-[11px] text-gray-400 mt-1">Required fields are marked with a red asterisk (*).</p>
                    </div>

                    {/* Section 1 Header */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Section 1: Pertinent Physical Examination Findings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {/* BP Input */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">Blood Pressure *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Systolic"
                              value={vitalsAndPhysicals.bloodPressureSystolic}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, bloodPressureSystolic: e.target.value }))}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center font-mono"
                            />
                            <span className="text-gray-400 font-bold">/</span>
                            <input
                              type="number"
                              placeholder="Diastolic"
                              value={vitalsAndPhysicals.bloodPressureDiastolic}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, bloodPressureDiastolic: e.target.value }))}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center font-mono"
                            />
                            <span className="text-xs font-semibold text-gray-500">mmHg</span>
                          </div>
                        </div>

                        {/* Height Input */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">Height *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="cm"
                              value={vitalsAndPhysicals.heightCm}
                              onChange={(e) => handleHeightChange(e.target.value)}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center font-mono"
                            />
                            <span className="text-xs text-gray-400 font-semibold">cm</span>
                            <input
                              type="text"
                              placeholder="in (read-only)"
                              value={vitalsAndPhysicals.heightIn ? `${vitalsAndPhysicals.heightIn} in` : ''}
                              readOnly
                              className="form-input text-xs w-28 text-center bg-gray-50 text-gray-500 font-mono border-dashed"
                            />
                          </div>
                        </div>

                        {/* Heart Rate */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">Heart Rate *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="beats"
                              value={vitalsAndPhysicals.heartRate}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, heartRate: e.target.value }))}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center font-mono"
                            />
                            <span className="text-xs font-semibold text-gray-500">/min</span>
                          </div>
                        </div>

                        {/* Weight Input */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">Weight *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="kg"
                              value={vitalsAndPhysicals.weightKg}
                              onChange={(e) => handleWeightChange(e.target.value)}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center font-mono"
                            />
                            <span className="text-xs text-gray-400 font-semibold">kg</span>
                            <input
                              type="text"
                              placeholder="lb (read-only)"
                              value={vitalsAndPhysicals.weightLb ? `${vitalsAndPhysicals.weightLb} lb` : ''}
                              readOnly
                              className="form-input text-xs w-28 text-center bg-gray-50 text-gray-500 font-mono border-dashed"
                            />
                          </div>
                        </div>

                        {/* Respiratory Rate */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">Respiratory Rate *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="breaths"
                              value={vitalsAndPhysicals.respiratoryRate}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center font-mono"
                            />
                            <span className="text-xs font-semibold text-gray-500">/min</span>
                          </div>
                        </div>

                        {/* BMI computed */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">BMI *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="BMI (read-only)"
                              value={vitalsAndPhysicals.bmi}
                              readOnly
                              className="form-input text-xs w-28 text-center bg-gray-50 font-mono font-bold text-teal-850"
                            />
                            <button
                              type="button"
                              onClick={handleCalculateBmi}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-all"
                            >
                              Get BMI
                            </button>
                          </div>
                        </div>

                        {/* Visual Acuity */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">Visual Acuity</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Left Eye"
                              value={vitalsAndPhysicals.leftEye}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, leftEye: e.target.value }))}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center"
                            />
                            <span className="text-gray-300">|</span>
                            <input
                              type="text"
                              placeholder="Right Eye"
                              value={vitalsAndPhysicals.rightEye}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, rightEye: e.target.value }))}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center"
                            />
                          </div>
                        </div>

                        {/* Temperature */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-650 mb-1">Temperature *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Temp"
                              value={vitalsAndPhysicals.temperature}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, temperature: e.target.value }))}
                              disabled={isDispatched}
                              className="form-input text-xs w-28 text-center font-mono"
                            />
                            <span className="text-xs font-semibold text-gray-500">°C</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pediatric Client subheading */}
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pediatric Client aged 0–24 months</h4>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-teal-650">
                          <input
                            type="checkbox"
                            checked={vitalsAndPhysicals.isPediatricActive}
                            onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, isPediatricActive: e.target.checked }))}
                            disabled={isDispatched}
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                          <span>Activate Pediatric Form</span>
                        </label>
                      </div>

                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-xs ${!vitalsAndPhysicals.isPediatricActive ? 'opacity-40 select-none pointer-events-none' : ''}`}>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Length (cm)</label>
                          <input
                            type="number"
                            value={vitalsAndPhysicals.lengthCm}
                            onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, lengthCm: e.target.value }))}
                            disabled={isDispatched || !vitalsAndPhysicals.isPediatricActive}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Head Circumference (cm)</label>
                          <input
                            type="number"
                            value={vitalsAndPhysicals.headCircumferenceCm}
                            onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, headCircumferenceCm: e.target.value }))}
                            disabled={isDispatched || !vitalsAndPhysicals.isPediatricActive}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Skinfold Thickness (cm)</label>
                          <input
                            type="number"
                            value={vitalsAndPhysicals.skinfoldThicknessCm}
                            onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, skinfoldThicknessCm: e.target.value }))}
                            disabled={isDispatched || !vitalsAndPhysicals.isPediatricActive}
                            className="form-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Body Circumference: Waist (cm), Hip (cm), Limbs (cm)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Waist"
                              value={vitalsAndPhysicals.waistCircumferenceCm}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, waistCircumferenceCm: e.target.value }))}
                              disabled={isDispatched || !vitalsAndPhysicals.isPediatricActive}
                              className="form-input text-xs text-center"
                            />
                            <input
                              type="number"
                              placeholder="Hip"
                              value={vitalsAndPhysicals.hipCircumferenceCm}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, hipCircumferenceCm: e.target.value }))}
                              disabled={isDispatched || !vitalsAndPhysicals.isPediatricActive}
                              className="form-input text-xs text-center"
                            />
                            <input
                              type="number"
                              placeholder="Limbs"
                              value={vitalsAndPhysicals.limbsCircumferenceCm}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, limbsCircumferenceCm: e.target.value }))}
                              disabled={isDispatched || !vitalsAndPhysicals.isPediatricActive}
                              className="form-input text-xs text-center"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-550 mb-1">Middle and Upper Arm Circumference (cm)</label>
                          <input
                            type="number"
                            value={vitalsAndPhysicals.muacCm}
                            onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, muacCm: e.target.value }))}
                            disabled={isDispatched || !vitalsAndPhysicals.isPediatricActive}
                            className="form-input text-xs max-w-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Blood Type subheading */}
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Type</h4>
                      <div className="flex flex-wrap gap-3 text-xs">
                        {['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'].map(type => (
                          <label key={type} className="flex items-center gap-1.5 cursor-pointer bg-gray-50/60 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-100">
                            <input
                              type="radio"
                              name="bloodTypeRadio"
                              value={type}
                              checked={vitalsAndPhysicals.bloodType === type}
                              onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, bloodType: e.target.value }))}
                              disabled={isDispatched}
                              className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                            />
                            <span className="font-semibold text-gray-800">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* General Survey subheading */}
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">General Survey</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end text-xs">
                        <div className="flex items-center gap-4">
                          {['Awake and alert', 'Altered Sensorium'].map(surv => (
                            <label key={surv} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="generalSurveyRadio"
                                value={surv}
                                checked={vitalsAndPhysicals.generalSurvey === surv}
                                onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, generalSurvey: e.target.value as any }))}
                                disabled={isDispatched}
                                className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                              />
                              <span className="font-semibold text-gray-800">{surv}</span>
                            </label>
                          ))}
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Altered Sensorium Remarks</label>
                          <input
                            type="text"
                            value={vitalsAndPhysicals.alteredSensoriumRemarks}
                            onChange={(e) => setVitalsAndPhysicals(prev => ({ ...prev, alteredSensoriumRemarks: e.target.value }))}
                            disabled={isDispatched || vitalsAndPhysicals.generalSurvey !== 'Altered Sensorium'}
                            placeholder={vitalsAndPhysicals.generalSurvey === 'Altered Sensorium' ? "Specify remarks..." : "Select Altered Sensorium to enable"}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Pertinent Findings Per System */}
                    <div className="pt-4 border-t border-gray-150 space-y-4">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Section 2: Pertinent Findings Per System</h3>
                      
                      <div className="space-y-6">
                        {/* A. HEENT */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>A. HEENT</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.heent.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('heent', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.heent.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, heent: { ...prev.heent, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.heent.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* B. Chest/Breast/Lungs */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>B. Chest/Breast/Lungs</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              'Essentially normal',
                              'Asymmetrical chest expansion',
                              'Decreased breath sounds',
                              'Wheezes',
                              'Lumps over breast(s)',
                              'Crackles/rales',
                              'Retractions',
                              'Others'
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.chest.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('chest', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.chest.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, chest: { ...prev.chest, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.chest.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* C. Heart */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>C. Heart</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              'Essentially normal',
                              'Displaced apex beat',
                              'Heaves/thrills',
                              'Irregular rhythm',
                              'Muffled heart sounds',
                              'Murmurs',
                              'Pericardial bulge',
                              'Others'
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.heart.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('heart', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.heart.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, heart: { ...prev.heart, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.heart.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* D. Abdomen */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>D. Abdomen</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              'Essentially normal',
                              'Abdominal rigidity',
                              'Abdominal tenderness',
                              'Hyperactive bowel sounds',
                              'Palpable mass(es)',
                              'Tympanitic/dull abdomen',
                              'Uterine contraction',
                              'Others'
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.abdomen.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('abdomen', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.abdomen.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, abdomen: { ...prev.abdomen, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.abdomen.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* E. Genitourinary */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>E. Genitourinary</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              'Essentially normal',
                              'Blood stained in exam finger',
                              'Cervical dilatation',
                              'Presence of abnormal discharge',
                              'Others'
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.genitourinary.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('genitourinary', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.genitourinary.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, genitourinary: { ...prev.genitourinary, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.genitourinary.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* F. Digital Rectal Examination */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>F. Digital Rectal Examination</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              'Essentially normal',
                              'Enlarge Prostate',
                              'Mass',
                              'Hemorrhoids',
                              'Pus',
                              'Not Applicable',
                              'Others'
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.dre.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('dre', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.dre.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, dre: { ...prev.dre, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.dre.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* G. Skin/Extremities */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>G. Skin/Extremities</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              'Essentially normal',
                              'Clubbing',
                              'Cold clammy',
                              'Cyanosis/mottled skin',
                              'Edema/swelling',
                              'Decreased mobility',
                              'Pale nailbeds',
                              'Poor skin turgor',
                              'Rashes/Petechiae',
                              'Weak pulses',
                              'Others'
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.skin.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('skin', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.skin.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, skin: { ...prev.skin, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.skin.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        {/* H. Neurological Examination */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-800"><u>H. Neurological Examination</u></h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {[
                              'Essentially normal',
                              'Abnormal gait',
                              'Abnormal position sense',
                              'Abnormal sensation',
                              'Abnormal reflex(es)',
                              'Poor/altered memory',
                              'Poor muscle tone/strength',
                              'Poor coordination',
                              'Others'
                            ].map(item => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={findingsPerSystem.neuro.list.includes(item)}
                                  disabled={isDispatched}
                                  onChange={(e) => handleSystemFindingChange('neuro', item, e.target.checked)}
                                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                          <div>
                            <textarea
                              value={findingsPerSystem.neuro.otherText}
                              onChange={(e) => setFindingsPerSystem(prev => ({ ...prev, neuro: { ...prev.neuro, otherText: e.target.value } }))}
                              disabled={isDispatched || !findingsPerSystem.neuro.list.includes('Others')}
                              rows={2}
                              placeholder="Others, specify..."
                              className="form-input text-xs resize-none bg-gray-50/50 disabled:bg-gray-100 disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          const prevTab = selectedMember?.sex === 'FEMALE' ? 5 : 4;
                          setActiveFPETab(prevTab);
                        }}
                        className="btn-secondary text-xs font-bold px-4 py-2"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!vitalsAndPhysicals.bloodPressureSystolic || !vitalsAndPhysicals.bloodPressureDiastolic || !vitalsAndPhysicals.heightCm || !vitalsAndPhysicals.weightKg || !vitalsAndPhysicals.heartRate || !vitalsAndPhysicals.respiratoryRate || !vitalsAndPhysicals.temperature || !vitalsAndPhysicals.bmi) {
                            toast.error('Please fill in all required fields marked with * in Category 6 (BP, Height, Weight, HR, RR, Temp, BMI).');
                            return;
                          }
                          setActiveFPETab(7);
                        }}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-5 py-2 shadow"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}
                {/* Tab Content 7: NCD High-Risk Assessment */}
                {activeFPETab === 7 && (
                  <div className="card-glass p-5 space-y-6 font-sans">
                    <div>
                      <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b pb-2 font-sans">
                        <AlertCircle className="w-5 h-5 text-red-500 font-sans" /> NCD HIGH-RISK ASSESSMENT (for 25 years old and above)
                      </h2>
                    </div>

                    {/* Section 1: Lifestyle/Behavioral Risk Factors */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Section 1: Lifestyle/Behavioral Risk Factors</h3>
                      
                      {/* High Fat/High Salt Food Intake */}
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2">
                        <h4 className="text-xs font-bold italic text-gray-700">High Fat/High Salt Food Intake</h4>
                        <div className="space-y-2 text-xs">
                          <p className="font-medium text-gray-700">Eats processed/fast foods (e.g. instant noodles, hamburgers, fries, fried chicken skin etc.) and ihaw-ihaw (e.g. isaw, adidas, etc.) weekly</p>
                          <div className="flex gap-4">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="processedFoodsWeekly"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.processedFoodsWeekly === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, processedFoodsWeekly: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Dietary Fiber Intake */}
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <h4 className="text-xs font-bold italic text-gray-700">Dietary Fiber Intake</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700">3 Servings vegetables daily</p>
                            <div className="flex gap-4">
                              {['Yes', 'No'].map(opt => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="vegServingsDaily"
                                    value={opt}
                                    checked={ncdHighRiskAssessment.vegServingsDaily === opt}
                                    onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, vegServingsDaily: e.target.value }))}
                                    disabled={isDispatched}
                                    className="text-red-600 focus:ring-red-500 w-4 h-4"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700">2-3 servings of fruits daily</p>
                            <div className="flex gap-4">
                              {['Yes', 'No'].map(opt => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="fruitServingsDaily"
                                    value={opt}
                                    checked={ncdHighRiskAssessment.fruitServingsDaily === opt}
                                    onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, fruitServingsDaily: e.target.value }))}
                                    disabled={isDispatched}
                                    className="text-red-600 focus:ring-red-500 w-4 h-4"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Physical Activities */}
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2">
                        <h4 className="text-xs font-bold italic text-gray-700">Physical Activities</h4>
                        <div className="space-y-2 text-xs">
                          <p className="font-medium text-gray-700">Does at least 2.5 hours a week of moderate-intensity physical activity</p>
                          <div className="flex gap-4">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="moderateActivityWeekly"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.moderateActivityWeekly === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, moderateActivityWeekly: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Presence or Absence of Diabetes */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Section 2: Presence or Absence of Diabetes</h3>
                      
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3 text-xs">
                        <div className="space-y-2">
                          <p className="font-medium text-gray-700">Was patient diagnosed as having diabetes?</p>
                          <div className="flex gap-4">
                            {['Yes', 'No', 'Do Not Know'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="diagnosedDiabetes"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.diagnosedDiabetes === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, diagnosedDiabetes: e.target.value, diabetesMeds: e.target.value === 'Yes' ? prev.diabetesMeds : '' }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {ncdHighRiskAssessment.diagnosedDiabetes === 'Yes' && (
                          <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg space-y-2 ml-4 animate-fade-in">
                            <span className="font-semibold text-red-800">Diabetes Treatment Management:</span>
                            <div className="flex gap-4">
                              {['With Medication', 'Without Medication'].map(opt => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-red-900 font-medium">
                                  <input
                                    type="radio"
                                    name="diabetesMeds"
                                    value={opt}
                                    checked={ncdHighRiskAssessment.diabetesMeds === opt}
                                    onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, diabetesMeds: e.target.value }))}
                                    disabled={isDispatched}
                                    className="text-red-600 focus:ring-red-500 w-4 h-4"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-[10px] text-red-600 font-bold italic mt-1">&rarr; and perform Urine Test for Ketones.</p>
                          </div>
                        )}

                        {(ncdHighRiskAssessment.diagnosedDiabetes === 'No' || ncdHighRiskAssessment.diagnosedDiabetes === 'Do Not Know') && (
                          <p className="text-[10px] text-gray-500 font-semibold italic ml-4">&rarr; proceed to question 2.</p>
                        )}

                        <div className="space-y-2 pt-2 border-t border-gray-100/50">
                          <p className="font-medium text-gray-700">Does patient have the following symptoms?</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-4">
                            {/* Polyphagia */}
                            <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium">Polyphagia</span>
                              <div className="flex gap-2">
                                {['Yes', 'No'].map(opt => (
                                  <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="polyphagiaRadio"
                                      value={opt}
                                      checked={ncdHighRiskAssessment.polyphagia === opt}
                                      onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, polyphagia: e.target.value }))}
                                      disabled={isDispatched}
                                      className="text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {/* Polydipsia */}
                            <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium">Polydipsia</span>
                              <div className="flex gap-2">
                                {['Yes', 'No'].map(opt => (
                                  <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="polydipsiaRadio"
                                      value={opt}
                                      checked={ncdHighRiskAssessment.polydipsia === opt}
                                      onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, polydipsia: e.target.value }))}
                                      disabled={isDispatched}
                                      className="text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {/* Polyuria */}
                            <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                              <span className="font-medium">Polyuria</span>
                              <div className="flex gap-2">
                                {['Yes', 'No'].map(opt => (
                                  <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="polyuriaRadio"
                                      value={opt}
                                      checked={ncdHighRiskAssessment.polyuria === opt}
                                      onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, polyuria: e.target.value }))}
                                      disabled={isDispatched}
                                      className="text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          {([ncdHighRiskAssessment.polyphagia, ncdHighRiskAssessment.polydipsia, ncdHighRiskAssessment.polyuria].filter(v => v === 'Yes').length >= 2) && (
                            <p className="text-[10px] text-blue-600 font-bold italic ml-4">&rarr; If two or more of the above symptoms are present, perform a blood glucose test.</p>
                          )}
                        </div>
                      </div>

                      {/* Raised Blood Glucose */}
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold italic text-gray-700">Raised Blood Glucose</h4>
                          <div className="flex gap-3">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                                <input
                                  type="radio"
                                  name="raisedBloodGlucose"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.raisedBloodGlucose === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, raisedBloodGlucose: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">FBS/RBS (mg/dL)</label>
                            <input
                              type="number"
                              placeholder="mg/dL"
                              value={ncdHighRiskAssessment.fbsMgDl}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, fbsMgDl: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.raisedBloodGlucose !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">FBS/RBS (mmol/L)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="mmol/L"
                              value={ncdHighRiskAssessment.fbsMmolL}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, fbsMmolL: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.raisedBloodGlucose !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">Date Taken</label>
                            <input
                              type="date"
                              value={ncdHighRiskAssessment.fbsDate}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, fbsDate: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.raisedBloodGlucose !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Raised Blood Lipids */}
                      <div className="bg-gray-55/40 p-4 rounded-xl border border-gray-100 space-y-3 text-xs bg-gray-50/50">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold italic text-gray-700">Raised Blood Lipids</h4>
                          <div className="flex gap-3">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                                <input
                                  type="radio"
                                  name="raisedBloodLipids"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.raisedBloodLipids === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, raisedBloodLipids: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">Total Cholesterol (mg/dL)</label>
                            <input
                              type="number"
                              placeholder="Total Cholesterol"
                              value={ncdHighRiskAssessment.cholesterolVal}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, cholesterolVal: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.raisedBloodLipids !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">Date Taken</label>
                            <input
                              type="date"
                              value={ncdHighRiskAssessment.cholesterolDate}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, cholesterolDate: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.raisedBloodLipids !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Presence of Urine Ketones */}
                      <div className="bg-gray-55/40 p-4 rounded-xl border border-gray-100 space-y-3 text-xs bg-gray-50/50">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold italic text-gray-700">Presence of Urine Ketones</h4>
                          <div className="flex gap-3">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                                <input
                                  type="radio"
                                  name="urineKetones"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.urineKetones === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, urineKetones: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">Urine Ketone</label>
                            <input
                              type="text"
                              placeholder="Urine Ketone"
                              value={ncdHighRiskAssessment.ketonesVal}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, ketonesVal: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.urineKetones !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">Date Taken</label>
                            <input
                              type="date"
                              value={ncdHighRiskAssessment.ketonesDate}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, ketonesDate: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.urineKetones !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Presence of Urine Protein */}
                      <div className="bg-gray-55/40 p-4 rounded-xl border border-gray-100 space-y-3 text-xs bg-gray-50/50">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold italic text-gray-700">Presence of Urine Protein</h4>
                          <div className="flex gap-3">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                                <input
                                  type="radio"
                                  name="urineProtein"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.urineProtein === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, urineProtein: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">Urine Protein</label>
                            <input
                              type="text"
                              placeholder="Urine Protein"
                              value={ncdHighRiskAssessment.proteinVal}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, proteinVal: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.urineProtein !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold text-gray-550 mb-1">Date Taken</label>
                            <input
                              type="date"
                              value={ncdHighRiskAssessment.proteinDate}
                              onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, proteinDate: e.target.value }))}
                              disabled={isDispatched || ncdHighRiskAssessment.urineProtein !== 'Yes'}
                              className="form-input text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Angina, Heart Attack, Stroke/TIA */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Section 3: Angina, Heart Attack, Stroke or TIA</h3>
                      
                      {/* Angina or Heart Attack */}
                      <div className="bg-gray-55/40 p-4 rounded-xl border border-gray-100 space-y-3 text-xs bg-gray-50/50">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="font-bold italic text-gray-700">Angina or Heart Attack</h4>
                          <div className="flex gap-3">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                                <input
                                  type="radio"
                                  name="anginaHeartAttack"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.anginaHeartAttack === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, anginaHeartAttack: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {ncdHighRiskAssessment.anginaHeartAttack === 'Yes' && (
                          <div className="space-y-4 ml-2 animate-fade-in">
                            {/* Question 1 */}
                            <div className="space-y-1">
                              <p className="font-medium text-gray-700">1. Have you had any pain or discomfort or any pressure or heaviness in your chest?</p>
                              <div className="flex gap-4">
                                {['Yes', 'No'].map(opt => (
                                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="qChestPain"
                                      value={opt}
                                      checked={ncdHighRiskAssessment.qChestPain === opt}
                                      onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qChestPain: e.target.value }))}
                                      disabled={isDispatched}
                                      className="text-red-600 focus:ring-red-500 w-4 h-4"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                              {ncdHighRiskAssessment.qChestPain === 'No' && (
                                <p className="text-[10px] text-gray-400 italic">&rarr; skip to Question 8</p>
                              )}
                            </div>

                            {/* Question 2 */}
                            {ncdHighRiskAssessment.qChestPain === 'Yes' && (
                              <div className="space-y-1 ml-4 animate-fade-in">
                                <p className="font-medium text-gray-700">2. Do you get the pain in the center of the chest or left arm?</p>
                                <div className="flex gap-4">
                                  {['Yes', 'No'].map(opt => (
                                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="radio"
                                        name="qPainCenterLeftArm"
                                        value={opt}
                                        checked={ncdHighRiskAssessment.qPainCenterLeftArm === opt}
                                        onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qPainCenterLeftArm: e.target.value }))}
                                        disabled={isDispatched}
                                        className="text-red-600 focus:ring-red-500 w-4 h-4"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                                </div>
                                {ncdHighRiskAssessment.qPainCenterLeftArm === 'No' && (
                                  <p className="text-[10px] text-gray-400 italic">&rarr; skip to Question 8</p>
                                )}
                              </div>
                            )}

                            {/* Subsequent Questions */}
                            {ncdHighRiskAssessment.qChestPain === 'Yes' && ncdHighRiskAssessment.qPainCenterLeftArm === 'Yes' && (
                              <div className="space-y-4 ml-8 animate-fade-in">
                                <div className="space-y-1">
                                  <p className="font-medium text-gray-700">3. Do you get it when you walk uphill or hurry?</p>
                                  <div className="flex gap-4">
                                    {['Yes', 'No'].map(opt => (
                                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name="qWalkUphill"
                                          value={opt}
                                          checked={ncdHighRiskAssessment.qWalkUphill === opt}
                                          onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qWalkUphill: e.target.value }))}
                                          disabled={isDispatched}
                                          className="text-red-600 focus:ring-red-500 w-4 h-4"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="font-medium text-gray-700">4. Do you slow down if you get the pain while walking?</p>
                                  <div className="flex gap-4">
                                    {['Yes', 'No'].map(opt => (
                                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name="qSlowDown"
                                          value={opt}
                                          checked={ncdHighRiskAssessment.qSlowDown === opt}
                                          onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qSlowDown: e.target.value }))}
                                          disabled={isDispatched}
                                          className="text-red-600 focus:ring-red-500 w-4 h-4"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="font-medium text-gray-700">5. Does the pain go away if you stand still or if you take a tablet under the tongue?</p>
                                  <div className="flex gap-4">
                                    {['Yes', 'No'].map(opt => (
                                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name="qPainStandStill"
                                          value={opt}
                                          checked={ncdHighRiskAssessment.qPainStandStill === opt}
                                          onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qPainStandStill: e.target.value }))}
                                          disabled={isDispatched}
                                          className="text-red-600 focus:ring-red-500 w-4 h-4"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="font-medium text-gray-700">6. Does the pain go away in less than 10 minutes?</p>
                                  <div className="flex gap-4">
                                    {['Yes', 'No'].map(opt => (
                                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name="qPainAwayTenMins"
                                          value={opt}
                                          checked={ncdHighRiskAssessment.qPainAwayTenMins === opt}
                                          onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qPainAwayTenMins: e.target.value }))}
                                          disabled={isDispatched}
                                          className="text-red-600 focus:ring-red-500 w-4 h-4"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="font-medium text-gray-700">7. Have you ever had a severe chest pain across the front of your chest lasting for half an hour or more?</p>
                                  <div className="flex gap-4">
                                    {['Yes', 'No'].map(opt => (
                                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name="qSevereChestPain"
                                          value={opt}
                                          checked={ncdHighRiskAssessment.qSevereChestPain === opt}
                                          onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qSevereChestPain: e.target.value }))}
                                          disabled={isDispatched}
                                          className="text-red-600 focus:ring-red-500 w-4 h-4"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Interpretive note */}
                                {([ncdHighRiskAssessment.qWalkUphill, ncdHighRiskAssessment.qSlowDown, ncdHighRiskAssessment.qPainStandStill, ncdHighRiskAssessment.qPainAwayTenMins, ncdHighRiskAssessment.qSevereChestPain].some(v => v === 'Yes')) && (
                                  <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2.5 rounded border border-red-100">&rarr; If the answer to Question 3 or 4 or 5 or 6 or 7 is Yes, patient have angina or heart attack and needs to see the doctor</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Stroke and TIA */}
                      <div className="bg-gray-55/40 p-4 rounded-xl border border-gray-100 space-y-3 text-xs bg-gray-50/50">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="font-bold italic text-gray-700">Stroke and TIA (Transient Ischemic Attack)</h4>
                          <div className="flex gap-3">
                            {['Yes', 'No'].map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                                <input
                                  type="radio"
                                  name="strokeTia"
                                  value={opt}
                                  checked={ncdHighRiskAssessment.strokeTia === opt}
                                  onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, strokeTia: e.target.value }))}
                                  disabled={isDispatched}
                                  className="text-red-600 focus:ring-red-500 w-4 h-4"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {ncdHighRiskAssessment.strokeTia === 'Yes' && (
                          <div className="space-y-3 ml-2 animate-fade-in">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-700">8. Have you ever had any of the following: difficulty in talking, weakness of arm and/or leg on one side of the body or numbness on one side of the body?</p>
                              <div className="flex gap-4">
                                {['Yes', 'No'].map(opt => (
                                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="qDifficultyTalkingWeakness"
                                      value={opt}
                                      checked={ncdHighRiskAssessment.qDifficultyTalkingWeakness === opt}
                                      onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, qDifficultyTalkingWeakness: e.target.value }))}
                                      disabled={isDispatched}
                                      className="text-red-600 focus:ring-red-500 w-4 h-4"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {ncdHighRiskAssessment.qDifficultyTalkingWeakness === 'Yes' && (
                              <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2.5 rounded border border-red-100">&rarr; If the answer to question 8 is YES, the patient may have had a TIA or stroke and needs to see the doctor</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 4: Risk Level */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Section 4: Risk Level</h3>
                      
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">RISK LEVEL</h4>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {['<10%', '10% to <20%', '20% to <30%', '30% to <40%', '≥ 40%'].map(lvl => (
                            <label key={lvl} className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-155 hover:bg-gray-50">
                              <input
                                type="radio"
                                name="riskLevelRadio"
                                value={lvl}
                                checked={ncdHighRiskAssessment.riskLevel === lvl}
                                onChange={(e) => setNcdHighRiskAssessment(prev => ({ ...prev, riskLevel: e.target.value }))}
                                disabled={isDispatched}
                                className="text-red-600 focus:ring-red-500 w-4 h-4"
                              />
                              <span className="font-semibold text-gray-800">{lvl}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Navigation and Save Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-gray-150">
                      <button
                        type="button"
                        onClick={() => setActiveFPETab(6)}
                        className="btn-secondary text-xs font-bold px-4 py-2 w-full sm:w-auto"
                      >
                        &larr; Back
                      </button>
                      <div className="flex-1" />
                      {!isDispatched && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleSave(false)}
                            className="btn-secondary text-xs font-bold px-5 py-2 w-full sm:w-auto hover:bg-gray-100"
                          >
                            Save Record
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSave(true)}
                            className="btn-primary bg-red-600 hover:bg-red-750 text-xs font-bold px-6 py-2 text-white shadow w-full sm:w-auto"
                          >
                            Save & Finalize
                          </button>
                        </div>
                      )}
                    </div>
                    {isDispatched && (
                      <p className="text-xs text-red-500 font-bold text-center mt-2">
                        This record has been finalized and cannot be edited.
                      </p>
                    )}
                  </div>
                )}
              </>
            ))}
          </div>

          {/* Right Panel / Compliance & Actions */}
          {isCaseClicked && isActiveFPE && (
            <div className="space-y-6 animate-fade-in font-sans">

              {/* Actions Panel */}
              <div className="space-y-4">
                <div className="card-glass p-5 border-t-4 border-t-navy-900" style={{ borderTopColor: '#0A1628' }}>
                  <h2 className="text-lg font-bold text-gray-900 mb-1 font-sans">Record Status</h2>
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

                  <div className="space-y-2 mt-4 font-sans">
                    <button
                      onClick={handleDispatch}
                      disabled={((currentFPE?.status as string) !== 'Finalized') || isDispatching}
                      className={`btn-primary w-full justify-center ${(currentFPE?.status === 'Dispatched') ? 'opacity-50 cursor-not-allowed bg-gray-400' : ((currentFPE?.status as string) === 'Finalized' ? 'bg-philgreen hover:bg-emerald-700' : 'opacity-50 cursor-not-allowed bg-gray-400')}`}
                    >
                      {isDispatching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : currentFPE?.status === 'Dispatched' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                      {isDispatching ? 'Dispatching...' : (currentFPE?.status === 'Dispatched' ? 'Successfully Dispatched' : 'Direct PHIC Dispatch')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
