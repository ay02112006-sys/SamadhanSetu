// src/app/api/industry/projects/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryMatchCollection } from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { getUsersCollection } from '@/lib/university';

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'INDUSTRY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const domainFilter = searchParams.get('domain');

    // Load all matches for this industry, sorted by score desc
    const matchColl = await getIndustryMatchCollection();
    const matches = await matchColl
      .find({ industryId: user.id, score: { $gt: 0 } })
      .sort({ score: -1 })
      .toArray();

    if (matches.length === 0) {
      return NextResponse.json({ success: true, projects: [] });
    }

    const projectIds = matches.map((m) => m.projectId);
    const projectsColl = await getProjectsCollection();

    const projectQuery: Record<string, unknown> = { projectId: { $in: projectIds } };
    if (statusFilter) {
      projectQuery.status = statusFilter;
    }

    const projects = await projectsColl.find(projectQuery).toArray();
    const projectMap = new Map(projects.map((p) => [p.projectId, p]));

    // Load challenges
    const challengeIds = [...new Set(projects.map((p) => p.challengeId))];
    const challengeColl = await getChallengeCollection();
    const challengeQuery: Record<string, unknown> = { challengeId: { $in: challengeIds } };
    if (domainFilter) challengeQuery.domain = domainFilter;
    const challenges = await challengeColl.find(challengeQuery).toArray();
    const challengeMap = new Map(challenges.map((c) => [c.challengeId, c]));

    // Load university names (public info only)
    const universityIds = [...new Set(projects.map((p) => p.universityId))];
    const usersColl = await getUsersCollection();
    const universities = await usersColl
      .find({ _id: { $in: universityIds as string[] } } as Parameters<typeof usersColl.find>[0])
      .project({ _id: 1, name: 1, 'universityProfile.universityName': 1, 'universityProfile.city': 1, 'universityProfile.state': 1 })
      .toArray();
    const universityMap = new Map(universities.map((u) => [u._id?.toString(), u]));

    // Compose public-safe project view with match info
    const result = matches
      .map((match) => {
        const project = projectMap.get(match.projectId);
        if (!project) return null;
        const challenge = challengeMap.get(project.challengeId);
        if (!challenge && domainFilter) return null; // Filtered out
        const university = universityMap.get(project.universityId);

        return {
          projectId: project.projectId,
          title: project.title,
          description: project.description,
          status: project.status,
          progress: project.progress,
          targetDate: project.targetDate,
          mentor: { name: project.mentor.name }, // Only public name, no email
          memberCount: project.members.length,
          challengeId: project.challengeId,
          challengeTitle: challenge?.title ?? 'Unknown',
          challengeDomain: challenge?.domain ?? 'Unknown',
          challengeLocation: challenge?.location ?? {},
          universityName: university?.universityProfile?.universityName ?? 'University',
          universityCity: university?.universityProfile?.city ?? '',
          universityState: university?.universityProfile?.state ?? '',
          // Match explanation
          matchScore: match.score,
          matchConfidence: match.confidence,
          matchReasons: match.reasons,
          matchedAreas: match.matchedAreas,
          matchedExpertise: match.matchedExpertise,
          matchedTechnologies: match.matchedTechnologies,
          matchedCapabilities: match.matchedCapabilities,
          matchStatus: match.status,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, projects: result });
  } catch (error) {
    console.error('GET /api/industry/projects error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
