import { NextRequest, NextResponse } from 'next/server';
import membersData from '@/lib/data/members.json';
import type { Member } from '@/lib/types';

const members: Member[] = membersData as Member[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase().trim() ?? '';

  if (!query) {
    return NextResponse.json({ members: [] });
  }

  const results = members.filter((m) => {
    const fullName = `${m.firstName} ${m.middleName} ${m.lastName}`.toLowerCase();
    const pin = m.philhealthPin.toLowerCase();
    return fullName.includes(query) || pin.includes(query) ||
      m.lastName.toLowerCase().includes(query) ||
      m.firstName.toLowerCase().includes(query);
  });

  return NextResponse.json({ members: results });
}
