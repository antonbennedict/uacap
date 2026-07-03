import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const members = await request.json(); 
    
    const mapNulls = (val: any) => {
      if (!val || val === 'NONE' || val === 'N/A' || val === '') return null;
      return val;
    };

    const result = await prisma.member.createMany({
      data: members.map((m: any) => ({
        philhealthPin: m.philhealthPin,
        clientType: m.clientType || 'MEMBER',
        lastName: m.lastName,
        firstName: m.firstName,
        middleName: mapNulls(m.middleName),
        dateOfBirth: new Date(m.dateOfBirth),
        sex: m.sex || 'MALE',
        hasConsent: m.hasConsent ?? false,
        packageType: m.packageType || 'KONSULTA',
        mobileNumber: mapNulls(m.mobileNumber),
        // Classification fields
        memberType: mapNulls(m.memberType) ?? mapNulls(m.type),
        department: mapNulls(m.department),
        idNumber: mapNulls(m.idNumber) ?? mapNulls(m.studentNumber) ?? mapNulls(m.employeeId),
        enrollmentStatus: mapNulls(m.enrollmentStatus) ?? mapNulls(m.status) ?? 'Active',
      })),
      skipDuplicates: true, 
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Masterlist Import Error:', error);
    return NextResponse.json({ error: 'Failed to import members' }, { status: 500 });
  }
}
