// src/app/api/government/analytics/challenges/route.ts
// Server-side aggregation for challenge analytics.
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';

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

    const challengeColl = await getChallengeCollection();

    // Status aggregation
    const statusAgg = await challengeColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Domain aggregation
    const domainAgg = await challengeColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Priority aggregation
    const priorityAgg = await challengeColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Location state aggregation (best-effort from free-form data)
    const locationStateAgg = await challengeColl.aggregate<{ _id: string; count: number }>([
      { $match: { 'location.state': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]).toArray();

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyAgg = await challengeColl.aggregate<{ _id: { year: number; month: number }; count: number }>([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]).toArray();

    // AI analysis coverage
    const aiAnalyzed = await challengeColl.countDocuments({ 'aiAnalysis': { $exists: true, $ne: null } });
    const totalCount = await challengeColl.countDocuments({});

    // Duplicate detection
    const withDuplicates = await challengeColl.countDocuments({
      'aiAnalysis.duplicateCandidates.0': { $exists: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        statusBreakdown: statusAgg,
        domainBreakdown: domainAgg,
        priorityBreakdown: priorityAgg,
        locationStateBreakdown: locationStateAgg,
        monthlyTrend: monthlyAgg,
        aiCoverage: { analyzed: aiAnalyzed, total: totalCount },
        duplicateDetections: withDuplicates,
      },
    });
  } catch (error) {
    console.error('GET government challenge analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
