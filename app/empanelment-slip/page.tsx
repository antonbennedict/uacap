'use client';

import { mockSlip } from '@/lib/data/mockSlip';
import { Printer, ArrowLeft, Heart, CheckCircle2, ShieldCheck, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

export default function EmpanelmentSlipPage() {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calcAge = (dob: string) => {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0 print:px-0">
      {/* Control Bar (Hidden on Print) */}
      <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link
          href="/empanelment"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Empanelment Wizard
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00843D] text-white rounded-lg hover:bg-[#005F2A] transition-all shadow-md font-bold text-sm"
        >
          <Printer className="w-4 h-4" /> Print Form / Export PDF
        </button>
      </div>

      {/* A4 Document Container */}
      <div className="max-w-[800px] mx-auto bg-white border border-gray-300 shadow-xl rounded-xl overflow-hidden aspect-[1/1.414] flex flex-col justify-between p-8 md:p-10 print:shadow-none print:border-none print:my-0 print:p-0 print:w-full print:aspect-auto">
        <div className="space-y-6">
          
          {/* 1. HEADER */}
          <div>
            {/* Top dark green accent bar */}
            <div className="h-2.5 -mx-8 md:-mx-10 -mt-8 md:-mt-10 bg-[#005F2A]" />
            
            <div className="flex items-center justify-between gap-4 mt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {/* PhilHealth logo style */}
                <div className="w-12 h-12 rounded-full border border-[#00843D] bg-white flex items-center justify-center relative overflow-hidden shadow-sm flex-shrink-0">
                  <div className="absolute inset-0 bg-[#00843D]/5 rounded-full" />
                  <Heart className="w-6 h-6 text-[#00843D] fill-[#00843D] relative z-10" />
                  <div className="absolute bottom-0 inset-x-0 h-3.5 bg-[#FFCD00]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#005F2A] uppercase tracking-widest leading-none">Republic of the Philippines</p>
                  <p className="text-xs font-black text-[#00843D] uppercase tracking-wider mt-0.5">Philippine Health Insurance Corporation</p>
                  <p className="text-[10px] font-medium text-gray-500">YAKAP UACAP Primary Care Program</p>
                </div>
              </div>
              <div className="text-right border-l border-gray-200 pl-4 flex-shrink-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">YES SLIP NUMBER</p>
                <p className="text-sm font-extrabold font-mono text-emerald-950 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{mockSlip.yesTransactionNo}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#00843D] text-white text-[9px] font-black tracking-widest">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Main Banner */}
            <div className="bg-[#00843D] text-white py-2 px-4 rounded flex items-center justify-between mt-4">
              <h3 className="text-xs font-black uppercase tracking-wider">
                EKONSULTA MEMBER EMPANELMENT SLIP (YES SLIP)
              </h3>
              <p className="text-[10px] text-emerald-100 font-mono font-bold">PHIC Form YES-1 • 2026</p>
            </div>
          </div>

          {/* 2. CARD SECTIONS */}
          
          {/* PART I - MEMBER IDENTIFICATION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-[#005F2A] uppercase tracking-wider">PART I - MEMBER IDENTIFICATION</span>
              <span className="text-[9px] font-semibold text-gray-400 uppercase">Section A</span>
            </div>
            
            <div className="grid grid-cols-12 text-xs">
              <div className="col-span-8 p-3 border-r border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">1. Member's Name (Last Name, First Name, Middle Name)</span>
                <span className="text-xs font-black text-gray-900 uppercase mt-0.5 block">{mockSlip.name}</span>
              </div>
              <div className="col-span-4 p-3 border-b border-gray-200 bg-emerald-50/10">
                <span className="text-[9px] font-bold text-emerald-800 uppercase block">2. PhilHealth PIN</span>
                <span className="text-xs font-mono font-black text-emerald-950 mt-0.5 block">{mockSlip.philhealthPin}</span>
              </div>

              <div className="col-span-3 p-3 border-r border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">3. Date of Birth</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">{formatDate(mockSlip.dateOfBirth)}</span>
              </div>
              <div className="col-span-3 p-3 border-r border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">4. Sex / Age</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">{mockSlip.sex} / {calcAge(mockSlip.dateOfBirth)} years</span>
              </div>
              <div className="col-span-3 p-3 border-r border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">5. Civil Status</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">{mockSlip.civilStatus}</span>
              </div>
              <div className="col-span-3 p-3 border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">6. Membership Type</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">{mockSlip.membershipType}</span>
              </div>

              <div className="col-span-12 p-3 border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">7. Contact Number / Email Address</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">{mockSlip.phone} · {mockSlip.email}</span>
              </div>

              <div className="col-span-12 p-3 bg-gray-50/50">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">8. Residential Address</span>
                <span className="text-xs font-bold text-gray-800 uppercase mt-0.5 block">
                  {mockSlip.address}, {mockSlip.city}, {mockSlip.province} {mockSlip.zipCode}
                </span>
              </div>
            </div>
          </div>

          {/* PART II - HEALTH CARE PROVIDER ASSIGNMENT */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-[#005F2A] uppercase tracking-wider">PART II - HEALTH CARE PROVIDER ASSIGNMENT</span>
              <span className="text-[9px] font-semibold text-gray-400 uppercase">Section B</span>
            </div>
            
            <div className="grid grid-cols-12 text-xs">
              <div className="col-span-8 p-3 border-r border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">9. Assigned Healthcare Facility</span>
                <span className="text-xs font-bold text-emerald-950 uppercase mt-0.5 block">{mockSlip.clinic}</span>
              </div>
              <div className="col-span-4 p-3 border-b border-gray-200">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">10. Accreditation/Code No.</span>
                <span className="text-xs font-mono font-bold text-gray-900 mt-0.5 block">{mockSlip.accreditationNo}</span>
              </div>

              <div className="col-span-4 p-3 border-r border-gray-200 bg-gray-50/30">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">11. Empanelment Date</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">{formatDate(mockSlip.yesDateSubmitted)}</span>
              </div>
              <div className="col-span-4 p-3 border-r border-gray-200 bg-gray-50/30">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">12. Period of Validity</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">Until {formatDate(mockSlip.dateGenerated)}</span>
              </div>
              <div className="col-span-4 p-3 bg-emerald-50/20">
                <span className="text-[9px] font-bold text-emerald-800 uppercase block">13. Liveness Check</span>
                <span className="text-xs font-black text-emerald-700 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" /> VERIFIED ✓
                </span>
              </div>
            </div>
          </div>

          {/* PART III - YAKAP BENEFIT SCHEDULE */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5">
              <span className="text-[10px] font-extrabold text-[#005F2A] uppercase tracking-wider">PART III - YAKAP BENEFIT SCHEDULE</span>
            </div>
            
            <div className="grid grid-cols-3 divide-x divide-gray-200 text-xs">
              <div className="p-4 text-center bg-gray-50/30">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Annual Allocation</span>
                <span className="text-base font-black text-gray-900 mt-1 block">₱{mockSlip.annualAllocation.toLocaleString()}</span>
              </div>
              <div className="p-4 text-center bg-amber-50/10">
                <span className="text-[9px] font-bold text-amber-800 uppercase block">Availed Amount</span>
                <span className="text-base font-extrabold text-amber-600 mt-1 block">₱{mockSlip.availedAmount.toLocaleString()}</span>
              </div>
              <div className="p-4 text-center bg-emerald-50/20">
                <span className="text-[9px] font-bold text-emerald-850 uppercase block">Remaining Balance</span>
                <span className="text-base font-black text-[#00843D] mt-1 block">₱{mockSlip.remainingBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* PART IV - AUTHORIZATION & DIGITAL ATTESTATION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm p-4 bg-white">
            <span className="text-[10px] font-extrabold text-[#005F2A] uppercase tracking-wider block mb-3">PART IV - AUTHORIZATION & DIGITAL ATTESTATION</span>
            <div className="grid grid-cols-2 gap-8 text-xs">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">14. Member Signature</span>
                <div className="border-b border-gray-300 h-11 flex items-end pb-1 font-mono text-[9px] text-[#00843D] font-bold">
                  <BadgeCheck className="w-3.5 h-3.5 mr-1" /> BIOMETRIC SIGN-OFF (FACE CHECK)
                </div>
                <span className="text-[10px] font-bold text-gray-800 uppercase block mt-1.5">ANA BAUTISTA GARCIA</span>
                <span className="text-[9px] text-gray-400 block font-mono">TS: {formatDate(mockSlip.yesDateSubmitted)} {formatTime(mockSlip.yesDateSubmitted)}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">15. Attesting Facility Officer</span>
                <div className="border-b border-gray-300 h-11 flex items-end pb-1 font-mono text-[9px] text-blue-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> DIGITAL SIGNATURE SECURED (EMR-PHIC)
                </div>
                <span className="text-[10px] font-bold text-gray-800 uppercase block mt-1.5">PCU CLINIC ADMINISTRATOR</span>
                <span className="text-[9px] text-gray-400 block">University of the Assumption Clinic</span>
              </div>
            </div>
          </div>

          {/* 3. ATTESTATION DISCLAIMER */}
          <div className="rounded-lg p-3.5 border border-[#FFCD00] bg-[#FFCD00]/5 text-gray-800 text-[10px] leading-relaxed shadow-sm">
            <span className="font-extrabold text-emerald-800">ATTESTATION DISCLAIMER: </span>
            This document serves as the official Yakap UACAP Empanelment Slip (YES Slip) verifying registered status for primary care benefits with the Philippine Health Insurance Corporation. The empanelment details contained herein have been synchronized with the PHIC UACAP Registry Server. Present this slip or your PIN card to receive Gamot (prescriptions) and Lab allocations at accredited facilities.
          </div>

        </div>

        {/* Footer info/barcode */}
        <div className="flex items-center justify-between pt-4 mt-8 border-t border-gray-200">
          <div className="flex items-end gap-0.5 opacity-30">
            {Array.from({ length: 44 }).map((_, i) => (
              <div key={i} className="bg-black"
                style={{ width: i % 4 === 0 ? 3 : 1.5, height: i % 5 === 0 ? 24 : i % 2 === 0 ? 16 : 10 }} />
            ))}
          </div>
          <div className="text-right text-[9px] font-mono text-gray-400">
            <p>TRACKING ID: {mockSlip.yesTransactionNo}-PHIC-UA</p>
            <p className="text-[8px] text-gray-300">PhilHealth YES Form v1.5 · UA-CLINIC-R3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
