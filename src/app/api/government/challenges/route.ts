// src/app/api/government/challenges/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { getUniversityMatchCollection } from '@/lib/university';
import { getProjectsCollection } from '@/lib/project';

async function verifyGovAuth() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;
  const user = session.user as { id?: string; role?: string };
  if (user.role !== 'GOVERNMENT') return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await verifyGovAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const domainFilter = searchParams.get('domain');
    const priorityFilter = searchParams.get('priority');
    const statusFilter = searchParams.get('status');
    const aiFilter = searchParams.get('aiAnalyzed'); // 'yes' | 'no'
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const skip = (page - 1) * limit;

    const challengeColl = await getChallengeCollection();
    const query: Record<string, unknown> = {};
    if (domainFilter) query.domain = domainFilter;
    if (priorityFilter) query.priority = priorityFilter;
    if (statusFilter) query.status = statusFilter;
    if (aiFilter === 'yes') query['aiAnalysis'] = { $exists: true, $ne: null };
    if (aiFilter === 'no') query['aiAnalysis'] = { $exists: false };

    const [challenges, total] = await Promise.all([
      challengeColl.find(query, {
        projection: {
          challengeId: 1, title: 1, domain: 1, priority: 1, status: 1,
          location: 1, createdAt: 1,
          'aiAnalysis.status': 1, 'aiAnalysis.domainConfidence': 1, 'aiAnalysis.duplicateCandidates': 1,
        },
      }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      challengeColl.countDocuments(query),
    ]);

    if (challenges.length === 0) {
      return NextResponse.json({ success: true, data: { challenges: [], total: 0, page, pages: 0 } });
    }

    // Check which have university matches
    const challengeIds = challenges.map((c) => c.challengeId);
    const matchColl = await getUniversityMatchCollection();
    const projectsColl = await getProjectsCollection();
    const [matchAgg, projectAgg] = await Promise.all([
      matchColl.aggregate<{ _id: string }>([
        { $match: { challengeId: { $in: challengeIds } } },
        { $group: { _id: '$challengeId' } },
      ]).toArray(),
      projectsColl.aggregate<{ _id: string; status: string }>([
        { $match: { challengeId: { $in: challengeIds } } },
        { $group: { _id: '$challengeId', status: { $first: '$status' } } },
      ]).toArray(),
    ]);

    const matchedSet = new Set(matchAgg.map((m) => m._id));
    const projectMap = new Map(projectAgg.map((p) => [p._id, p.status]));

    const enriched = challenges.map((c) => ({
      challengeId: c.challengeId,
      title: c.title,
      domain: c.domain,
      priority: c.priority,
      status: c.status,
      location: c.location,
      createdAt: c.createdAt,
      aiStatus: c.aiAnalysis?.status ?? null,
      hasDuplicateCandidates: (c.aiAnalysis?.duplicateCandidates?.length ?? 0) > 0,
      hasUniversityMatch: matchedSet.has(c.challengeId),
      projectStatus: projectMap.get(c.challengeId) ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: { challenges: enriched, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/government/challenges error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
