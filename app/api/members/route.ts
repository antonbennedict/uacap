import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase().trim() ?? '';

  try {
    const whereClause = query ? {
      OR: [
        { philhealthPin: { contains: query, mode: 'insensitive' as const } },
        { firstName: { contains: query, mode: 'insensitive' as const } },
        { lastName: { contains: query, mode: 'insensitive' as const } },
      ]
    } : {};

    const rawMembers = await prisma.member.findMany({
      where: whereClause,
      include: {
        eligibilityChecks: true,
        fpeRecords: {
          orderBy: { encounterDate: 'desc' },
          take: 1
        }
      }
    });

    // Fetch dependents
    const pins = rawMembers.map(m => m.philhealthPin);
    const dependents = await prisma.member.findMany({
      where: {
        sponsorPin: { in: pins },
        clientType: 'DEPENDENT'
      }
    });

    const members = rawMembers.map(m => ({
      ...m,
      dependents: dependents.filter(d => d.sponsorPin === m.philhealthPin)
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Members Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
