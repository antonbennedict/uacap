import { NextResponse } from 'next/server';
import auditLogData from '@/lib/data/audit-log.json';
import type { AuditLogEntry } from '@/lib/types';

let auditLog: AuditLogEntry[] = (auditLogData as unknown as AuditLogEntry[]).sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
);

export async function GET() {
  return NextResponse.json({ auditLog });
}

export async function POST(request: Request) {
  const body = await request.json();
  const entry: AuditLogEntry = {
    ...body,
    id: `audit-server-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  auditLog = [entry, ...auditLog];
  return NextResponse.json({ entry }, { status: 201 });
}
