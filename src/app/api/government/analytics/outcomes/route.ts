// src/app/api/government/analytics/outcomes/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectOutcomeCollection } from '@/lib/outcome';

async function verifyGovAuth() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;
  const user = session.user as { id?: string; role?: string };
  if (user.role !== 'GOVERNMENT') return null;
  return user;
}

export async function GET() {
  try {
    const user = await verifyGovAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const coll = await getProjectOutcomeCollection();

    const typeAgg = await coll.aggregate<{
      _id: string;
      count: number;
      totalCurrent: number;
      totalTarget: number;
    }>([
      {
        $group: {
          _id: '$outcomeType',
          count: { $sum: 1 },
          totalCurrent: { $sum: { $ifNull: ['$currentValue', 0] } },
          totalTarget: { $sum: { $ifNull: ['$targetValue', 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]).toArray();

    const total = await coll.countDocuments({});
    const verified = await coll.countDocuments({ verified: true });

    return NextResponse.json({
      success: true,
      data: {
        total,
        verified,
        unverified: total - verified,
        byType: typeAgg,
      },
    });
  } catch (error) {
    console.error('GET government outcomes analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
