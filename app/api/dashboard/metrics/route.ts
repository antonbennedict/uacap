import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Concurrent aggregation pipeline evaluating daily ops vs PhilHealth milestones
    const [
      waitingTriage, 
      activeConsults, 
      unlocked40PctCapitation, 
      unlocked60PctCapitation, 
      dispatchedBatches
    ] = await Promise.all([
      prisma.triageEntry.count({ where: { status: 'Waiting' } }),
      prisma.triageEntry.count({ where: { status: 'In-Consult' } }),
      prisma.fpeRecord.count({ where: { fpeTrancheUnlocked: true } }), // ✅ Milestone mapping
      prisma.soapNote.count({ where: { isYearEndCompliant: true } }),  // ✅ Milestone mapping
      prisma.transmittal.count({ where: { status: 'Dispatched' } }),
    ]);

    // Mocking the time-series and formulary data for the charts since Prisma doesn't have aggregate group by time yet easily in this SQLite setup without raw query
    const activityData = [
      { time: '08:00', patients: 4 },
      { time: '10:00', patients: 15 },
      { time: '12:00', patients: 8 },
      { time: '14:00', patients: 22 },
      { time: '16:00', patients: 12 },
    ];
    
    const formularyData = [
      { name: 'Losartan', prescribed: 145 },
      { name: 'Amlodipine', prescribed: 110 },
      { name: 'Metformin', prescribed: 95 },
      { name: 'Simvastatin', prescribed: 80 },
    ];

    return NextResponse.json({
      success: true,
      metrics: {
        waitingTriage,
        activeConsults,
        dispatchedBatches,
        capitationPerformance: {
          initialTrancheCount: unlocked40PctCapitation,
          yearEndTrancheCount: unlocked60PctCapitation
        },
        activityData,
        formularyData
      }
    });
  } catch (error) {
    console.error('Metrics Aggregation Error:', error);
    return NextResponse.json({ error: 'Failed to compute backend metrics' }, { status: 500 });
  }
}
