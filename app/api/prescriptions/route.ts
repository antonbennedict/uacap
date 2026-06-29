import { NextRequest, NextResponse } from 'next/server';
import prescriptionsData from '@/lib/data/prescriptions.json';
import type { Prescription } from '@/lib/types';

// In-memory store seeded from JSON
let prescriptions: Prescription[] = prescriptionsData as Prescription[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberPin = searchParams.get('memberPin');

  if (memberPin) {
    const filtered = prescriptions.filter((p) => p.memberPin === memberPin);
    return NextResponse.json({ prescriptions: filtered });
  }

  return NextResponse.json({ prescriptions });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const prescription = body as Prescription;

  // Validate required fields
  if (!prescription.memberPin || !prescription.items || prescription.items.length === 0) {
    return NextResponse.json({ error: 'Invalid prescription data' }, { status: 400 });
  }

  prescriptions = [prescription, ...prescriptions];
  return NextResponse.json({ prescription }, { status: 201 });
}
