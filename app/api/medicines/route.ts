import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const medicines = await prisma.medicine.findMany();
    return NextResponse.json({ medicines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { medicineId, action, quantity } = body as {
      medicineId: string;
      action: 'restock' | 'deduct';
      quantity: number;
    };

    const medicine = await prisma.$transaction(async (tx) => {
      const currentMed = await tx.medicine.findUnique({
        where: { id: medicineId },
      });

      if (!currentMed) {
        throw new Error('Medicine not found');
      }

      let newQuantity = currentMed.quantity;
      if (action === 'restock') {
        newQuantity += quantity;
      } else if (action === 'deduct') {
        if (currentMed.quantity < quantity) {
          throw new Error('Insufficient stock');
        }
        newQuantity -= quantity;
      }

      return await tx.medicine.update({
        where: { id: medicineId },
        data: { quantity: newQuantity },
      });
    });

    return NextResponse.json({ medicine });
  } catch (error: any) {
    const status = error.message === 'Medicine not found' || error.message === 'Insufficient stock' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
