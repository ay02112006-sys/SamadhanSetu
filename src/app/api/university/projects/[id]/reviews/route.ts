// src/app/api/university/projects/[id]/reviews/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getProjectReviewsCollection, getProjectActivitiesCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { ProjectReview, ReviewStatus } from '@/types/project-review';
import { ActivityType } from '@/types/project-activity';

const createReviewSchema = z.object({
  comments: z.string().min(1),
  status: z.enum(['PENDING', 'APPROVED', 'CHANGES_REQUESTED']),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string; name?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const projectId = params.id;
    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId, universityId: user.id });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = createReviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const data = parseResult.data;
    const reviewsColl = await getProjectReviewsCollection();
    const reviewId = `REV-${new ObjectId().toHexString().substring(0, 8).toUpperCase()}`;

    const newReview: ProjectReview = {
      reviewId,
      projectId,
      reviewerName: user.name || 'University Faculty/Mentor',
      reviewerRole: 'MENTOR',
      status: data.status as ReviewStatus,
      comments: data.comments,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await reviewsColl.insertOne(newReview);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create review' }, { status: 500 });
    }

    const activitiesColl = await getProjectActivitiesCollection();
    await activitiesColl.insertOne({
      activityId: `ACT-${new ObjectId().toHexString()}`,
      projectId,
      type: 'REVIEW_SUBMITTED' as ActivityType,
      message: `Review submitted with status ${data.status}.`,
      actorName: user.name || 'University User',
      createdAt: new Date()
    });

    // Phase 9: Notification to citizen
    const challengeColl = await getChallengeCollection();
    const challenge = await challengeColl.findOne({ challengeId: project.challengeId });
    if (challenge?.submittedBy) {
      await createNotification({
        recipientId: challenge.submittedBy,
        recipientRole: 'CITIZEN',
        type: 'PROJECT_REVIEW_SUBMITTED',
        title: 'Project Review Submitted',
        message: `A review with status ${data.status} was submitted for project "${project.title}".`,
        entityType: 'PROJECT',
        entityId: projectId,
        actionUrl: `/challenges/${project.challengeId}`,
        eventKey: `review-submitted:${reviewId}`,
      });
    }

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const projectId = params.id;
    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId, universityId: user.id });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    const reviewsColl = await getProjectReviewsCollection();
    const reviews = await reviewsColl.find({ projectId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
