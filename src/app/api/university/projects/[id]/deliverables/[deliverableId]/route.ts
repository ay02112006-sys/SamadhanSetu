// src/app/api/university/projects/[id]/deliverables/[deliverableId]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getProjectDeliverablesCollection } from '@/lib/project';
import { z } from 'zod';
import { DeliverableStatus } from '@/types/deliverable';

const updateDeliverableSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; deliverableId: string } }
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

    const { id: projectId, deliverableId } = params;

    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId, universityId: user.id });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = updateDeliverableSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const { status: newStatus } = parseResult.data;
    const deliverablesColl = await getProjectDeliverablesCollection();
    
    const deliverable = await deliverablesColl.findOne({ deliverableId, projectId });
    if (!deliverable) {
      return NextResponse.json({ success: false, error: 'Deliverable not found' }, { status: 404 });
    }

    if (deliverable.status === newStatus) {
      return NextResponse.json({ success: true, message: 'Status already ' + newStatus });
    }

    const updateDoc = {
      $set: {
        status: newStatus as DeliverableStatus,
        updatedAt: new Date(),
        ...(newStatus === 'APPROVED' ? { reviewedAt: new Date() } : {})
      }
    };

    await deliverablesColl.updateOne({ deliverableId }, updateDoc);

    return NextResponse.json({ success: true, message: 'Deliverable updated successfully' });
  } catch (error) {
    console.error('Update deliverable error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
