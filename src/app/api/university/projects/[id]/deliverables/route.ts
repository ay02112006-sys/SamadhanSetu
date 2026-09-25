// src/app/api/university/projects/[id]/deliverables/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getProjectDeliverablesCollection, getProjectActivitiesCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { Deliverable, DeliverableType, DeliverableStatus } from '@/types/deliverable';
import { ActivityType } from '@/types/project-activity';

const createDeliverableSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['DOCUMENT', 'PROTOTYPE', 'REPORT', 'PRESENTATION', 'DEMO', 'OTHER']),
  url: z.string().url(),
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
    const parseResult = createDeliverableSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const data = parseResult.data;
    const deliverablesColl = await getProjectDeliverablesCollection();
    const deliverableId = `DEL-${new ObjectId().toHexString().substring(0, 8).toUpperCase()}`;

    const newDeliverable: Deliverable = {
      deliverableId,
      projectId,
      title: data.title,
      description: data.description,
      type: data.type as DeliverableType,
      url: data.url,
      status: 'SUBMITTED' as DeliverableStatus,
      submittedBy: user.name || 'University User',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await deliverablesColl.insertOne(newDeliverable);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create deliverable' }, { status: 500 });
    }

    const activitiesColl = await getProjectActivitiesCollection();
    await activitiesColl.insertOne({
      activityId: `ACT-${new ObjectId().toHexString()}`,
      projectId,
      type: 'DELIVERABLE_SUBMITTED' as ActivityType,
      message: `Deliverable "${data.title}" was submitted.`,
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
        type: 'DELIVERABLE_SUBMITTED',
        title: 'Deliverable Submitted',
        message: `New deliverable "${data.title}" submitted for project "${project.title}".`,
        entityType: 'PROJECT',
        entityId: projectId,
        actionUrl: `/challenges/${project.challengeId}`,
        eventKey: `deliverable-submitted:${deliverableId}`,
      });
    }

    return NextResponse.json({ success: true, deliverable: newDeliverable }, { status: 201 });
  } catch (error) {
    console.error('Create deliverable error:', error);
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

    const deliverablesColl = await getProjectDeliverablesCollection();
    const deliverables = await deliverablesColl.find({ projectId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, deliverables });
  } catch (error) {
    console.error('Get deliverables error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
