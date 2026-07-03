'use client';

import { useRef } from 'react';
import { Printer, Download, Check } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import type { Member } from '@/lib/types';

function nowString() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function genSlipNo() {
  return `YES-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
}

// ── Shared header shown on every page ──────────────────────
function SlipHeader() {
  return (
    <div className="flex items-start justify-between px-10 pt-8 pb-3">
      {/* Left: PhilHealth logo */}
      <div className="w-36">
        <Image
          src="/yakap_logo_2.png"
          alt="PhilHealth"
          width={150}
          height={60}
          style={{ objectFit: 'contain' }}
          unoptimized
        />
      </div>
      {/* Right: YAKAP logo */}
      <div className="w-52">
        <Image
          src="/yakap_logo_4.png"
          alt="PhilHealth YAKAP"
          width={210}
          height={60}
          style={{ objectFit: 'contain' }}
          unoptimized
        />
      </div>
    </div>
  );
}

// ── Shared footer shown on every page ──────────────────────
function SlipFooter({ page, total, txNo, submitted, generated }: {
  page: number; total: number; txNo: string; submitted: string; generated: string;
}) {
  return (
    <div className="flex items-end justify-between px-10 pb-6 pt-3 mt-auto">
      <div className="text-[10px] text-gray-700 leading-normal font-sans">
        <p>YES Transaction No.: {txNo}</p>
        <p>YES Date Submitted: {submitted}</p>
        <p>Date Generated: {generated}</p>
      </div>
      <div className="text-[11px] font-sans text-gray-700">Page {page} of {total}</div>
    </div>
  );
}

// ── Section box: matching the PDF border, padding, and backgrounds ──
function SectionBox({ icon, title, bg = '#F6F5ED', titleColor = '#000000', children }: {
  icon: React.ReactNode;
  title: string;
  bg?: string;
  titleColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-300 p-5 mb-5 rounded" style={{ background: bg }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex-shrink-0">{icon}</span>
        <span className="font-bold text-[14px]" style={{ color: titleColor }}>{title}</span>
      </div>
      <div className="text-[13px] leading-relaxed text-gray-900">{children}</div>
    </div>
  );
}

export function YesSlip({ member, onDone }: { member: Member; onDone: () => void }) {
  const slip = useRef({ number: genSlipNo(), generatedAt: nowString() }).current;
  const txNo = useRef('MCAC99C54E').current; // Hardcoded to match PDF transaction code style exactly
  const submitted = useRef('06/03/2026 01:32 PM').current; // Hardcoded matching PDF time

  const currentYear = new Date().getFullYear();
  
  // Format matching PDF name structure: FirstName MiddleName LastName
  const fullName = `${member.firstName} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName}`.toUpperCase();
  const dob = member.dateOfBirth
    ? new Date(member.dateOfBirth).toLocaleDateString('en-GB') // Matches DD/MM/YYYY formatting in PDF
    : '—';

  function handlePrint() { window.print(); }
  function handleSave() { toast.success('YES Slip saved to patient records successfully!'); }

  const totalPages = 6;

  // Bullet list with clean spacing
  const BulletList = ({ items }: { items: string[] }) => (
    <ul className="list-disc list-outside space-y-1.5 pl-5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
  
  // Number list with clean spacing
  const NumberList = ({ items }: { items: string[] }) => (
    <ol className="list-none space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start">
          <span className="w-5 text-right mr-2 flex-shrink-0">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );

  // Icons from PDF
  const GreenCheck = () => (
    <Image src="/yakap_logo_6.png" alt="" width={20} height={20} unoptimized />
  );
  const RedStop = () => (
    <Image src="/yakap_logo_8.png" alt="" width={20} height={20} unoptimized />
  );
  const BlueCalendar = () => (
    <Image src="/yakap_logo_10.png" alt="" width={20} height={20} unoptimized />
  );

  const pageProps = { txNo, submitted, generated: 'March 11, 2026 2:04 PM', total: totalPages };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Print override stylesheet */}
      <style jsx global>{`
        @media print {
          /* Hide default layout wrappers, portal navigation, buttons */
          body * {
            visibility: hidden;
          }
          #yes-slip, #yes-slip * {
            visibility: visible;
          }
          #yes-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          /* Ensure each page fits clean letter size and forces page breaks */
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            height: 100vh;
            display: flex;
            flex-direction: column;
            border: none !important;
          }
        }
      `}</style>

      {/* Screen success header */}
      <div className="text-center no-print">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <Check className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Empanelment Complete!</h2>
        <p className="text-sm text-gray-500 mt-1">
          <span className="font-semibold text-emerald-700">{member.firstName} {member.lastName}</span> is now enrolled in YAKAP
        </p>
      </div>

      {/* ════════ YES SLIP DOCUMENT ════════ */}
      <div id="yes-slip" className="bg-white border border-gray-300 shadow-xl text-gray-950 font-serif leading-relaxed" style={{ fontSize: 13.5 }}>

        {/* ── PAGE 1 ── */}
        <div className="print-page min-h-[1080px] flex flex-col border-b border-gray-300 bg-white">
          <SlipHeader />
          <hr className="mx-10 border-gray-400 my-1" />

          <div className="px-10 flex-1 py-4">
            {/* Document title */}
            <div className="text-center mb-6 mt-2 font-sans">
              <h1 className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight">YAKAP Empanelment Slip</h1>
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight">(Mutual Care Agreement)</h2>
              <p className="text-[13px] italic text-[#3B629B] font-bold tracking-wide mt-2">ENGLISH VERSION</p>
            </div>

            <hr className="border-gray-300 mb-6" />

            {/* Intro paragraph */}
            <p className="mb-6 leading-relaxed">
              I, <strong>{fullName}</strong> , born on <strong>{dob}</strong>, with PhilHealth ID No. (PIN){' '}
              <strong>{member.philhealthPin}</strong> agree to receive primary care services from{' '}
              <strong>UNIVERSITY OF THE ASSUMPTION, INC.</strong>, until December 31st of{' '}
              <strong>{currentYear}</strong> under PhilHealth&apos;s Yaman ng Kalusugan Program (YAKAP).
            </p>

            {/* Section: What You Are Entitled To */}
            <SectionBox
              icon={<GreenCheck />}
              title="What You Are Entitled To"
              titleColor="#006600"
              bg="#F6F9F3"
            >
              <p className="mb-2">You are entitled to the following services:</p>
              <BulletList items={[
                'Health risk screening and check-up',
                'Consultations with your YAKAP physician',
                'Basic laboratory tests, if your physician determines they are medically necessary',
                'Medicines covered by YAKAP (see complete list in Annex), if your physician determines they are medically necessary',
              ]} />
            </SectionBox>

            {/* Section: There Is No Such Thing */}
            <SectionBox
              icon={<RedStop />}
              title='There Is No Such Thing as "Your Allocation Is Used Up"'
              titleColor="#D32F2F"
              bg="#FFF6F6"
            >
              <p className="mb-3">
                PhilHealth pays your clinic a fixed amount called <strong>capitation</strong> &mdash; this is a payment made directly to
                the clinic to fund the delivery of your covered YAKAP services. It is not your personal wallet,
                credit, or spending limit.
              </p>
              <p className="mb-3">
                If a provider tells you{' '}
                <span className="text-[#D32F2F]">
                  &quot;your allocation is used up, so you need to pay out of pocket for your labs&quot;
                </span>{' '}
                &mdash; this is <strong>incorrect.</strong> Covered laboratory tests and other YAKAP services do not come out of
                any personal budget assigned to you. Your entitlement to covered services is based on your doctor&apos;s
                recommendation, not on any allocation running out.
              </p>
              <p>
                The only out-of-pocket payment you may be charged is the{' '}
                <strong>PHP 900 annual co-payment cap</strong> (for private clinics only). Nothing more.
              </p>
            </SectionBox>

            {/* Section: Your Co-payment */}
            <SectionBox
              icon={<BlueCalendar />}
              title="Your Co-payment"
              titleColor="#1976D2"
              bg="#F4F7FB"
            >
              <p>
                If your YAKAP clinic is <strong>private</strong>: you pay a maximum of{' '}
                <strong>PHP 900 per year only</strong>. After that, all covered YAKAP services are free for the rest of the year.
              </p>
            </SectionBox>
          </div>

          <SlipFooter page={1} {...pageProps} />
        </div>

        {/* ── PAGE 2 ── */}
        <div className="print-page min-h-[1080px] flex flex-col border-b border-gray-300 bg-white">
          <SlipHeader />
          <hr className="mx-10 border-gray-400 my-1" />

          <div className="px-10 flex-1 py-6">
            {/* Continuation of Co-payment block */}
            <div className="border border-gray-300 p-5 mb-5 rounded bg-[#F4F7FB] leading-relaxed">
              If your YAKAP clinic is <strong>public (government)</strong>: all covered YAKAP services are{' '}
              <strong>free of charge.</strong>
            </div>

            {/* One-Year Agreement */}
            <SectionBox
              icon={<BlueCalendar />}
              title="One-Year Agreement"
              titleColor="#006600"
              bg="#F6F9F3"
            >
              <p>
                When you sign this slip, you and your clinic agree to a{' '}
                <strong>one-year care relationship.</strong> You <strong>cannot transfer to another YAKAP clinic
                mid-year</strong>, except if your clinic closes, loses accreditation, or receives a stop-order from
                the DOH. Otherwise, requests to transfer must be submitted in{' '}
                <strong>October&ndash;December</strong> and will take effect in{' '}
                <strong>January of the following year.</strong>
              </p>
            </SectionBox>

            {/* My responsibilities */}
            <div className="mt-6 mb-6">
              <p className="font-bold text-[14px] text-gray-900 mb-3">My responsibilities as a beneficiary:</p>
              <NumberList items={[
                'Keep my PhilHealth details updated.',
                'Give honest and accurate information to my clinic.',
                'Follow the care plan that my doctor recommends.',
                'Tell my clinic about any changes that may affect my health care.',
                "Follow the clinic's rules and my doctor's medical advice.",
              ]} />
            </div>

            <p className="leading-relaxed mb-4 mt-6">
              We, <strong>UNIVERSITY OF THE ASSUMPTION, INC.</strong>, with PhilHealth Accreditation No.{' '}
              <strong>P03037699</strong>, agree to provide primary care services to{' '}
              <strong>{fullName}</strong>{' '}
              until December 31, <strong>{currentYear}</strong>, following PhilHealth&apos;s YAKAP rules and clinical guidelines.
            </p>

            {/* Our responsibilities */}
            <div className="mt-6">
              <p className="font-bold text-[14px] text-gray-900 mb-3">Our responsibilities as a YAKAP clinic:</p>
              <NumberList items={[
                "Respect the patient's rights, privacy, and confidentiality.",
                'Build a care plan together with the patient.',
                'Provide quality, timely, and appropriate primary care services.',
                'Ensure the patient receives all YAKAP benefits they are entitled to.',
                'Follow PhilHealth and national clinical practice guidelines in all services.',
              ]} />
            </div>
          </div>

          <SlipFooter page={2} {...pageProps} />
        </div>

        {/* ── PAGE 3 — Signatures ── */}
        <div className="print-page min-h-[1080px] flex flex-col border-b border-gray-300 bg-white">
          <SlipHeader />
          <hr className="mx-10 border-gray-400 my-1" />

          <div className="px-10 flex-1 py-12 flex flex-col justify-start">
            <hr className="border-gray-900 mb-20 mt-10" />

            {/* Signature blocks */}
            <div className="grid grid-cols-2 gap-20">
              <div className="text-center">
                <div className="border-b border-gray-900 mb-2 h-10" />
                <p className="font-bold text-[14px] leading-tight mb-1">{fullName}</p>
                <p className="text-[12px] text-gray-600 font-sans">Beneficiary / Guardian (if minor)</p>
                <p className="text-[12px] mt-6 text-left font-sans text-gray-700">Date signed: ____________________</p>
              </div>
              <div className="text-center">
                <div className="border-b border-gray-900 mb-2 h-10" />
                <p className="font-bold text-[14px] leading-tight mb-1">&lt;HEAD OF ACCREDITED PC CLINIC&gt;</p>
                <p className="text-[12px] text-gray-600 font-sans">YAKAP Clinic Head / Authorized Rep.</p>
                <p className="text-[12px] mt-6 text-left font-sans text-gray-700">Date signed: ____________________</p>
              </div>
            </div>
          </div>

          {/* Contact line exactly as in PDF */}
          <div className="mx-10 mb-2 mt-auto">
            <hr className="border-gray-400 mb-3" />
            <p className="text-center text-[10px] italic font-sans text-gray-700 leading-normal">
              Concerns? Call (02) 866-225-88 | Text: 0917-127-5987 | yakaptugon@philhealth.gov.ph | www.philhealth.gov.ph
            </p>
          </div>
          <SlipFooter page={3} {...pageProps} />
        </div>

        {/* ── PAGE 4 — Filipino version ── */}
        <div className="print-page min-h-[1080px] flex flex-col border-b border-gray-300 bg-white">
          <SlipHeader />
          <hr className="mx-10 border-gray-400 my-1" />

          <div className="px-10 flex-1 py-4">
            <div className="text-center mb-6 mt-2 font-sans">
              <h1 className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight">YAKAP Empanelment Slip</h1>
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight">(Kasunduan sa Pangangalaga)</h2>
              <p className="text-[13px] italic text-[#3B629B] font-bold tracking-wide mt-2">BERSYONG FILIPINO</p>
            </div>

            <hr className="border-gray-300 mb-6" />

            <p className="mb-6 leading-relaxed">
              Ako, si <strong>{fullName}</strong>, ipinanganak noong <strong>{dob}</strong>, may PhilHealth ID No. (PIN){' '}
              <strong>{member.philhealthPin}</strong>, ay sumasang-ayon na tanggapin ang mga serbisyong pangunahing pangangalaga mula sa{' '}
              <strong>UNIVERSITY OF THE ASSUMPTION, INC.</strong>, hanggang Disyembre 31,{' '}
              <strong>{currentYear}</strong> sa ilalim ng Yaman ng Kalusugan Program (YAKAP) ng PhilHealth.
            </p>

            <SectionBox icon={<GreenCheck />} title="Ano ang Karapatan Mo" titleColor="#006600" bg="#F6F9F3">
              <p className="mb-2">May karapatan kang sa mga serbisyong ito:</p>
              <BulletList items={[
                'Screening at pagsusuri sa kalusugan',
                'Konsultasyon sa iyong YAKAP na doktor',
                'Mga pangunahing laboratoryo, kung iyon ang rekomendasyon ng iyong doktor',
                'Mga gamot na saklaw ng YAKAP (tingnan ang kumpletong listahan sa Annex), kung iyon ang rekomendasyon ng iyong doktor',
              ]} />
            </SectionBox>

            <SectionBox icon={<RedStop />} title='Walang "Ubos Na Ang Allocation Mo"' titleColor="#D32F2F" bg="#FFF6F6">
              <p className="mb-3">
                Ang PhilHealth ay nagbabayad sa iyong klinika ng isang nakapirming halaga na tinatawag na{' '}
                <strong>capitation</strong> &mdash; ito ay bayad ng PhilHealth sa klinika para pondohan ang iyong mga saklaw na
                serbisyo sa YAKAP. Hindi ito iyong personal na pitaka, credit, o limitasyon sa gastos.
              </p>
              <p className="mb-3">
                Kung sinasabi sa iyo ng provider na{' '}
                <span className="text-[#D32F2F]">
                  &quot;ubos na ang allocation mo, kaya kailangan mong magbayad ng sariling pera para sa iyong labs&quot;
                </span>{' '}
                &mdash; mali ito. Ang mga <span className="underline">napapaloob</span> na laboratoryo at iba pang serbisyo ng YAKAP
                ay hindi nagmumula sa anumang personal na budget na itinalaga sa iyo. Ang iyong karapatan sa mga nasabing serbisyo
                ay batay sa rekomendasyon ng iyong doktor, at hindi sa &quot;allocation&quot; ng PhilHealth sa klinika.
              </p>
              <p>
                Ang tanging bayad na maaari kang singilin ay ang{' '}
                <strong>PHP 900 na taunang co-payment cap</strong> (para sa mga pribadong klinika lamang). Wala nang iba.
              </p>
            </SectionBox>

            <SectionBox icon={<BlueCalendar />} title="Ang Iyong Co-payment" titleColor="#1976D2" bg="#F4F7FB">
              <p>
                Kung ang iyong YAKAP clinic ay <strong>pribado</strong>: magbabayad ka ng hanggang{' '}
                <strong>PHP 900 bawat taon lamang.</strong> Pagkatapos maabot ang limitasyong ito, lahat ng nasasaklawang serbisyo
                ng YAKAP ay libre na para sa natitirang bahagi ng taon.
              </p>
            </SectionBox>
          </div>

          <SlipFooter page={4} {...pageProps} />
        </div>

        {/* ── PAGE 5 ── */}
        <div className="print-page min-h-[1080px] flex flex-col border-b border-gray-300 bg-white">
          <SlipHeader />
          <hr className="mx-10 border-gray-400 my-1" />

          <div className="px-10 flex-1 py-6">
            <div className="border border-gray-300 p-5 mb-5 rounded bg-[#F4F7FB] leading-relaxed">
              Kung ang iyong YAKAP clinic ay <strong>pampubliko (gobyerno)</strong>: lahat ng serbisyo ng YAKAP ay{' '}
              <strong>libre.</strong>
            </div>

            <SectionBox
              icon={<BlueCalendar />}
              title="Isang Taong Kasunduan"
              titleColor="#006600"
              bg="#F6F9F3"
            >
              <p>
                Sa pagpirma mo sa slip na ito, ikaw at ang iyong klinika ay sumasang-ayon sa isang{' '}
                <strong>taong relasyon sa pangangalaga.</strong> <strong>Hindi ka maaaring lumipat sa ibang YAKAP clinic
                sa kalagitnaan ng taon</strong>, maliban kung ang klinika ay nagsara, nawalan ng akreditasyon, o nakatanggap ng
                stop-order mula sa DOH. Sa ibang pagkakataon, ang kahilingan para sa paglipat ay dapat isumite sa{' '}
                <strong>Oktubre&ndash;Disyembre</strong> at magiging epektibo sa <strong>Enero ng susunod na taon.</strong>
              </p>
            </SectionBox>

            <div className="mt-6 mb-6">
              <p className="font-bold text-[14px] text-gray-900 mb-3">Mga responsibilidad ko bilang benepisyaryo:</p>
              <NumberList items={[
                'Panatilihing updated ang aking impormasyon sa PhilHealth.',
                'Magbigay ng tapat at tamang impormasyon sa aking klinika.',
                'Sundin ang care plan na inirerekomenda ng aking doktor.',
                'Ipaalam sa klinika ang anumang pagbabagong maaaring makaapekto sa aking kalusugan.',
                'Igalang ang mga alituntunin ng klinika at ang mga medikal na payo ng aking doktor.',
              ]} />
            </div>

            <p className="leading-relaxed mb-4 mt-6">
              Kami, ang <strong>UNIVERSITY OF THE ASSUMPTION, INC.</strong>, na may PhilHealth Accreditation No.{' '}
              <strong>P03037699</strong>, ay sumasang-ayon na magbigay ng mga serbisyong pangunahing pangangalaga kay{' '}
              <strong>{fullName}</strong> hanggang Disyembre 31, , alinsunod sa mga patakaran at klinikal na gabay ng
              PhilHealth para sa YAKAP.
            </p>

            <div className="mt-6">
              <p className="font-bold text-[14px] text-gray-900 mb-3">Our responsibilities as a YAKAP clinic:</p>
              <NumberList items={[
                'Igalang ang mga karapatan, privacy, at confidentiality ng pasyente.',
                'Bumuo ng care plan kasama ang pasyente.',
                'Magbigay ng de-kalidad, napapanahon, at angkop na serbisyong pangkalusugan.',
                'Tiyaking natatanggap ng benepisyaryo ang lahat ng benepisyong kanyang nararapat sa ilalim ng YAKAP.',
                'Sundin ang mga klinikal na gabay ng PhilHealth at ng bansa sa lahat ng serbisyo.',
              ]} />
            </div>
          </div>

          <SlipFooter page={5} {...pageProps} />
        </div>

        {/* ── PAGE 6 — Filipino Signatures ── */}
        <div className="print-page min-h-[1080px] flex flex-col bg-white">
          <SlipHeader />
          <hr className="mx-10 border-gray-400 my-1" />

          <div className="px-10 flex-1 py-12 flex flex-col justify-start">
            <hr className="border-gray-900 mb-20 mt-10" />

            <div className="grid grid-cols-2 gap-20">
              <div className="text-center">
                <div className="border-b border-gray-900 mb-2 h-10" />
                <p className="font-bold text-[14px] leading-tight mb-1">{fullName}</p>
                <p className="text-[12px] text-gray-600 font-sans">Benepisyaryo / Tagapag-alaga (kung menor de edad)</p>
                <p className="text-[12px] mt-6 text-left font-sans text-gray-700">Petsa ng pirma: ____________________</p>
              </div>
              <div className="text-center">
                <div className="border-b border-gray-900 mb-2 h-10" />
                <p className="font-bold text-[14px] leading-tight mb-1">&lt;HEAD OF ACCREDITED PC CLINIC&gt;</p>
                <p className="text-[12px] text-gray-600 font-sans">YAKAP Clinic Head / Authorized Rep.</p>
                <p className="text-[12px] mt-6 text-left font-sans text-gray-700">Petsa ng pirma: ____________________</p>
              </div>
            </div>
          </div>

          <div className="mx-10 mb-2 mt-auto">
            <hr className="border-gray-400 mb-3" />
            <p className="text-center text-[10px] italic font-sans text-gray-700 leading-normal">
              May katanungan? Tumawag sa (02) 866-225-88 | Text: 0917-127-5987 | yakaptugon@philhealth.gov.ph | www.philhealth.gov.ph
            </p>
          </div>
          <SlipFooter page={6} {...pageProps} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 no-print">
        <button id="print-yes-slip-btn" onClick={handlePrint} className="btn-secondary justify-center">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button id="save-yes-slip-btn" onClick={handleSave} className="btn-secondary justify-center">
          <Download className="w-4 h-4" /> Save
        </button>
        <button id="done-empanelment-btn" onClick={onDone}
          className="btn-primary justify-center" style={{ background: '#10B981' }}>
          <Check className="w-4 h-4" /> Done
        </button>
      </div>
    </div>
  );
}
