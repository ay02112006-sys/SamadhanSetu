// src/app/api/government/challenges/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { getUniversityMatchCollection, getUsersCollection, getUniversityTeamCollection } from '@/lib/university';
import { getProjectsCollection, getMilestonesCollection } from '@/lib/project';
import { getIndustryCollaborationCollection, getIndustryProfileCollection, getIndustryInterestCollection } from '@/lib/industry';
import { getProjectOutcomeCollection } from '@/lib/outcome';

async function verifyGovAuth() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;
  const user = session.user as { id?: string; role?: string };
  if (user.role !== 'GOVERNMENT') return null;
  return user;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyGovAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const challengeColl = await getChallengeCollection();
    const challenge = await challengeColl.findOne({ challengeId: params.id });
    if (!challenge) return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });

    const [matchColl, projectsColl, teamsColl, usersColl] = await Promise.all([
      getUniversityMatchCollection(),
      getProjectsCollection(),
      getUniversityTeamCollection(),
      getUsersCollection(),
    ]);

    // University matches (top 5 by score)
    const matches = await matchColl.find({ challengeId: params.id }).sort({ score: -1 }).limit(5).toArray();
    const universityIds = matches.map((m) => m.universityId);
    const universities = await usersColl.find(
      { role: 'UNIVERSITY' },
      { projection: { _id: 1, 'universityProfile.universityName': 1, 'universityProfile.city': 1, 'universityProfile.state': 1 } }
    ).toArray();
    const uniMap = new Map(universities.map((u) => [u._id?.toString(), u]));

    // Project
    const project = await projectsColl.findOne({ challengeId: params.id });
    let milestones: Array<{ title: string; status: string; dueDate: Date }> = [];
    let collaborations: Array<{ industryName: string; status: string; supportTypes: string[] }> = [];
    let interests: number = 0;
    let outcomes: Array<{ outcomeType: string; metricName: string; currentValue?: number; unit: string }> = [];

    if (project) {
      const [mColl, collabColl, interestColl, outcomeColl, profileColl] = await Promise.all([
        getMilestonesCollection(),
        getIndustryCollaborationCollection(),
        getIndustryInterestCollection(),
        getProjectOutcomeCollection(),
        getIndustryProfileCollection(),
      ]);

      const [milestoneData, collabData, interestCount, outcomeData] = await Promise.all([
        mColl.find({ projectId: project.projectId }).sort({ order: 1 }).toArray(),
        collabColl.find({ projectId: project.projectId }).toArray(),
        interestColl.countDocuments({ projectId: project.projectId }),
        outcomeColl.find({ projectId: project.projectId }).toArray(),
      ]);

      milestones = milestoneData.map((m) => ({ title: m.title, status: m.status, dueDate: m.dueDate }));
      interests = interestCount;
      outcomes = outcomeData;

      if (collabData.length > 0) {
        const iIds = collabData.map((c) => c.industryId);
        const profiles = await profileColl.find({ userId: { $in: iIds } }).toArray();
        const pMap = new Map(profiles.map((p) => [p.userId, p.organizationName]));
        collaborations = collabData.map((c) => ({
          industryName: pMap.get(c.industryId) ?? 'Industry Partner',
          status: c.status,
          supportTypes: c.supportTypes,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        challenge: {
          challengeId: challenge.challengeId,
          title: challenge.title,
          description: challenge.description,
          domain: challenge.domain,
          priority: challenge.priority,
          status: challenge.status,
          location: challenge.location,
          createdAt: challenge.createdAt,
          aiAnalysis: challenge.aiAnalysis ? {
            status: challenge.aiAnalysis.status,
            suggestedDomain: challenge.aiAnalysis.suggestedDomain,
            suggestedPriority: challenge.aiAnalysis.suggestedPriority,
            impactLevel: challenge.aiAnalysis.impactLevel,
            urgencyLevel: challenge.aiAnalysis.urgencyLevel,
            problemSummary: challenge.aiAnalysis.problemSummary,
            duplicateCandidates: challenge.aiAnalysis.duplicateCandidates,
            confidence: challenge.aiAnalysis.domainConfidence,
          } : null,
        },
        universityMatches: matches.map((m) => {
          const uni = uniMap.get(m.universityId);
          return {
            universityId: m.universityId,
            name: uni?.universityProfile?.universityName ?? 'Unknown',
            city: uni?.universityProfile?.city ?? '',
            score: m.score,
            status: m.status,
          };
        }),
        project: project ? {
          projectId: project.projectId,
          title: project.title,
          status: project.status,
          progress: project.progress,
          targetDate: project.targetDate,
          mentor: { name: project.mentor.name },
          memberCount: project.members.length,
        } : null,
        milestones,
        industryInterests: interests,
        collaborations,
        outcomes,
      },
    });
  } catch (error) {
    console.error('GET government challenge detail error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
