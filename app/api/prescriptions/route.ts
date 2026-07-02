import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Prescription } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberPin = searchParams.get('memberPin');

    let prescriptions;
    if (memberPin) {
      prescriptions = await prisma.prescription.findMany({
        where: { member: { philhealthPin: memberPin } },
        orderBy: { consultationDate: 'desc' }
      });
    } else {
      prescriptions = await prisma.prescription.findMany({
        orderBy: { consultationDate: 'desc' }
      });
    }

    return NextResponse.json({ prescriptions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prescription = body as Prescription;

    if (!prescription.memberPin || !prescription.items || prescription.items.length === 0) {
      return NextResponse.json({ error: 'Invalid prescription data' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { philhealthPin: prescription.memberPin }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const newPrescription = await prisma.prescription.create({
      data: {
        transactionNumber: prescription.prescriptionNumber || `RX-${Date.now()}`,
        memberId: member.id,
        consultationDate: new Date(prescription.createdAt || Date.now()),
        prescribingPhysician: prescription.physicianName || 'Unknown',
        items: prescription.items as any,
        status: prescription.status || 'Draft',
      }
    });

    return NextResponse.json({ prescription: newPrescription }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
