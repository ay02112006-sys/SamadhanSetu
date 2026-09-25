// src/app/api/industry/collaborations/[id]/activities/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryCollaborationCollection,
  getCollaborationActivityCollection,
} from '@/lib/industry';
import { z } from 'zod';
import { CollaborationActivity, CollaborationActivityType, CollaborationActivityStatus } from '@/types/industry-collaboration';
import { ObjectId } from 'mongodb';

const activitySchema = z.object({
  type: z.enum([
    'MENTORSHIP_SESSION', 'FUNDING_COMMITMENT', 'PROTOTYPE_SUPPORT',
    'TESTING_SUPPORT', 'TECHNOLOGY_SUPPORT', 'PILOT_SUPPORT',
    'IMPLEMENTATION_SUPPORT', 'OTHER',
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
});

async function verifyCollaborationAccess(collaborationId: string, userId: string, role: string) {
  const collabColl = await getIndustryCollaborationCollection();
  if (role === 'INDUSTRY') {
    return collabColl.findOne({ collaborationId, industryId: userId });
  } else if (role === 'UNIVERSITY') {
    return collabColl.findOne({ collaborationId, universityId: userId });
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string; name?: string };
    if (!user.id || !['INDUSTRY', 'UNIVERSITY'].includes(user.role ?? '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const collab = await verifyCollaborationAccess(params.id, user.id, user.role ?? '');
    if (!collab) {
      return NextResponse.json({ success: false, error: 'Collaboration not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = activitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });
    }

    const data = parsed.data;
    const activityId = `ACT-${new ObjectId().toHexString().substring(0, 10).toUpperCase()}`;
    const now = new Date();

    const activity: CollaborationActivity = {
      activityId,
      collaborationId: params.id,
      type: data.type as CollaborationActivityType,
      title: data.title,
      description: data.description,
      status: 'PLANNED' as CollaborationActivityStatus,
      actorName: user.name ?? 'Participant',
      createdAt: now,
    };

    const actColl = await getCollaborationActivityCollection();
    const result = await actColl.insertOne(activity);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create activity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error) {
    console.error('POST /api/industry/collaborations/[id]/activities error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
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

    const collab = await verifyCollaborationAccess(params.id, user.id, user.role ?? '');
    if (!collab) {
      return NextResponse.json({ success: false, error: 'Collaboration not found or access denied' }, { status: 404 });
    }

    const actColl = await getCollaborationActivityCollection();
    const activities = await actColl
      .find({ collaborationId: params.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('GET /api/industry/collaborations/[id]/activities error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
