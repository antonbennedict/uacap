import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Patient Influx (Grouped by hour of arrival time)
    // We'll fetch today's entries or all entries if we want to show general activity.
    // Let's fetch all triage entries and group by hour.
    const triageEntries = await prisma.triageEntry.findMany({
      select: { arrivalTime: true }
    });

    const influxMap: Record<string, number> = {};
    for (const entry of triageEntries) {
      const hour = new Date(entry.arrivalTime).getHours();
      // Format hour like "08:00", "14:00"
      const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
      influxMap[formattedHour] = (influxMap[formattedHour] || 0) + 1;
    }

    // Sort by hour
    const activityData = Object.keys(influxMap)
      .sort()
      .map(time => ({ time, patients: influxMap[time] }));

    // If empty, provide an empty state fallback
    if (activityData.length === 0) {
      activityData.push(
        { time: '08:00', patients: 0 },
        { time: '12:00', patients: 0 },
        { time: '16:00', patients: 0 }
      );
    }

    // GAMOT Formulary Utilization (Summing JSON items)
    const prescriptions = await prisma.prescription.findMany({
      select: { items: true }
    });

    const medMap: Record<string, number> = {};
    for (const p of prescriptions) {
      const items = Array.isArray(p.items) ? p.items : typeof p.items === 'string' ? JSON.parse(p.items) : [];
      for (const item of items) {
        if (item.name) {
          medMap[item.name] = (medMap[item.name] || 0) + (parseInt(item.quantity) || 1);
        }
      }
    }

    const formularyData = Object.keys(medMap)
      .map(name => ({ name, prescribed: medMap[name] }))
      .sort((a, b) => b.prescribed - a.prescribed)
      .slice(0, 10); // top 10

    // Triage Priorities (Pie Chart)
    const triageByPriority = await prisma.triageEntry.groupBy({
      by: ['priority'],
      _count: { priority: true }
    });
    const priorityData = triageByPriority.map(t => ({
      name: t.priority,
      value: t._count.priority
    }));
    if (priorityData.length === 0) {
      priorityData.push({ name: 'Normal', value: 1 });
    }

    // Demographics: Client Type (Pie Chart)
    const membersByClientType = await prisma.member.groupBy({
      by: ['clientType'],
      _count: { clientType: true }
    });
    const clientTypeData = membersByClientType.map(m => ({
      name: m.clientType,
      value: m._count.clientType
    }));
    if (clientTypeData.length === 0) {
      clientTypeData.push({ name: 'MEMBER', value: 1 });
    }

    return NextResponse.json({ activityData, formularyData, priorityData, clientTypeData });
  } catch (error) {
    console.error('Failed to fetch metrics for reports:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
