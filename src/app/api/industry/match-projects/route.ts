// src/app/api/industry/match-projects/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getIndustryProfileCollection, getIndustryMatchCollection } from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { calculateIndustryMatch } from '@/lib/industry-matching';
import { IndustryProjectMatch } from '@/types/industry-match';

export async function POST() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'INDUSTRY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const profileColl = await getIndustryProfileCollection();
    const profile = await profileColl.findOne({ userId: user.id });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Please complete your industry profile first' },
        { status: 400 }
      );
    }

    // Load eligible projects
    const projectsColl = await getProjectsCollection();
    const projects = await projectsColl
      .find({ status: { $in: ['PLANNING', 'IN_PROGRESS', 'UNDER_REVIEW', 'TESTING'] } })
      .toArray();

    if (projects.length === 0) {
      return NextResponse.json({ success: true, matches: [], message: 'No eligible projects currently' });
    }

    // Load challenges for all projects
    const challengeColl = await getChallengeCollection();
    const challengeIds = [...new Set(projects.map((p) => p.challengeId))];
    const challenges = await challengeColl.find({ challengeId: { $in: challengeIds } }).toArray();
    const challengeMap = new Map(challenges.map((c) => [c.challengeId, c]));

    const matchColl = await getIndustryMatchCollection();
    const now = new Date();
    const createdMatches: IndustryProjectMatch[] = [];

    for (const project of projects) {
      const challenge = challengeMap.get(project.challengeId);
      if (!challenge) continue;

      const matchData = calculateIndustryMatch({ industry: profile, project, challenge });

      // Only store meaningful matches (score > 0)
      if (matchData.score === 0) continue;

      const matchDoc: IndustryProjectMatch = {
        ...matchData,
        status: 'SUGGESTED',
        createdAt: now,
        updatedAt: now,
      };

      // Idempotent upsert — prevents duplicates
      await matchColl.updateOne(
        { projectId: project.projectId, industryId: user.id },
        {
          $set: {
            score: matchDoc.score,
            reasons: matchDoc.reasons,
            matchedAreas: matchDoc.matchedAreas,
            matchedExpertise: matchDoc.matchedExpertise,
            matchedTechnologies: matchDoc.matchedTechnologies,
            matchedCapabilities: matchDoc.matchedCapabilities,
            confidence: matchDoc.confidence,
            updatedAt: now,
          },
          $setOnInsert: {
            status: 'SUGGESTED',
            createdAt: now,
          },
        },
        { upsert: true }
      );
      createdMatches.push(matchDoc);
    }

    // Return sorted by score
    createdMatches.sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, matches: createdMatches, count: createdMatches.length });
  } catch (error) {
    console.error('POST /api/industry/match-projects error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
