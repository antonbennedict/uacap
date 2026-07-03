import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));

    const members = await prisma.member.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        philhealthPin: true,
        firstName: true,
        lastName: true,
        middleName: true,
        clientType: true,
        memberType: true,
        department: true,
        idNumber: true,
        enrollmentStatus: true,
        sex: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Failed to fetch recent imports:', error);
    return NextResponse.json({ error: 'Failed to fetch recent imports' }, { status: 500 });
  }
}
