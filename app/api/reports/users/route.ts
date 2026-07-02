import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Server-side Pagination & Filtering Parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    // Prisma ILIKE search using `contains` with `mode: 'insensitive'`
    const whereClause = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { philhealthPin: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Execute query and count in parallel for performance
    const [patients, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: { // Payload Minimization: Only fetch what the grid needs
          id: true,
          philhealthPin: true,
          firstName: true,
          lastName: true,
          clientType: true,
          packageType: true,
          sex: true,
          mobileNumber: true,
          createdAt: true,
        }
      }),
      prisma.member.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
