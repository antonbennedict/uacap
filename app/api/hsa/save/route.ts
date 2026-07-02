import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const fpeData = await request.json();

    const record = await prisma.$transaction(async (tx) => {
      // 1. Verify Member and enforce explicit Data Privacy Consent
      const member = await tx.member.findUnique({
        where: { id: fpeData.memberId },
      });
      
      if (!member) throw new Error("Member not found for FPE Encounter");
      if (!member.hasConsent) throw new Error("Cannot encode FPE: Patient has not signed PhilHealth record sharing consent");

      // 2. Create FPE Record and automatically mark the 40% capitation tranche as unlocked
      return await tx.fpeRecord.create({
        data: {
          caseNo: fpeData.caseNo || `FPE-${Date.now()}`,
          memberId: fpeData.memberId,
          effectivityYear: new Date().getFullYear(),
          medicalSurgicalHistory: fpeData.medicalSurgicalHistory,
          familyPersonalHistory: fpeData.familyPersonalHistory,
          immunizations: fpeData.immunizations,
          obGyneHistory: fpeData.obGyneHistory,
          vitalsAndPhysicals: fpeData.vitalsAndPhysicals,
          ncdHighRiskAssessment: fpeData.ncdHighRiskAssessment,
          riskLevel: fpeData.riskLevel,
          status: 'Encoded',
          fpeTrancheUnlocked: true, // ✅ Successfully triggers the 40% initial release milestone
          initialTrancheAmount: fpeData.initialTrancheAmount ?? 680.00,
        },
      });
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('FPE Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
