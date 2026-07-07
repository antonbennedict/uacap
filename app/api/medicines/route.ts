import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    const session = await getServerSession(authOptions);
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

      const updatedMed = await tx.medicine.update({
        where: { id: medicineId },
        data: { quantity: newQuantity },
      });

      // Insert Audit Log entry inside transaction context
      await tx.auditLog.create({
        data: {
          actionType: action === 'restock' ? 'RESTOCK' : 'STOCK_DEDUCTED',
          description: action === 'restock'
            ? `Restocked ${quantity} units of ${currentMed.genericName} (${currentMed.dosageForm || 'Tablet'}). New total: ${newQuantity}.`
            : `Deducted ${quantity} units of ${currentMed.genericName} (${currentMed.dosageForm || 'Tablet'}). New total: ${newQuantity}.`,
          actor: session?.user?.name || 'Clinic Staff',
        }
      });

      return updatedMed;
    });

    return NextResponse.json({ medicine });
  } catch (error: any) {
    const status = error.message === 'Medicine not found' || error.message === 'Insufficient stock' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
