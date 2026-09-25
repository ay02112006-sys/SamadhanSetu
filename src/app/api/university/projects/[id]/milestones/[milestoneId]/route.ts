// src/app/api/university/projects/[id]/milestones/[milestoneId]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getMilestonesCollection, getProjectActivitiesCollection } from '@/lib/project';
import { getChallengeCollection } from '@/lib/challenge';
import { notifyMilestoneCompleted } from '@/lib/notifications';
import { z } from 'zod';
import { Milestone, MilestoneStatus } from '@/types/milestone';
import { ActivityType } from '@/types/project-activity';
import { ObjectId } from 'mongodb';

const updateMilestoneSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; milestoneId: string } }
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

    const { id: projectId, milestoneId } = params;

    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId, universityId: user.id });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = updateMilestoneSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const { status: newStatus } = parseResult.data;
    const milestonesColl = await getMilestonesCollection();
    
    const milestone = await milestonesColl.findOne({ milestoneId, projectId });
    if (!milestone) {
      return NextResponse.json({ success: false, error: 'Milestone not found' }, { status: 404 });
    }

    if (milestone.status === newStatus) {
      return NextResponse.json({ success: true, message: 'Status already ' + newStatus });
    }

    const updateDoc: { $set: Partial<Milestone>; $unset?: Record<string, 1 | ""> } = {
      $set: {
        status: newStatus as MilestoneStatus,
        updatedAt: new Date(),
      }
    };

    if (newStatus === 'COMPLETED' && milestone.status !== 'COMPLETED') {
      updateDoc.$set.completedAt = new Date();
    } else if (newStatus !== 'COMPLETED') {
      updateDoc.$unset = { completedAt: "" };
    }

    await milestonesColl.updateOne({ milestoneId }, updateDoc);

    // Calculate overall project progress
    const allMilestones = await milestonesColl.find({ projectId }).toArray();
    if (allMilestones.length > 0) {
      // Re-fetch since we just updated one (could also just compute it in memory)
      const completedCount = allMilestones.filter(m => (m.milestoneId === milestoneId ? newStatus === 'COMPLETED' : m.status === 'COMPLETED')).length;
      const progress = Math.round((completedCount / allMilestones.length) * 100);
      await projectsColl.updateOne({ projectId }, { $set: { progress } });
    }

    if (newStatus === 'COMPLETED') {
      const activitiesColl = await getProjectActivitiesCollection();
      await activitiesColl.insertOne({
        activityId: `ACT-${new ObjectId().toHexString()}`,
        projectId,
        type: 'MILESTONE_COMPLETED' as ActivityType,
        message: `Milestone "${milestone.title}" marked as COMPLETED.`,
        actorName: user.name || 'University User',
        createdAt: new Date()
      });

      // Phase 9: Notifications
      await notifyMilestoneCompleted(user.id, 'UNIVERSITY', projectId, milestone.title, milestoneId);
      const challengeColl = await getChallengeCollection();
      const challenge = await challengeColl.findOne({ challengeId: project.challengeId });
      if (challenge?.submittedBy) {
        await notifyMilestoneCompleted(challenge.submittedBy, 'CITIZEN', projectId, milestone.title, milestoneId);
      }
    }

    return NextResponse.json({ success: true, message: 'Milestone updated successfully' });
  } catch (error) {
    console.error('Update milestone error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
