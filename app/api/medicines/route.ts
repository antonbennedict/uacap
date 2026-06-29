import { NextRequest, NextResponse } from 'next/server';
import medicinesData from '@/lib/data/medicines.json';
import type { Medicine } from '@/lib/types';

// In-memory store for server-side mutations (seed on first access)
let medicines: Medicine[] = medicinesData as Medicine[];

export async function GET() {
  return NextResponse.json({ medicines });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { medicineId, action, quantity } = body as {
    medicineId: string;
    action: 'restock' | 'deduct';
    quantity: number;
  };

  const idx = medicines.findIndex((m) => m.id === medicineId);
  if (idx === -1) {
    return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
  }

  if (action === 'restock') {
    medicines[idx] = { ...medicines[idx], currentStock: medicines[idx].currentStock + quantity };
  } else if (action === 'deduct') {
    if (medicines[idx].currentStock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }
    medicines[idx] = { ...medicines[idx], currentStock: medicines[idx].currentStock - quantity };
  }

  return NextResponse.json({ medicine: medicines[idx] });
}
