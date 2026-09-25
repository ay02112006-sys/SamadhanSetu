// src/app/api/university/projects/[id]/milestones/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getMilestonesCollection, getProjectActivitiesCollection } from '@/lib/project';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { Milestone, MilestoneStatus } from '@/types/milestone';
import { ActivityType } from '@/types/project-activity';

const createMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string().min(1),
  order: z.number().int().min(1),
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
    const parseResult = createMilestoneSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const data = parseResult.data;
    const milestonesColl = await getMilestonesCollection();
    const milestoneId = `MS-${new ObjectId().toHexString().substring(0, 8).toUpperCase()}`;

    const newMilestone: Milestone = {
      milestoneId,
      projectId,
      title: data.title,
      description: data.description,
      status: 'PENDING' as MilestoneStatus,
      dueDate: new Date(data.dueDate),
      order: data.order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await milestonesColl.insertOne(newMilestone);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create milestone' }, { status: 500 });
    }

    // Recalculate progress or log activity
    const activitiesColl = await getProjectActivitiesCollection();
    await activitiesColl.insertOne({
      activityId: `ACT-${new ObjectId().toHexString()}`,
      projectId,
      type: 'MILESTONE_CREATED' as ActivityType,
      message: `Milestone "${data.title}" was created.`,
      actorName: user.name || 'University User',
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, milestone: newMilestone }, { status: 201 });
  } catch (error) {
    console.error('Create milestone error:', error);
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

    const milestonesColl = await getMilestonesCollection();
    const milestones = await milestonesColl.find({ projectId }).sort({ order: 1 }).toArray();

    return NextResponse.json({ success: true, milestones });
  } catch (error) {
    console.error('Get milestones error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
