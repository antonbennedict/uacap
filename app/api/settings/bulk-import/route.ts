import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows = body.rows || [];
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    const mapNulls = (val: any) => {
      if (!val || val === 'NONE' || val === 'N/A' || val === '') return null;
      return val;
    };
    const mapDates = (val: any) => {
      if (!val || val === '1900-01-01' || val === 'NONE' || val === '') return null;
      return new Date(val);
    };

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        if (!row?.philhealthPin || !row?.lastName || !row?.firstName || !row?.dateOfBirth) {
          skippedCount++;
          continue;
        }

        const existing = await tx.member.findUnique({
          where: { philhealthPin: row.philhealthPin }
        });

        if (existing) {
          skippedCount++;
        } else {
          await tx.member.create({
            data: {
              philhealthPin: row.philhealthPin,
              packageType: mapNulls(row.packageType) ?? 'KONSULTA',
              hasConsent: String(row.hasConsent).toLowerCase() === 'true',
              clientType: mapNulls(row.clientType) ?? 'MEMBER',
              lastName: row.lastName,
              firstName: row.firstName,
              middleName: mapNulls(row.middleName),
              extension: mapNulls(row.extension),
              dateOfBirth: new Date(row.dateOfBirth),
              sex: row.sex ?? 'MALE',
              mobileNumber: mapNulls(row.mobileNumber),
              barangay: mapNulls(row.barangay),
              cityMunicipality: mapNulls(row.cityMunicipality),
              province: mapNulls(row.province),
              sponsorPin: mapNulls(row.sponsorPin),
              sponsorLastName: mapNulls(row.sponsorLastName),
              sponsorFirstName: mapNulls(row.sponsorFirstName),
              sponsorMiddleName: mapNulls(row.sponsorMiddleName),
              sponsorExtension: mapNulls(row.sponsorExtension),
              sponsorDateOfBirth: mapDates(row.sponsorDateOfBirth),
              sponsorSex: mapNulls(row.sponsorSex),
              // New classification fields
              memberType: mapNulls(row.memberType) ?? mapNulls(row.type),
              department: mapNulls(row.department),
              idNumber: mapNulls(row.idNumber) ?? mapNulls(row.studentNumber) ?? mapNulls(row.employeeId),
              enrollmentStatus: mapNulls(row.enrollmentStatus) ?? mapNulls(row.status) ?? 'Active',
            }
          });
          insertedCount++;
        }
      }
    });

    return NextResponse.json({ success: true, insertedCount, skippedCount });
  } catch (error: any) {
    console.error('Bulk Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
