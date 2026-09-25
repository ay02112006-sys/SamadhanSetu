// src/app/api/government/projects/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getMilestonesCollection, getProjectDeliverablesCollection, getProjectReviewsCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { getUsersCollection } from '@/lib/university';
import { getIndustryCollaborationCollection, getIndustryProfileCollection, getFundingCommitmentCollection } from '@/lib/industry';
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

    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId: params.id });
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    const [
      challenge,
      universityUser,
      milestones,
      deliverables,
      reviews,
      collaborations,
      outcomes,
    ] = await Promise.all([
      (await getChallengeCollection()).findOne({ challengeId: project.challengeId }),
      (await getUsersCollection()).findOne(
        { role: 'UNIVERSITY' },
        { projection: { _id: 1, name: 1, 'universityProfile': 1 } }
      ),
      (await getMilestonesCollection()).find({ projectId: params.id }).sort({ order: 1 }).toArray(),
      (await getProjectDeliverablesCollection()).find({ projectId: params.id }).toArray(),
      (await getProjectReviewsCollection()).find({ projectId: params.id }).toArray(),
      (await getIndustryCollaborationCollection()).find({ projectId: params.id }).toArray(),
      (await getProjectOutcomeCollection()).find({ projectId: params.id }).toArray(),
    ]);

    // Enrich collaborations with industry names (no private info)
    const industryIds = collaborations.map((c) => c.industryId);
    const profiles = await (await getIndustryProfileCollection()).find({ userId: { $in: industryIds } }).toArray();
    const profileMap = new Map(profiles.map((p) => [p.userId, p.organizationName]));

    // Funding totals
    const collabIds = collaborations.map((c) => c.collaborationId);
    const fundingRecords = collabIds.length > 0
      ? await (await getFundingCommitmentCollection()).find({ collaborationId: { $in: collabIds } }).toArray()
      : [];

    return NextResponse.json({
      success: true,
      data: {
        project: {
          projectId: project.projectId,
          title: project.title,
          description: project.description,
          status: project.status,
          progress: project.progress,
          targetDate: project.targetDate,
          startDate: project.startDate,
          mentor: { name: project.mentor.name, department: project.mentor.department }, // no email
          memberCount: project.members.length,
        },
        challenge: challenge ? {
          challengeId: challenge.challengeId,
          title: challenge.title,
          description: challenge.description,
          domain: challenge.domain,
          priority: challenge.priority,
          status: challenge.status,
          location: challenge.location,
          aiAnalysis: challenge.aiAnalysis ? {
            suggestedDomain: challenge.aiAnalysis.suggestedDomain,
            suggestedPriority: challenge.aiAnalysis.suggestedPriority,
            impactLevel: challenge.aiAnalysis.impactLevel,
            urgencyLevel: challenge.aiAnalysis.urgencyLevel,
            problemSummary: challenge.aiAnalysis.problemSummary,
            duplicateCandidates: challenge.aiAnalysis.duplicateCandidates,
            confidence: challenge.aiAnalysis.domainConfidence,
            status: challenge.aiAnalysis.status,
          } : null,
        } : null,
        university: universityUser ? {
          name: universityUser.universityProfile?.universityName ?? universityUser.name,
          city: universityUser.universityProfile?.city,
          state: universityUser.universityProfile?.state,
        } : null,
        milestones: milestones.map((m) => ({
          milestoneId: m.milestoneId,
          title: m.title,
          status: m.status,
          dueDate: m.dueDate,
        })),
        deliverables: deliverables.map((d) => ({
          deliverableId: d.deliverableId,
          title: d.title,
          type: d.type,
          status: d.status,
        })),
        reviews: reviews.map((r) => ({
          reviewId: r.reviewId,
          status: r.status,
          createdAt: r.createdAt,
        })),
        collaborations: collaborations.map((c) => ({
          collaborationId: c.collaborationId,
          status: c.status,
          supportTypes: c.supportTypes,
          industryName: profileMap.get(c.industryId) ?? 'Industry Partner',
        })),
        fundingCommitments: fundingRecords.map((f) => ({
          fundingId: f.fundingId,
          amount: f.amount,
          currency: f.currency,
          status: f.status,
        })),
        outcomes,
      },
    });
  } catch (error) {
    console.error('GET government project detail error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
