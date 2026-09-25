// src/app/api/government/analytics/industry/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryProfileCollection,
  getIndustryInterestCollection,
  getIndustryCollaborationCollection,
  getCollaborationActivityCollection,
  getFundingCommitmentCollection,
} from '@/lib/industry';

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

    const [profileColl, interestColl, collabColl, actColl, fundColl] = await Promise.all([
      getIndustryProfileCollection(),
      getIndustryInterestCollection(),
      getIndustryCollaborationCollection(),
      getCollaborationActivityCollection(),
      getFundingCommitmentCollection(),
    ]);

    const [
      totalOrgs,
      interestStatusAgg,
      collabStatusAgg,
      activityTypeAgg,
      fundingStatusAgg,
      sectorAgg,
    ] = await Promise.all([
      profileColl.countDocuments({}),
      interestColl.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).toArray(),
      collabColl.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).toArray(),
      actColl.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      fundColl.aggregate<{ _id: string; count: number; totalAmount: number }>([
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]).toArray(),
      profileColl.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$industrySector', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
    ]);

    // Support type distribution from interests
    const supportTypeAgg = await interestColl.aggregate<{ _id: string; count: number }>([
      { $unwind: '$supportTypes' },
      { $group: { _id: '$supportTypes', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: {
        totalOrganizations: totalOrgs,
        interestBreakdown: interestStatusAgg,
        collaborationBreakdown: collabStatusAgg,
        activityTypeBreakdown: activityTypeAgg,
        fundingBreakdown: fundingStatusAgg,
        sectorBreakdown: sectorAgg,
        supportTypeDistribution: supportTypeAgg,
      },
    });
  } catch (error) {
    console.error('GET government industry analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
