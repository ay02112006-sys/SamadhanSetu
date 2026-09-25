// src/app/api/university/projects/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getProjectActivitiesCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { notifyProjectStatusChanged, notifyGovernmentProjectCompleted, getGovernmentUserIds } from '@/lib/notifications';
import { z } from 'zod';
import { ProjectStatus } from '@/types/project';
import { ActivityType } from '@/types/project-activity';
import { ObjectId } from 'mongodb';

const updateStatusSchema = z.object({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'UNDER_REVIEW', 'TESTING', 'COMPLETED', 'CANCELLED']),
});

const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  PLANNING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'UNDER_REVIEW', 'TESTING', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  UNDER_REVIEW: ['IN_PROGRESS', 'CANCELLED'],
  TESTING: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(
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

    const body = await request.json();
    const parseResult = updateStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const { status: newStatus } = parseResult.data;
    const projectId = params.id;

    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId, universityId: user.id });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    if (project.status === newStatus) {
      return NextResponse.json({ success: true, message: 'Status is already set to ' + newStatus });
    }

    const allowedNextStatuses = VALID_TRANSITIONS[project.status];
    if (!allowedNextStatuses.includes(newStatus as ProjectStatus)) {
      return NextResponse.json({ success: false, error: `Invalid transition from ${project.status} to ${newStatus}` }, { status: 400 });
    }

    const updateResult = await projectsColl.updateOne(
      { projectId },
      { $set: { status: newStatus as ProjectStatus, updatedAt: new Date() } }
    );

    if (updateResult.modifiedCount > 0) {
      const activitiesColl = await getProjectActivitiesCollection();
      await activitiesColl.insertOne({
        activityId: `ACT-${new ObjectId().toHexString()}`,
        projectId,
        type: 'STATUS_CHANGED' as ActivityType,
        message: `Project status changed from ${project.status} to ${newStatus}.`,
        actorName: user.name || 'University User',
        createdAt: new Date()
      });

      // Phase 9: Notifications
      await notifyProjectStatusChanged(user.id, 'UNIVERSITY', projectId, project.title, newStatus);
      const challengeColl = await getChallengeCollection();
      const challenge = await challengeColl.findOne({ challengeId: project.challengeId });
      if (challenge?.submittedBy) {
        await notifyProjectStatusChanged(challenge.submittedBy, 'CITIZEN', projectId, project.title, newStatus);
      }
      if (newStatus === 'COMPLETED') {
        const govUserIds = await getGovernmentUserIds();
        await notifyGovernmentProjectCompleted(govUserIds, projectId, project.title);
      }
    }

    return NextResponse.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
