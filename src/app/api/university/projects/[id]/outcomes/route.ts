// src/app/api/university/projects/[id]/outcomes/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection } from '@/lib/project';
import { getProjectOutcomeCollection } from '@/lib/outcome';
import { getChallengeCollection } from '@/lib/challenge';
import { createNotification, getGovernmentUserIds, createNotifications } from '@/lib/notifications';
import { z } from 'zod';
import { ProjectOutcome, OutcomeType } from '@/types/project-outcome';
import { ObjectId } from 'mongodb';

const outcomeSchema = z.object({
  outcomeType: z.enum([
    'PEOPLE_REACHED', 'TIME_SAVED', 'COST_SAVED', 'SERVICE_ACCESS',
    'WATER_SAVED', 'ENERGY_SAVED', 'FARMERS_SUPPORTED', 'STUDENTS_SUPPORTED',
    'HEALTHCARE_ACCESS', 'JOBS_SUPPORTED', 'PILOTS_COMPLETED', 'OTHER',
  ]),
  metricName: z.string().min(1),
  baselineValue: z.number().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Verify project ownership
    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId: params.id, universityId: user.id });
    if (!project) return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });

    const body = await request.json();
    const parsed = outcomeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });

    const now = new Date();
    const outcome: ProjectOutcome = {
      outcomeId: `OUT-${new ObjectId().toHexString().substring(0, 10).toUpperCase()}`,
      projectId: params.id,
      outcomeType: parsed.data.outcomeType as OutcomeType,
      metricName: parsed.data.metricName,
      baselineValue: parsed.data.baselineValue,
      targetValue: parsed.data.targetValue,
      currentValue: parsed.data.currentValue,
      unit: parsed.data.unit,
      description: parsed.data.description,
      verified: false,
      createdAt: now,
      updatedAt: now,
    };

    const coll = await getProjectOutcomeCollection();
    await coll.insertOne(outcome);

    // Phase 9: Notification to citizen and government
    const challengeColl = await getChallengeCollection();
    const challenge = await challengeColl.findOne({ challengeId: project.challengeId });
    if (challenge?.submittedBy) {
      await createNotification({
        recipientId: challenge.submittedBy,
        recipientRole: 'CITIZEN',
        type: 'PROJECT_OUTCOME_UPDATED',
        title: 'Project Outcome Added',
        message: `A new outcome "${outcome.metricName}" was recorded for project "${project.title}".`,
        entityType: 'PROJECT',
        entityId: project.projectId,
        actionUrl: `/challenges/${project.challengeId}`,
        eventKey: `outcome-created:${outcome.outcomeId}`,
      });
    }

    const govUserIds = await getGovernmentUserIds();
    await createNotifications(govUserIds.map((govId) => ({
      recipientId: govId,
      recipientRole: 'GOVERNMENT',
      type: 'PROJECT_OUTCOME_UPDATED',
      title: 'New Project Outcome',
      message: `Project "${project.title}" reported a new outcome: ${outcome.metricName}.`,
      entityType: 'PROJECT',
      entityId: project.projectId,
      actionUrl: `/dashboard/government/projects/${project.projectId}`,
      eventKey: `gov-outcome-created:${outcome.outcomeId}:${govId}`,
    })));

    return NextResponse.json({ success: true, outcome }, { status: 201 });
  } catch (error) {
    console.error('POST outcomes error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const user = session.user as { id?: string; role?: string };

    // University must own project; Government can view all
    if (user.role === 'UNIVERSITY') {
      const projectsColl = await getProjectsCollection();
      const project = await projectsColl.findOne({ projectId: params.id, universityId: user.id });
      if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    } else if (user.role !== 'GOVERNMENT') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const coll = await getProjectOutcomeCollection();
    const outcomes = await coll.find({ projectId: params.id }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, outcomes });
  } catch (error) {
    console.error('GET outcomes error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
