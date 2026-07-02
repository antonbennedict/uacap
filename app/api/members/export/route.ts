import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { lastName: 'asc' },
    });

    if (!members || members.length === 0) {
      return new NextResponse('No members found', { status: 404 });
    }

    // CSV Header matching PhilHealth PKRF / XML expectations
    const headers = [
      'PhilHealth_PIN',
      'Last_Name',
      'First_Name',
      'Middle_Name',
      'Extension',
      'Date_of_Birth',
      'Sex',
      'Client_Type',
      'Package_Type',
      'Mobile_Number',
      'Landline_Number',
      'Barangay',
      'City_Municipality',
      'Province',
      'Has_Consent'
    ];

    const rows = members.map(m => [
      m.philhealthPin || '',
      m.lastName || '',
      m.firstName || '',
      m.middleName || '',
      m.extension || '',
      m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : '',
      m.sex || '',
      m.clientType || '',
      m.packageType || '',
      m.mobileNumber || '',
      m.landlineNumber || '',
      m.barangay || '',
      m.cityMunicipality || '',
      m.province || '',
      m.hasConsent ? 'YES' : 'NO'
    ]);

    // Construct CSV String safely handling quotes and commas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="philhealth_masterlist_export.csv"',
      },
    });

  } catch (error) {
    console.error('Masterlist Export Error:', error);
    return new NextResponse('Failed to export masterlist', { status: 500 });
  }
}
