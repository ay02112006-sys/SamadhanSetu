// src/app/api/university/projects/[id]/tasks/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getProjectTasksCollection, getProjectActivitiesCollection } from '@/lib/project';
import { z } from 'zod';
import { TaskStatus } from '@/types/project-task';
import { ActivityType } from '@/types/project-activity';
import { ObjectId } from 'mongodb';

const updateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
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

    const { id: projectId, taskId } = params;

    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId, universityId: user.id });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = updateTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const { status: newStatus } = parseResult.data;
    const tasksColl = await getProjectTasksCollection();
    
    const task = await tasksColl.findOne({ taskId, projectId });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (task.status === newStatus) {
      return NextResponse.json({ success: true, message: 'Status already ' + newStatus });
    }

    await tasksColl.updateOne(
      { taskId },
      { $set: { status: newStatus as TaskStatus, updatedAt: new Date() } }
    );

    if (newStatus === 'COMPLETED') {
      const activitiesColl = await getProjectActivitiesCollection();
      await activitiesColl.insertOne({
        activityId: `ACT-${new ObjectId().toHexString()}`,
        projectId,
        type: 'TASK_COMPLETED' as ActivityType,
        message: `Task "${task.title}" was completed by ${user.name || 'a member'}.`,
        actorName: user.name || 'University User',
        createdAt: new Date()
      });
    }

    return NextResponse.json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
