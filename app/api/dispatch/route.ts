import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('sourceType');

    const where = sourceType ? { sourceType } : {};

    const records = await prisma.dispatchRecord.findMany({
      where,
      orderBy: { dispatchedAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await prisma.dispatchRecord.create({
      data: {
        sourceType: body.sourceType,
        sourceId: body.sourceId,
        patientName: body.patientName,
        patientPin: body.patientPin,
        description: body.description,
        actor: body.actor || 'System',
        status: 'Dispatched',
      },
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
