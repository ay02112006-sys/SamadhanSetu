// src/app/api/government/projects/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { getUsersCollection } from '@/lib/university';
import { getIndustryCollaborationCollection } from '@/lib/industry';

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
    const statusFilter = searchParams.get('status');
    const domainFilter = searchParams.get('domain');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const skip = (page - 1) * limit;

    const projectsColl = await getProjectsCollection();
    const projectQuery: Record<string, unknown> = {};
    if (statusFilter) projectQuery.status = statusFilter;

    const [projects, total] = await Promise.all([
      projectsColl.find(projectQuery).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
      projectsColl.countDocuments(projectQuery),
    ]);

    if (projects.length === 0) {
      return NextResponse.json({ success: true, data: { projects: [], total: 0, page, pages: 0 } });
    }

    // Enrich with challenge and university info
    const challengeIds = [...new Set(projects.map((p) => p.challengeId))];
    const universityIds = [...new Set(projects.map((p) => p.universityId))];

    const challengeColl = await getChallengeCollection();
    const challengeQuery: Record<string, unknown> = { challengeId: { $in: challengeIds } };
    if (domainFilter) challengeQuery.domain = domainFilter;
    const [challenges, universities, collabs] = await Promise.all([
      challengeColl.find(challengeQuery).project({ challengeId: 1, title: 1, domain: 1, location: 1, priority: 1, status: 1 }).toArray(),
      (await getUsersCollection()).find({ role: 'UNIVERSITY' }, { projection: { _id: 1, 'universityProfile.universityName': 1 } }).toArray(),
      (await getIndustryCollaborationCollection()).aggregate<{ _id: string; count: number }>([
        { $match: { projectId: { $in: projects.map((p) => p.projectId) } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const challengeMap = new Map(challenges.map((c) => [c.challengeId, c]));
    const universityMap = new Map(universities.map((u) => [u._id?.toString(), u.universityProfile?.universityName ?? 'Unknown']));
    const collabMap = new Map(collabs.map((c) => [c._id, c.count]));

    const enriched = projects.map((p) => {
      const challenge = challengeMap.get(p.challengeId);
      if (domainFilter && !challenge) return null;
      return {
        projectId: p.projectId,
        title: p.title,
        status: p.status,
        progress: p.progress,
        targetDate: p.targetDate,
        updatedAt: p.updatedAt,
        challengeId: p.challengeId,
        challengeTitle: challenge?.title ?? 'Unknown',
        challengeDomain: challenge?.domain ?? 'Unknown',
        challengeLocation: challenge?.location ?? {},
        universityName: universityMap.get(p.universityId) ?? 'Unknown',
        industryCollaborations: collabMap.get(p.projectId) ?? 0,
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: { projects: enriched, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/government/projects error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
