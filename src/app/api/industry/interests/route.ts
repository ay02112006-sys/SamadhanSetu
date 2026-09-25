// src/app/api/industry/interests/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryInterestCollection } from '@/lib/industry';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'INDUSTRY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const interestColl = await getIndustryInterestCollection();
    const interests = await interestColl
      .find({ industryId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, interests });
  } catch (error) {
    console.error('GET /api/industry/interests error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
