// src/app/api/industry/collaborations/[id]/activities/[activityId]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryCollaborationCollection,
  getCollaborationActivityCollection,
} from '@/lib/industry';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';
import { CollaborationActivityStatus } from '@/types/industry-collaboration';

const updateSchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

async function verifyAccess(collaborationId: string, userId: string, role: string) {
  const collabColl = await getIndustryCollaborationCollection();
  if (role === 'INDUSTRY') return collabColl.findOne({ collaborationId, industryId: userId });
  if (role === 'UNIVERSITY') return collabColl.findOne({ collaborationId, universityId: userId });
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (!user.id || !['INDUSTRY', 'UNIVERSITY'].includes(user.role ?? '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const collab = await verifyAccess(params.id, user.id, user.role ?? '');
    if (!collab) {
      return NextResponse.json({ success: false, error: 'Collaboration not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });
    }

    const { status: newStatus } = parsed.data;
    const actColl = await getCollaborationActivityCollection();

    const activity = await actColl.findOne({ activityId: params.activityId, collaborationId: params.id });
    if (!activity) {
      return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 });
    }

    const updateDoc: { $set: { status: CollaborationActivityStatus; completedAt?: Date } } = {
      $set: { status: newStatus as CollaborationActivityStatus },
    };
    if (newStatus === 'COMPLETED') {
      updateDoc.$set.completedAt = new Date();
    }

    await actColl.updateOne({ activityId: params.activityId }, updateDoc);

    // Phase 9: Notification on COMPLETED
    if (newStatus === 'COMPLETED') {
      const partnerRole = user.role === 'INDUSTRY' ? 'UNIVERSITY' : 'INDUSTRY';
      const partnerId = user.role === 'INDUSTRY' ? collab.universityId : collab.industryId;
      
      await createNotification({
        recipientId: partnerId,
        recipientRole: partnerRole,
        type: 'SUPPORT_ACTIVITY_COMPLETED',
        title: 'Support Activity Completed',
        message: `A support activity "${activity.title || 'Activity'}" in your collaboration has been completed.`,
        entityType: 'COLLABORATION',
        entityId: collab.collaborationId,
        actionUrl: partnerRole === 'UNIVERSITY' 
          ? `/dashboard/university/collaborations/${collab.collaborationId}`
          : `/dashboard/industry/collaborations/${collab.collaborationId}`,
        eventKey: `activity-completed:${params.activityId}`,
      });
    }

    return NextResponse.json({ success: true, message: 'Activity updated' });
  } catch (error) {
    console.error('PATCH activity error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
