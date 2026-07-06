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

      // Update member details from Client Profile edits
      await tx.member.update({
        where: { id: fpeData.memberId },
        data: {
          philhealthPin: fpeData.philhealthPin,
          lastName: fpeData.lastName,
          firstName: fpeData.firstName,
          middleName: fpeData.middleName || null,
          extension: fpeData.extension || null,
          dateOfBirth: fpeData.dob ? new Date(fpeData.dob) : undefined,
          sex: fpeData.sex,
          clientType: fpeData.clientType,
        }
      });

      const dataObj = {
        caseNo: fpeData.caseNo || `FPE-${Date.now()}`,
        memberId: fpeData.memberId,
        effectivityYear: fpeData.effectivityYear || new Date().getFullYear(),
        medicalSurgicalHistory: fpeData.medicalSurgicalHistory,
        familyPersonalHistory: fpeData.familyPersonalHistory,
        immunizations: fpeData.immunizations,
        obGyneHistory: fpeData.obGyneHistory,
        vitalsAndPhysicals: fpeData.vitalsAndPhysicals,
        ncdHighRiskAssessment: fpeData.ncdHighRiskAssessment,
        riskLevel: fpeData.riskLevel,
        status: fpeData.status || 'Encoded',
        fpeTrancheUnlocked: true,
        initialTrancheAmount: fpeData.initialTrancheAmount ?? 680.00,
      };

      const existingFpe = fpeData.id && !fpeData.id.startsWith('fpe-') ? await tx.fpeRecord.findUnique({
        where: { id: fpeData.id }
      }) : null;

      if (existingFpe) {
        return await tx.fpeRecord.update({
          where: { id: fpeData.id },
          data: dataObj,
        });
      } else {
        return await tx.fpeRecord.create({
          data: {
            id: fpeData.id || undefined,
            ...dataObj,
          },
        });
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('FPE Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
