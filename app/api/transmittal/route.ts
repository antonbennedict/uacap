import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clinicId,
      startDate,
      endDate,
      fpeCount,
      prescriptionCount,
      soapCount,
      labCount,
      actor,
      fpeRecordIds = []
    } = body;

    // Create Transmittal batch in the database
    const transmittal = await prisma.transmittal.create({
      data: {
        clinicId: clinicId || 'ua-clinic',
        startDate: new Date(startDate || new Date()),
        endDate: new Date(endDate || new Date()),
        fpeCount: parseInt(fpeCount) || 0,
        prescriptionCount: parseInt(prescriptionCount) || 0,
        soapCount: parseInt(soapCount) || 0,
        labCount: parseInt(labCount) || 0,
        actor: actor || 'Clinic Staff',
        status: 'Dispatched',
        // Connect existing FPE Records to this transmittal batch
        fpeRecords: fpeRecordIds.length > 0 ? {
          connect: fpeRecordIds.map((id: string) => ({ id }))
        } : undefined,
      },
    });

    // Also write an audit log entry for this system action
    await prisma.auditLog.create({
      data: {
        actionType: 'TRANSMITTAL_DISPATCHED',
        description: `Dispatched transmittal bundle of ${fpeCount + prescriptionCount + soapCount + labCount} records to PhilHealth NCR South. Ref ID: ${transmittal.id}`,
        actor: actor || 'Clinic Staff',
      }
    });

    return NextResponse.json({ success: true, transmittal }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transmittal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
