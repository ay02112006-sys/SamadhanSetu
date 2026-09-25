// src/app/api/university/projects/[id]/tasks/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getProjectTasksCollection, getProjectActivitiesCollection } from '@/lib/project';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { ProjectTask, TaskStatus, TaskPriority } from '@/types/project-task';
import { ActivityType } from '@/types/project-activity';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  assignedTo: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  milestoneId: z.string().optional(),
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
    const parseResult = createTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const data = parseResult.data;
    const tasksColl = await getProjectTasksCollection();
    const taskId = `TSK-${new ObjectId().toHexString().substring(0, 8).toUpperCase()}`;

    const newTask: ProjectTask = {
      taskId,
      projectId,
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo,
      status: 'TODO',
      priority: data.priority as TaskPriority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      milestoneId: data.milestoneId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tasksColl.insertOne(newTask);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
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

    const tasksColl = await getProjectTasksCollection();
    const tasks = await tasksColl.find({ projectId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
