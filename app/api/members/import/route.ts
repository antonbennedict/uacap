import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const members = await request.json(); 
    
    const result = await prisma.member.createMany({
      data: members.map((m: any) => ({
        philhealthPin: m.philhealthPin,
        clientType: m.clientType || 'Unknown',
        lastName: m.lastName,
        firstName: m.firstName,
        dateOfBirth: new Date(m.dateOfBirth),
        sex: m.sex,
        hasConsent: m.hasConsent ?? false,
      })),
      skipDuplicates: true, 
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Masterlist Import Error:', error);
    return NextResponse.json({ error: 'Failed to import members' }, { status: 500 });
  }
}
