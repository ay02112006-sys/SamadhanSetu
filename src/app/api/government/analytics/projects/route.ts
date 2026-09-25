// src/app/api/government/analytics/projects/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getProjectsCollection,
  getMilestonesCollection,
  getProjectDeliverablesCollection,
  getProjectReviewsCollection,
} from '@/lib/project';

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

    const [projectsColl, milestonesColl, deliverablesColl, reviewsColl] = await Promise.all([
      getProjectsCollection(),
      getMilestonesCollection(),
      getProjectDeliverablesCollection(),
      getProjectReviewsCollection(),
    ]);

    // Status breakdown
    const statusAgg = await projectsColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Progress buckets
    const progressAgg = await projectsColl.aggregate<{ _id: string; count: number }>([
      {
        $bucket: {
          groupBy: '$progress',
          boundaries: [0, 26, 51, 76, 100],
          default: '100',
          output: { count: { $sum: 1 } },
        },
      },
    ]).toArray();

    // Average progress
    const avgProgressAgg = await projectsColl.aggregate<{ avgProgress: number }>([
      { $group: { _id: null, avgProgress: { $avg: '$progress' } } },
    ]).toArray();
    const avgProgress = avgProgressAgg[0]?.avgProgress ?? 0;

    // Milestone breakdown
    const milestoneStatusAgg = await milestonesColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray();

    // Overdue milestones (dueDate < now AND status != COMPLETED)
    const overdueCount = await milestonesColl.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: 'COMPLETED' },
    });

    // Deliverable breakdown
    const deliverableStatusAgg = await deliverablesColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray();

    // Review breakdown
    const reviewStatusAgg = await reviewsColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: {
        statusBreakdown: statusAgg,
        progressBuckets: progressAgg,
        avgProgress: Math.round(avgProgress * 10) / 10,
        milestoneBreakdown: milestoneStatusAgg,
        overdueMillestones: overdueCount,
        deliverableBreakdown: deliverableStatusAgg,
        reviewBreakdown: reviewStatusAgg,
      },
    });
  } catch (error) {
    console.error('GET government project analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
