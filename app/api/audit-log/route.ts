import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { AuditLogEntry } from '@/lib/types';

export async function GET() {
  try {
    const auditLog = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent logs
    });
    return NextResponse.json({ auditLog });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = await prisma.auditLog.create({
      data: {
        actionType: body.actionType || 'UNKNOWN',
        description: body.description || '',
        actor: body.actor || 'System',
      }
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
