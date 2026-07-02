import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const soapData = await request.json();

    const soap = await prisma.soapNote.create({
      data: {
        memberId: soapData.memberId,
        physicianName: soapData.physicianName,
        subjective: soapData.subjective,     
        objective: soapData.objective,       
        assessment: soapData.assessment,     
        planManagement: soapData.planManagement, 
        isYearEndCompliant: soapData.isYearEndCompliant ?? false,
        satisfactionScore: soapData.satisfactionScore,
        status: 'Finalized',
      },
    });

    return NextResponse.json({ success: true, soap });
  } catch (error) {
    console.error('SOAP Note Error:', error);
    return NextResponse.json({ error: 'Failed to create SOAP Note' }, { status: 500 });
  }
}
