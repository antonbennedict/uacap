'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSession } from 'next-auth/react';
import PrescriptionSlip from '@/components/PrescriptionSlip';
import { getMedicineStatus, type Member, type Clinic, type Medicine, type PrescriptionItem, type Prescription } from '@/lib/types';
import { generateRxNumber, formatCurrency, formatDateTime } from '@/lib/utils';
import {
  FileText, Plus, Trash2, Search, Printer, CheckCircle,
  AlertTriangle, XCircle, ChevronDown, User, X, UploadCloud, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const allClinics: Clinic[] = [{
  id: 'clinic-001',
  name: 'University of the Assumption Clinic',
  shortName: 'UA Clinic',
  address: 'Unite Site, Del Pilar',
  city: 'San Fernando',
  province: 'Pampanga',
  zipCode: '2000',
  latitude: 15.0298,
  longitude: 120.6807,
  phone: '0917-123-4567',
  email: 'uaclinic@ua.edu.ph',
  operatingHours: { weekdays: '8AM-5PM', saturday: '8AM-12PM', sunday: 'Closed' },
  philhealthAccredited: true,
  phicCode: 'R3-PMP-2024-001'
}];

const PHYSICIANS = [
  { name: 'Dr. Rosa Lim, MD', license: 'PRC-MD-2018-045678' },
  { name: 'Dr. Pedro Ocampo, MD, FPCP', license: 'PRC-MD-2010-023456' },
  { name: 'Dr. Emmanuel Buenaventura, MD', license: 'PRC-MD-2015-067890' },
  { name: 'Dr. Maribel Santos-Garcia, MD', license: 'PRC-MD-2012-034567' },
];

const DRUG_LIBRARY = [
  // Anti-Infectious (21)
  { genericName: 'Albendazole', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '400mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 15.00 },
  { genericName: 'Amoxicillin', category: 'Anti-Infectious', isEssential: true, salt: 'Trihydrate', strength: '500mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 3.50 },
  { genericName: 'Azithromycin', category: 'Anti-Infectious', isEssential: false, salt: 'Dihydrate', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 30', price: 45.00 },
  { genericName: 'Cefixime', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '200mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 18.00 },
  { genericName: 'Cefuroxime', category: 'Anti-Infectious', isEssential: false, salt: 'Axetil', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 25.00 },
  { genericName: 'Ciprofloxacin', category: 'Anti-Infectious', isEssential: true, salt: 'HCl', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 5.00 },
  { genericName: 'Clarithromycin', category: 'Anti-Infectious', isEssential: true, salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 30.00 },
  { genericName: 'Clindamycin', category: 'Anti-Infectious', isEssential: false, salt: 'HCl', strength: '300mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 12.00 },
  { genericName: 'Clotrimazole', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '1%', form: 'Cream', unit: 'Tube', package: 'Tube of 5g', price: 120.00 },
  { genericName: 'Cloxacillin', category: 'Anti-Infectious', isEssential: false, salt: 'Sodium', strength: '500mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 6.00 },
  { genericName: 'Co-amoxiclav', category: 'Anti-Infectious', isEssential: true, salt: 'Amoxicillin + Potassium Clavulanate', strength: '625mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 35.00 },
  { genericName: 'Co-trimoxazole', category: 'Anti-Infectious', isEssential: true, salt: 'Sulfamethoxazole + Trimethoprim', strength: '800mg + 160mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 8.00 },
  { genericName: 'Doxycycline', category: 'Anti-Infectious', isEssential: false, salt: 'Hyclate', strength: '100mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 7.00 },
  { genericName: 'Erythromycin', category: 'Anti-Infectious', isEssential: false, salt: 'Stearate', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 15.00 },
  { genericName: 'Fluconazole', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '150mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 10', price: 95.00 },
  { genericName: 'Ketoconazole', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '2%', form: 'Cream', unit: 'Tube', package: 'Tube of 10g', price: 180.00 },
  { genericName: 'Mebendazole', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 10.00 },
  { genericName: 'Metronidazole', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50 },
  { genericName: 'Nitrofurantoin', category: 'Anti-Infectious', isEssential: true, salt: 'Macrocrystals', strength: '100mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 22.00 },
  { genericName: 'Oseltamivir', category: 'Anti-Infectious', isEssential: false, salt: 'Phosphate', strength: '75mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 10', price: 140.00 },
  { genericName: 'Tobramycin', category: 'Anti-Infectious', isEssential: false, salt: '', strength: '0.3%', form: 'Eye Drops', unit: 'Bottle', package: 'Bottle of 5ml', price: 250.00 },

  // Anti-Hypertensive & Cardiology (18)
  { genericName: 'Amlodipine', category: 'Anti-Hypertensive & Cardiology', isEssential: true, salt: 'Besilate', strength: '5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.00 },
  { genericName: 'Atenolol', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50 },
  { genericName: 'Captopril', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '25mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50 },
  { genericName: 'Clonidine', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: 'HCl', strength: '75mcg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 8.00 },
  { genericName: 'Diltiazem', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: 'HCl', strength: '60mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 15.00 },
  { genericName: 'Enalapril', category: 'Anti-Hypertensive & Cardiology', isEssential: true, salt: 'Maleate', strength: '5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.00 },
  { genericName: 'Enalapril + Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: 'Maleate + Hydrochlorothiazide', strength: '20mg + 12.5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 12.00 },
  { genericName: 'Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology', isEssential: true, salt: '', strength: '25mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.50 },
  { genericName: 'Isosorbide Dinitrate', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 14.00 },
  { genericName: 'Isosorbide Mononitrate', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '30mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 11.00 },
  { genericName: 'Losartan', category: 'Anti-Hypertensive & Cardiology', isEssential: true, salt: 'Potassium', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.00 },
  { genericName: 'Methyldopa', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '250mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 9.00 },
  { genericName: 'Metoprolol', category: 'Anti-Hypertensive & Cardiology', isEssential: true, salt: 'Succinate', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50 },
  { genericName: 'Tamsulosin', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: 'HCl', strength: '400mcg', form: 'Capsule', unit: 'Capsule', package: 'Box of 30', price: 28.00 },
  { genericName: 'Telmisartan', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '40mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 16.00 },
  { genericName: 'Telmisartan + Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '40mg + 12.5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 20.00 },
  { genericName: 'Valsartan', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '80mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 18.00 },
  { genericName: 'Valsartan + Hydrochlorothiazide', category: 'Anti-Hypertensive & Cardiology', isEssential: false, salt: '', strength: '80mg + 12.5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 24.00 },

  // Anti-Asthma & COPD (8)
  { genericName: 'Budesonide + Formoterol', category: 'Anti-Asthma & COPD', isEssential: false, salt: '', strength: '160mcg + 4.5mcg', form: 'Inhaler', unit: 'Inhaler', package: '120 doses', price: 850.00 },
  { genericName: 'Fluticasone + Salmeterol', category: 'Anti-Asthma & COPD', isEssential: true, salt: '', strength: '250mcg + 50mcg', form: 'Inhaler', unit: 'Inhaler', package: '60 doses', price: 650.00 },
  { genericName: 'Ipratropium', category: 'Anti-Asthma & COPD', isEssential: false, salt: 'Bromide', strength: '250mcg/ml', form: 'Nebulizing Solution', unit: 'Nebule', package: 'Box of 20', price: 25.00 },
  { genericName: 'Ipratropium + Salbutamol', category: 'Anti-Asthma & COPD', isEssential: false, salt: '', strength: '500mcg + 2.5mg', form: 'Nebulizing Solution', unit: 'Nebule', package: 'Box of 30', price: 18.00 },
  { genericName: 'Montelukast', category: 'Anti-Asthma & COPD', isEssential: false, salt: 'Sodium', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 30', price: 15.00 },
  { genericName: 'Prednisone', category: 'Anti-Asthma & COPD', isEssential: true, salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50 },
  { genericName: 'Salbutamol', category: 'Anti-Asthma & COPD', isEssential: true, salt: 'Sulfate', strength: '2mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.50 },
  { genericName: 'Tiotropium', category: 'Anti-Asthma & COPD', isEssential: false, salt: 'Bromide', strength: '18mcg', form: 'Rotacap', unit: 'Capsule', package: 'Box of 30', price: 45.00 },

  // Anti-Diabetics (3)
  { genericName: 'Dapagliflozin', category: 'Anti-Diabetics', isEssential: false, salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 30', price: 38.00 },
  { genericName: 'Gliclazide', category: 'Anti-Diabetics', isEssential: true, salt: '', strength: '80mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 5.00 },
  { genericName: 'Metformin', category: 'Anti-Diabetics', isEssential: true, salt: 'HCl', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.80 },

  // Anti-Dyslipidemia (4)
  { genericName: 'Atorvastatin', category: 'Anti-Dyslipidemia', isEssential: false, salt: 'Calcium', strength: '20mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 10.00 },
  { genericName: 'Fenofibrate', category: 'Anti-Dyslipidemia', isEssential: false, salt: '', strength: '160mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 30', price: 22.00 },
  { genericName: 'Rosuvastatin', category: 'Anti-Dyslipidemia', isEssential: false, salt: 'Calcium', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 14.00 },
  { genericName: 'Simvastatin', category: 'Anti-Dyslipidemia', isEssential: true, salt: '', strength: '20mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.00 },

  // Anti-Thrombotics (2)
  { genericName: 'Aspirin', category: 'Anti-Thrombotics', isEssential: true, salt: '', strength: '80mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.50 },
  { genericName: 'Clopidogrel', category: 'Anti-Thrombotics', isEssential: false, salt: 'Bisulfate', strength: '75mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 6.50 },

  // Nervous System (1)
  { genericName: 'Gabapentin', category: 'Nervous System', isEssential: false, salt: '', strength: '300mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 16.00 },

  // Supportive/Other Therapy (18)
  { genericName: 'Aluminum Hydroxide + Magnesium Hydroxide', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '200mg + 200mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.00 },
  { genericName: 'Butamirate', category: 'Supportive/Other Therapy', isEssential: false, salt: 'Citrate', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 18.00 },
  { genericName: 'Celecoxib', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '200mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 8.50 },
  { genericName: 'Cetirizine', category: 'Supportive/Other Therapy', isEssential: false, salt: 'Dihydrochloride', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.50 },
  { genericName: 'Chlorphenamine', category: 'Supportive/Other Therapy', isEssential: true, salt: 'Maleate', strength: '4mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.00 },
  { genericName: 'Colchicine', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '500mcg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 5.50 },
  { genericName: 'Diphenhydramine', category: 'Supportive/Other Therapy', isEssential: false, salt: 'HCl', strength: '50mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 2.00 },
  { genericName: 'Ferrous Salt', category: 'Supportive/Other Therapy', isEssential: false, salt: 'Sulfate', strength: '325mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.50 },
  { genericName: 'Folic Acid + Iron Ferrous', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '400mcg + 60mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50 },
  { genericName: 'Ibuprofen', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '400mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.00 },
  { genericName: 'Lagundi', category: 'Supportive/Other Therapy', isEssential: false, salt: 'Vitex negundo', strength: '600mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 6.00 },
  { genericName: 'Loratadine', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50 },
  { genericName: 'Mefenamic Acid', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.50 },
  { genericName: 'Naproxen', category: 'Supportive/Other Therapy', isEssential: false, salt: 'Sodium', strength: '550mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 8.00 },
  { genericName: 'Omeprazole', category: 'Supportive/Other Therapy', isEssential: false, salt: '', strength: '20mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 5.00 },
  { genericName: 'Oral Rehydration Salts', category: 'Supportive/Other Therapy', isEssential: true, salt: 'Anhydrous Glucose + Sodium Chloride + etc', strength: '20.5g', form: 'Sachet', unit: 'Sachet', package: 'Box of 25', price: 7.00 },
  { genericName: 'Paracetamol', category: 'Supportive/Other Therapy', isEssential: true, salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.00 },
  { genericName: 'Zinc', category: 'Supportive/Other Therapy', isEssential: false, salt: 'Sulfate', strength: '20mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50 },
];

const CATEGORIES = [
  'Anti-Infectious',
  'Anti-Hypertensive & Cardiology',
  'Anti-Asthma & COPD',
  'Anti-Diabetics',
  'Anti-Dyslipidemia',
  'Anti-Thrombotics',
  'Nervous System',
  'Supportive/Other Therapy'
];

interface RxItem {
  id: string;
  genericName: string;
  salt: string;
  strength: string;
  form: string;
  unit: string;
  package: string;
  isOther: boolean;
  category: string;
  quantity: number;
  actualUnitPrice: number;
  isDispensed: 'Yes' | 'No';
  // Instruction
  adviseQty: string;
  adviseStrength: string;
  adviseFrequency: string;
  remarks: string;
}

export default function PrescriptionBuilderPage() {
  const { data: session } = useSession();
  const [medicines, setMedicines] = useState<any[]>([]);

  const fetchMedicines = useCallback(() => {
    fetch('/api/medicines')
      .then(r => r.json())
      .then(d => {
        if (d.medicines) setMedicines(d.medicines);
      })
      .catch(console.error);
  }, []);

  const deductStock = useCallback(async (medicineId: string, quantity: number, rxNumber: string) => {
    try {
      const res = await fetch('/api/medicines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', medicineId, quantity }),
      });
      if (!res.ok) {
        throw new Error('Failed to deduct stock');
      }
      fetchMedicines();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to deduct stock for medicine ID: ${medicineId}`);
    }
  }, [fetchMedicines]);

  const addPrescription = useCallback(async (prescription: Prescription) => {
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescription),
      });
      if (!res.ok) {
        throw new Error('Failed to save prescription');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save prescription to database.');
    }
  }, []);

  const addAuditEntry = useCallback(async (entry: any) => {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch('/api/members').then(r => r.json()).then(d => {
      if(d.members) setAllMembers(d.members);
    }).catch(console.error);
    fetchMedicines();
  }, [fetchMedicines]);

  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [isActiveRx, setIsActiveRx] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizedPrescription, setFinalizedPrescription] = useState<Prescription | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchedRxId, setDispatchedRxId] = useState<string | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);
  const [isCaseClicked, setIsCaseClicked] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (!selectedMember) {
      setPrescriptions([]);
      setSelectedPrescription(null);
      setIsActiveRx(false);
      setIsCaseClicked(false);
      return;
    }
    setIsCaseClicked(false);

    const fetchPrescriptions = async () => {
      try {
        const res = await fetch(`/api/prescriptions?memberPin=${selectedMember.philhealthPin}`);
        const data = await res.json();
        if (data.prescriptions) {
          setPrescriptions(data.prescriptions);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPrescriptions();
  }, [selectedMember]);

  const selectedClinic = allClinics[0];

  const filteredMembers = allMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.philhealthPin.toLowerCase().includes(q)
    );
  });

  // DRUG PRESCRIPTION FORM STATE
  const [withPrescribe, setWithPrescribe] = useState(true);
  
  // Top Row
  const defaultPhysicianName = session?.user?.name || PHYSICIANS[0].name;
  const [isDispensedInput, setIsDispensedInput] = useState<'Yes' | 'No'>('Yes');
  const [dispensingPersonnel, setDispensingPersonnel] = useState('');
  const [dispenseDate, setDispenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Drug Selector & Details
  const [drugSearch, setDrugSearch] = useState('');
  const [drugDropdownOpen, setDrugDropdownOpen] = useState(false);
  const [selectedLibraryIdx, setSelectedLibraryIdx] = useState<number | ''>('');
  
  const [otherDrugChecked, setOtherDrugChecked] = useState(false);
  const [manualGenericName, setManualGenericName] = useState('');
  const [manualSalt, setManualSalt] = useState('');
  const [manualStrength, setManualStrength] = useState('');
  const [manualForm, setManualForm] = useState('');
  const [manualUnit, setManualUnit] = useState('');
  const [manualPackage, setManualPackage] = useState('');
  const [manualCategory, setManualCategory] = useState('Anti-Infectious');

  // Pricing
  const [priceQty, setPriceQty] = useState<number | ''>('');
  const [priceUnitPrice, setPriceUnitPrice] = useState<number | ''>('');

  // Instruction/Advise
  const [adviseQty, setAdviseQty] = useState('');
  const [adviseStrength, setAdviseStrength] = useState('');
  const [adviseFrequency, setAdviseFrequency] = useState('');
  const [remarks, setRemarks] = useState('');

  // Added medicines list
  const [addedItems, setAddedItems] = useState<RxItem[]>([]);

  // Filtering the Drug Library for searchable dropdown
  const filteredDrugs = useMemo(() => {
    const q = drugSearch.toLowerCase();
    if (!q) return DRUG_LIBRARY;
    return DRUG_LIBRARY.filter(d => 
      d.genericName.toLowerCase().includes(q) || 
      d.category.toLowerCase().includes(q)
    );
  }, [drugSearch]);

  // When a library drug is chosen
  const handleSelectLibraryDrug = (idx: number) => {
    setSelectedLibraryIdx(idx);
    const drug = DRUG_LIBRARY[idx];
    setDrugSearch(drug.genericName);
    setDrugDropdownOpen(false);
    
    // Auto-fill price
    setPriceUnitPrice(drug.price);
    
    // Auto-fill Section 2 Strength
    setAdviseStrength(drug.strength || '');
  };

  useEffect(() => {
    if (priceQty !== '') {
      setAdviseQty(String(priceQty));
    } else {
      setAdviseQty('');
    }
  }, [priceQty]);

  useEffect(() => {
    if (otherDrugChecked) {
      setAdviseStrength(manualStrength);
    }
  }, [manualStrength, otherDrugChecked]);

  // Add Medicine Validation & Add
  const handleAddMedicine = () => {
    let generic = '';
    let salt = '';
    let strength = '';
    let form = '';
    let unit = '';
    let pkg = '';
    let category = '';

    if (otherDrugChecked) {
      if (!manualGenericName.trim()) {
        toast.error('Generic Name is required for alternative entry.');
        return;
      }
      generic = manualGenericName;
      salt = manualSalt;
      strength = manualStrength;
      form = manualForm;
      unit = manualUnit;
      pkg = manualPackage;
      category = manualCategory;
    } else {
      if (selectedLibraryIdx === '') {
        toast.error('Please select a drug from the library.');
        return;
      }
      const drug = DRUG_LIBRARY[selectedLibraryIdx as number];
      generic = drug.genericName;
      salt = drug.salt;
      strength = drug.strength;
      form = drug.form;
      unit = drug.unit;
      pkg = drug.package;
      category = drug.category;
    }

    if (!priceQty || priceQty <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }
    if (priceUnitPrice === '' || priceUnitPrice < 0) {
      toast.error('Please enter a valid actual unit price.');
      return;
    }

    const newItem: RxItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      genericName: generic,
      salt,
      strength,
      form,
      unit,
      package: pkg,
      isOther: otherDrugChecked,
      category,
      quantity: Number(priceQty),
      actualUnitPrice: Number(priceUnitPrice),
      isDispensed: isDispensedInput,
      adviseQty,
      adviseStrength,
      adviseFrequency,
      remarks
    };

    setAddedItems(prev => [...prev, newItem]);
    toast.success(`Added ${generic} to prescription list.`);

    // Clear medicine inputs
    setSelectedLibraryIdx('');
    setDrugSearch('');
    setManualGenericName('');
    setManualSalt('');
    setManualStrength('');
    setManualForm('');
    setManualUnit('');
    setManualPackage('');
    setPriceQty('');
    setPriceUnitPrice('');
    setAdviseQty('');
    setAdviseStrength('');
    setAdviseFrequency('');
    setRemarks('');
  };

  const handleRemoveItem = (id: string) => {
    setAddedItems(prev => prev.filter(item => item.id !== id));
    toast.info('Item removed from list.');
  };

  const totalAmount = addedItems.reduce((sum, item) => sum + (item.quantity * item.actualUnitPrice), 0);

  const handleDispatchPrescription = async (rx: any) => {
    setIsDispatching(true);
    try {
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'Prescription',
          sourceId: rx.id,
          patientName: `${selectedMember?.firstName} ${selectedMember?.lastName}`,
          patientPin: selectedMember?.philhealthPin || '',
          description: `Prescription #${rx.transactionNumber} — ${(rx.items || []).length} item(s)`,
          actor: rx.prescribingPhysician || 'System',
        }),
      });
      setDispatchedRxId(rx.id);
      toast.success('Prescription dispatched to PhilHealth!');
    } catch (err) {
      toast.error('Failed to dispatch prescription.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Save prescription to Database
  const handleSaveRecord = async () => {
    if (!selectedMember) {
      toast.error('No patient selected.');
      return;
    }
    if (addedItems.length === 0) {
      toast.error('Please add at least one medicine to the prescription.');
      return;
    }

    const clinic = selectedClinic;
    const rxNumber = generateRxNumber(clinic.shortName);

    const prescriptionItems: PrescriptionItem[] = addedItems.map(item => ({
      medicineId: item.id,
      genericName: item.genericName,
      brandName: item.salt || '',
      dosageForm: item.form || '',
      strength: item.strength || '',
      quantity: item.quantity,
      dosageInstructions: `${item.adviseQty || ''} ${item.adviseStrength || ''} ${item.adviseFrequency || ''}`.trim() || 'Dispensed as advised',
      unitPrice: item.actualUnitPrice,
    }));

    const prescription: Prescription = {
      id: `rx-${Date.now()}`,
      prescriptionNumber: rxNumber,
      memberPin: selectedMember.philhealthPin,
      memberName: `${selectedMember.firstName} ${selectedMember.middleName || ''} ${selectedMember.lastName}`,
      clinicId: clinic.id,
      clinicName: clinic.name,
      physicianName: defaultPhysicianName,
      physicianLicense: PHYSICIANS[0].license,
      items: prescriptionItems,
      status: 'Finalized',
      createdAt: new Date().toISOString(),
      finalizedAt: new Date().toISOString(),
      diagnosis: 'YAKAP Clinical Encounter',
      notes: dispensingPersonnel ? `Dispensed by ${dispensingPersonnel} on ${dispenseDate}` : undefined,
      totalAmount,
    };

    // Deduct stock if database matching drug exists
    for (const item of addedItems) {
      // Find matches in actual database inventory by generic name match
      const dbMatch = medicines.find(m => m.genericName.toLowerCase() === item.genericName.toLowerCase());
      if (dbMatch) {
        await deductStock(dbMatch.id, item.quantity, rxNumber);
      }
    }

    await addPrescription(prescription);
    await addAuditEntry({
      timestamp: new Date().toISOString(),
      actionType: 'PRESCRIPTION_FINALIZED',
      actor: defaultPhysicianName,
      actorRole: 'Physician',
      description: `Prescription ${rxNumber} saved in database for ${prescription.memberName}`,
      metadata: {
        prescriptionNumber: rxNumber,
        memberPin: selectedMember.philhealthPin,
        memberName: prescription.memberName,
        itemCount: addedItems.length,
        totalAmount,
      },
    });

    setFinalizedPrescription(prescription);
    setIsFinalized(true);
    setIsActiveRx(false);
    setSelectedPrescription(prescription);

    // Refresh history
    const res = await fetch(`/api/prescriptions?memberPin=${selectedMember.philhealthPin}`);
    const data = await res.json();
    if (data.prescriptions) {
      setPrescriptions(data.prescriptions);
    }

    toast.success(`Prescription ${rxNumber} saved successfully to database!`);
  };

  const handlePrint = useReactToPrint({
    contentRef: slipRef,
    documentTitle: finalizedPrescription?.prescriptionNumber ?? 'Prescription',
    onAfterPrint: () => setIsPrinting(false),
  });

  const handleReset = () => {
    setSelectedMember(null);
    setAddedItems([]);
    setIsFinalized(false);
    setFinalizedPrescription(null);
    setMemberSearch('');
    setIsCaseClicked(false);
  };

  const stockBadge = (stock: number) => {
    const status = getMedicineStatus(stock);
    if (status === 'Out of Stock') return <span className="badge badge-red">Out of Stock</span>;
    if (status === 'Low') return <span className="badge badge-yellow">Low ({stock})</span>;
    return <span className="badge badge-green">In Stock ({stock})</span>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center shadow-md" style={{ backgroundColor: '#0A1628' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">YAKAP Medicine (Rx)</h1>
            <p className="text-sm text-gray-500">GAMOT Outpatient Formulary · YAKAP Program</p>
          </div>
        </div>
      </div>

      {!selectedMember ? (
        /* Center Search block */
        <div className="max-w-xl mx-auto mt-12 card-glass p-6 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-700 font-sans">Patient Selection</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">Please search and select a patient to start or view prescriptions.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
              onFocus={() => setMemberDropdownOpen(true)}
              placeholder="Search patient by name or PIN..."
              className="form-input pl-10 pr-8 text-sm"
            />
            {memberDropdownOpen && memberSearch && (
              <div className="absolute z-35 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No members found.</p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        const hasFPE = (m as any).fpeRecords && (m as any).fpeRecords.length > 0;
                        if (!hasFPE) {
                          toast.error(`Cannot prescribe medicine for ${m.firstName} ${m.lastName}: No FPE record found on file. Please complete FPE encoding first.`);
                          return;
                        }
                        setSelectedMember(m);
                        setMemberSearch(`${m.firstName} ${m.lastName}`);
                        setMemberDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 text-left border-b border-gray-50 last:border-0 text-sm"
                    >
                      <div>
                        <span className="font-semibold">{m.firstName} {m.lastName}</span>
                        <span className="font-mono text-gray-400 text-xs block">{m.philhealthPin}</span>
                      </div>
                      <span className="badge badge-green">Active</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Patient Search Card & Demographics at top when selected */
        <div className="card-glass p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
              onFocus={() => setMemberDropdownOpen(true)}
              placeholder="Search patient by name or PIN..."
              className="form-input pl-10 pr-8 text-sm"
            />
            <button
              onClick={() => {
                setSelectedMember(null);
                setMemberSearch('');
                setAddedItems([]);
                setIsActiveRx(false);
                setSelectedPrescription(null);
                setIsCaseClicked(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            {memberDropdownOpen && memberSearch && (
              <div className="absolute z-35 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No members found.</p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        const hasFPE = (m as any).fpeRecords && (m as any).fpeRecords.length > 0;
                        if (!hasFPE) {
                          toast.error(`Cannot prescribe medicine for ${m.firstName} ${m.lastName}: No FPE record found on file. Please complete FPE encoding first.`);
                          return;
                        }
                        setSelectedMember(m);
                        setMemberSearch(`${m.firstName} ${m.lastName}`);
                        setMemberDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 text-left border-b border-gray-50 last:border-0 text-sm"
                    >
                      <div>
                        <span className="font-semibold">{m.firstName} {m.lastName}</span>
                        <span className="font-mono text-gray-400 text-xs block">{m.philhealthPin}</span>
                      </div>
                      <span className="badge badge-green">Active</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Patient Demographics Grid */}
          {(() => {
            const effectiveYear = 2026;
            const index = allMembers.findIndex(m => m.id === selectedMember.id);
            return (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-3 text-xs bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">No.</span>
                  <span className="font-bold text-gray-900">{index >= 0 ? index + 1 : 1}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Case No.</span>
                  <span
                    onClick={() => {
                      if (!isCaseClicked) {
                        setIsCaseClicked(true);
                        toast.success('Case Details loaded. You can now start a prescription session or view history!');
                      }
                    }}
                    className={`font-bold font-mono transition-all ${
                      !isCaseClicked
                        ? 'text-emerald-755 bg-emerald-100 hover:bg-emerald-200 cursor-pointer px-1.5 py-0.5 rounded shadow-sm hover:scale-105 inline-block animate-pulse'
                        : 'text-emerald-900 bg-emerald-50 px-1 py-0.5 rounded'
                    }`}
                  >
                    {effectiveYear}-{selectedMember.philhealthPin.replace(/-/g, '').slice(-6)}
                    {!isCaseClicked && <span className="text-[9px] block text-emerald-600 font-semibold text-center mt-0.5 font-sans">(Click to proceed)</span>}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">PIN</span>
                  <span className="font-semibold text-gray-900 font-mono">{selectedMember.philhealthPin}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Last Name</span>
                  <span className="font-semibold text-gray-850 uppercase">{selectedMember.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">First Name</span>
                  <span className="font-semibold text-gray-850 uppercase">{selectedMember.firstName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Middle Name</span>
                  <span className="font-semibold text-gray-850 uppercase">{selectedMember.middleName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-medium">Extension</span>
                  <span className="font-semibold text-gray-850 uppercase">{selectedMember.extension || 'None'}</span>
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
      )}
      {/* Main Workspace */}
      {selectedMember && (
        !isCaseClicked ? (
          /* Click Case No prompt */
          <div className="card-glass p-8 text-center space-y-4 bg-emerald-50/20 border-emerald-100">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-850">Proceed to Case Details</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">Please click on the pulsating <strong className="text-emerald-700 font-bold bg-emerald-150 px-1 py-0.5 rounded">Case No.</strong> badge in the demographics table above to proceed to encoding and history.</p>
            </div>
          </div>
        ) : (
          /* Case Details Loaded: Stacked Layout Centered */
          <div className="space-y-6">
            {/* 1. Prescription History List (rendered first before the forms) */}
            <div className="card-glass p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800 font-sans">Prescription History</h2>
                <button
                  onClick={() => {
                    setIsActiveRx(true);
                    setSelectedPrescription(null);
                    setAddedItems([]);
                    setIsFinalized(false);
                    setFinalizedPrescription(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Start New Prescription (Rx)
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <div className="text-center py-6 text-gray-400 italic text-xs">
                  No previous prescriptions recorded in this clinic EMR for this patient.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto scrollbar-thin">
                  {prescriptions.map((rx) => {
                    const dateStr = formatDateTime(rx.consultationDate || rx.createdAt);
                    const itemCount = (rx.items as any[])?.length || 0;
                    const isSelected = selectedPrescription?.id === rx.id;
                    return (
                      <button
                        key={rx.id}
                        onClick={() => {
                          setSelectedPrescription(rx);
                          setIsActiveRx(false);
                          setIsFinalized(false);
                          setFinalizedPrescription(null);
                        }}
                        className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                          isSelected ? 'bg-blue-50/50 border-blue-300' : 'bg-white hover:bg-gray-50 border-gray-150'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-xs text-gray-900 font-mono truncate">{rx.transactionNumber}</span>
                          <span className="badge badge-green text-[10px]">Finalized</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">Physician: {rx.prescribingPhysician}</p>
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>{dateStr}</span>
                          <span>{itemCount} medicine{itemCount !== 1 ? 's' : ''}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Forms Section (rendered below history) */}
            <div>
              {isActiveRx ? (
                /* Builder Form: DRUG PRESCRIPTION */
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">DRUG PRESCRIPTION</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          checked={withPrescribe === true}
                          onChange={() => setWithPrescribe(true)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        With prescribe drug/medicine
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
                        <input
                          type="radio"
                          checked={withPrescribe === false}
                          onChange={() => setWithPrescribe(false)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        No prescribe drug/medicine
                      </label>
                    </div>
                  </div>

                  {withPrescribe && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Top Row Fields */}
                      <div className="card-glass p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Prescribing Physician
                          </label>
                          <input
                            type="text"
                            disabled
                            value={defaultPhysicianName}
                            placeholder="NAME OF PRESCRIBING PHYSICIAN"
                            className="form-input text-xs bg-yellow-50/50 font-bold border-yellow-200 text-yellow-800 placeholder-yellow-600/70"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Is Drug/Medicine dispensed?
                          </label>
                          <div className="flex items-center gap-3 mt-2">
                            <label className="flex items-center gap-1.5 text-xs text-gray-750 font-semibold cursor-pointer">
                              <input
                                type="radio"
                                checked={isDispensedInput === 'Yes'}
                                onChange={() => setIsDispensedInput('Yes')}
                                className="text-emerald-650 focus:ring-emerald-500"
                              />
                              Yes
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-750 font-semibold cursor-pointer">
                              <input
                                type="radio"
                                checked={isDispensedInput === 'No'}
                                onChange={() => setIsDispensedInput('No')}
                                className="text-emerald-650 focus:ring-emerald-500"
                              />
                              No
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Dispensing Personnel
                          </label>
                          <input
                            type="text"
                            value={dispensingPersonnel}
                            onChange={(e) => setDispensingPersonnel(e.target.value)}
                            placeholder="NAME OF DISPENSING PERSONNEL"
                            className="form-input text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Dispense Date
                          </label>
                          <input
                            type="date"
                            value={dispenseDate}
                            onChange={(e) => setDispenseDate(e.target.value)}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>

                      {/* Drug/Medicine Selection Section */}
                      <div className="card-glass p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <h3 className="text-sm font-bold text-gray-800">Drug/Medicine Selection</h3>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={otherDrugChecked}
                              onChange={(e) => setOtherDrugChecked(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Other Drug/Medicine [If not available in list]
                          </label>
                        </div>

                        {!otherDrugChecked ? (
                          <div className="relative">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Search Drug/Medicine [Complete Details]
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={drugSearch}
                                onChange={(e) => { setDrugSearch(e.target.value); setDrugDropdownOpen(true); }}
                                onFocus={() => setDrugDropdownOpen(true)}
                                placeholder="SELECT DRUG/MEDICINE"
                                className="form-input pl-10 text-xs"
                              />
                              {drugDropdownOpen && (
                                <div className="absolute z-40 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin">
                                  {filteredDrugs.length === 0 ? (
                                    <p className="px-4 py-3 text-xs text-gray-400">No medicines match search.</p>
                                  ) : (
                                    filteredDrugs.map((drug) => {
                                      // find original index in DRUG_LIBRARY
                                      const originalIdx = DRUG_LIBRARY.findIndex(d => d.genericName === drug.genericName);
                                      return (
                                        <button
                                          key={drug.genericName}
                                          onClick={() => handleSelectLibraryDrug(originalIdx)}
                                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 text-left border-b border-gray-50 last:border-0 text-xs"
                                        >
                                          <div>
                                            <span className="font-semibold text-gray-900">
                                              {drug.genericName} {drug.isEssential && <span className="text-amber-500 font-bold ml-1">★</span>}
                                            </span>
                                            <span className="text-[10px] text-gray-400 block">
                                              {drug.salt} · {drug.strength} · {drug.form}
                                            </span>
                                          </div>
                                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                                            {drug.category}
                                          </span>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                            <div>
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                Alternative Entry: Generic Name / Salt / Form / Unit / Package
                              </label>
                              <input
                                type="text"
                                value={manualGenericName}
                                onChange={(e) => setManualGenericName(e.target.value)}
                                placeholder="GENERIC NAME/ SALT/ FORM/ UNIT/ PACKAGE"
                                className="form-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                Drug Grouping
                              </label>
                              <select
                                value={manualCategory}
                                onChange={(e) => setManualCategory(e.target.value)}
                                className="form-input text-xs"
                              >
                                {CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Seeded Drug Auto-Populated Read-Only Details Row */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">GENERIC NAME</label>
                            <input
                              type="text"
                              disabled
                              value={otherDrugChecked ? manualGenericName : (selectedLibraryIdx !== '' ? DRUG_LIBRARY[selectedLibraryIdx as number].genericName : '')}
                              className="form-input text-xs bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">SALT</label>
                            <input
                              type="text"
                              disabled
                              value={otherDrugChecked ? manualSalt : (selectedLibraryIdx !== '' ? DRUG_LIBRARY[selectedLibraryIdx as number].salt : '')}
                              className="form-input text-xs bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">STRENGTH</label>
                            <input
                              type="text"
                              disabled
                              value={otherDrugChecked ? manualStrength : (selectedLibraryIdx !== '' ? DRUG_LIBRARY[selectedLibraryIdx as number].strength : '')}
                              className="form-input text-xs bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">FORM</label>
                            <input
                              type="text"
                              disabled
                              value={otherDrugChecked ? manualForm : (selectedLibraryIdx !== '' ? DRUG_LIBRARY[selectedLibraryIdx as number].form : '')}
                              className="form-input text-xs bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">UNIT</label>
                            <input
                              type="text"
                              disabled
                              value={otherDrugChecked ? manualUnit : (selectedLibraryIdx !== '' ? DRUG_LIBRARY[selectedLibraryIdx as number].unit : '')}
                              className="form-input text-xs bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold block mb-1">PACKAGE</label>
                            <input
                              type="text"
                              disabled
                              value={otherDrugChecked ? manualPackage : (selectedLibraryIdx !== '' ? DRUG_LIBRARY[selectedLibraryIdx as number].package : '')}
                              className="form-input text-xs bg-gray-50 text-gray-600"
                            />
                          </div>
                        </div>

                        {/* Pricing Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={priceQty}
                              onChange={(e) => setPriceQty(parseInt(e.target.value) || '')}
                              placeholder="ENTER QUANTITY"
                              className="form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Actual Unit Price (Php)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">Php</span>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={priceUnitPrice}
                                onChange={(e) => setPriceUnitPrice(parseFloat(e.target.value) || '')}
                                placeholder="0.00"
                                className="form-input pl-11 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Advise / Medicine Instruction */}
                      <div className="card-glass p-5 space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 pb-2 border-b">
                          Section 2: Advise / Medicine Instruction
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Quantity
                            </label>
                            <input
                              type="text"
                              value={adviseQty}
                              onChange={(e) => setAdviseQty(e.target.value)}
                              placeholder="e.g. 1 Tablet"
                              className="form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Strength
                            </label>
                            <input
                              type="text"
                              value={adviseStrength}
                              onChange={(e) => setAdviseStrength(e.target.value)}
                              placeholder="e.g. 500mg"
                              className="form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                              Frequency
                            </label>
                            <input
                              type="text"
                              value={adviseFrequency}
                              onChange={(e) => setAdviseFrequency(e.target.value)}
                              placeholder="e.g. 3x a day for 7 days"
                              className="form-input text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Remarks
                          </label>
                          <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Clinical remarks, instructions, or notes..."
                            rows={2}
                            className="form-input text-xs resize-none"
                          />
                        </div>

                        <div className="flex flex-col items-center pt-2 gap-2">
                          <button
                            type="button"
                            onClick={handleAddMedicine}
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Add Medicine
                          </button>
                          <span className="text-[10px] text-gray-400">
                            Click 'Add Medicine' button to add drug/medicine on the list.
                          </span>
                        </div>
                      </div>

                      {/* List/Table of Added Medicines */}
                      <div className="card-glass p-5">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">List of Added Medicines</h3>
                        <table className="min-w-full text-xs border border-gray-200 divide-y divide-gray-200">
                          <thead className="bg-gray-150">
                            <tr>
                              <th colSpan={2} className="px-3 py-2 text-center font-bold text-gray-700 bg-gray-200 border-r border-gray-300">
                                Drug & Instruction
                              </th>
                              <th colSpan={4} className="px-3 py-2 text-center font-bold text-gray-700 bg-gray-100 border-r border-gray-300">
                                Dispensing & Pricing
                              </th>
                              <th className="px-3 py-2"></th>
                            </tr>
                            <tr className="bg-gray-50 border-t border-gray-200 text-left">
                              <th className="px-3 py-2 font-semibold text-gray-600 border-r">Medicine Details</th>
                              <th className="px-3 py-2 font-semibold text-gray-600 border-r">Instruction</th>
                              <th className="px-3 py-2 font-semibold text-gray-600 text-center border-r">Dispensed?</th>
                              <th className="px-3 py-2 font-semibold text-gray-600 text-center border-r">Qty</th>
                              <th className="px-3 py-2 font-semibold text-gray-600 text-right border-r">Unit Price</th>
                              <th className="px-3 py-2 font-semibold text-gray-600 text-right border-r font-bold">Total Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {addedItems.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">
                                  No medicines added to prescription list yet. Fill fields above and click 'Add Medicine'.
                                </td>
                              </tr>
                            ) : (
                              addedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                  <td className="px-3 py-2.5 border-r">
                                    <div className="font-semibold text-gray-900">{item.genericName}</div>
                                    <div className="text-[10px] text-gray-400">
                                      {item.salt ? `${item.salt} · ` : ''}{item.strength} · {item.form} · {item.category}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-600 border-r">
                                    {item.adviseQty || item.adviseStrength || item.adviseFrequency ? (
                                      <div>
                                        <span className="font-medium text-gray-800">{item.adviseQty || '1'}</span> {item.adviseStrength || ''} ({item.adviseFrequency || 'As advised'})
                                        {item.remarks && <p className="text-[10px] text-gray-400 mt-0.5">{item.remarks}</p>}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">As advised</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-center border-r font-semibold">
                                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                                      item.isDispensed === 'Yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {item.isDispensed}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-gray-700 border-r">
                                    {item.quantity}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-gray-700 border-r font-mono">
                                    {formatCurrency(item.actualUnitPrice)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-emerald-700 font-bold border-r font-mono">
                                    {formatCurrency(item.quantity * item.actualUnitPrice)}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {addedItems.length > 0 && (
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                              <tr>
                                <td colSpan={5} className="px-3 py-2.5 text-right font-bold text-gray-700">
                                  Grand Total Price:
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-emerald-700 text-sm font-mono border-r">
                                  {formatCurrency(totalAmount)}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-gray-250 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActiveRx(false);
                        setAddedItems([]);
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      Go Back to Search Module
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRecord}
                      disabled={addedItems.length === 0}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      Save Record
                    </button>
                  </div>
                </div>
              ) : selectedPrescription ? (
                /* Viewer */
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-xs font-bold text-emerald-800">Viewing Finalized Prescription</span>
                      <span className="text-[10px] text-gray-400 ml-2 font-mono">#{selectedPrescription.transactionNumber}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFinalizedPrescription(selectedPrescription);
                          setIsPrinting(true);
                          handlePrint();
                        }}
                        className="btn-primary py-1.5 px-3 bg-philgreen hover:bg-emerald-700 text-[11px] font-bold shadow-sm flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Rx
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrescription(null);
                          setIsActiveRx(false);
                        }}
                        className="btn-secondary py-1.5 px-3 text-[11px]"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleDispatchPrescription(selectedPrescription)}
                        disabled={isDispatching || dispatchedRxId === selectedPrescription.id}
                        className={`py-1.5 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                          dispatchedRxId === selectedPrescription.id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {isDispatching ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Dispatching...</>
                        ) : dispatchedRxId === selectedPrescription.id ? (
                          <><CheckCircle className="w-3 h-3" /> Dispatched</>
                        ) : (
                          <><UploadCloud className="w-3 h-3" /> Direct PHIC Dispatch</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto rounded-2xl border border-gray-200 shadow bg-white">
                    <PrescriptionSlip
                      ref={slipRef}
                      prescription={{
                        ...selectedPrescription,
                        prescriptionNumber: selectedPrescription.transactionNumber,
                      }}
                      clinic={selectedClinic}
                      member={selectedMember}
                    />
                  </div>
                </div>
              ) : (
                /* Placeholder */
                <div className="text-center py-12 card-glass border-2 border-dashed border-gray-200 rounded-xl space-y-3">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                  <h3 className="text-sm font-bold text-gray-700 font-sans">No Prescription Session Selected</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto font-sans">
                    Click on any previous prescription in the history above to view its details, or click &ldquo;Start New Prescription (Rx)&rdquo; to launch the builder.
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
