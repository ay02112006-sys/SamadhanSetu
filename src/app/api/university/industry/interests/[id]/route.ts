// src/app/api/university/industry/interests/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import {
  getIndustryInterestCollection,
  getIndustryCollaborationCollection,
} from '@/lib/industry';
import { getProjectsCollection } from '@/lib/project';
import { notifyIndustryInterestDecision, notifyCollaborationCreated } from '@/lib/notifications';
import { z } from 'zod';
import { InterestStatus } from '@/types/industry-interest';
import { IndustryCollaboration, CollaborationStatus } from '@/types/industry-collaboration';
import { ObjectId } from 'mongodb';

const reviewSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });
    }

    const { status: newStatus } = parsed.data;
    const interestColl = await getIndustryInterestCollection();
    const interest = await interestColl.findOne({ interestId: params.id });

    if (!interest) {
      return NextResponse.json({ success: false, error: 'Interest not found' }, { status: 404 });
    }

    // IDOR: verify university owns the project the interest is for
    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({
      projectId: interest.projectId,
      universityId: user.id,
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Access denied — this project does not belong to your university' },
        { status: 403 }
      );
    }

    if (interest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Cannot review interest with status: ${interest.status}` },
        { status: 400 }
      );
    }

    const now = new Date();
    await interestColl.updateOne(
      { interestId: params.id },
      {
        $set: {
          status: newStatus as InterestStatus,
          reviewedAt: now,
          reviewedBy: user.id,
          updatedAt: now,
        },
      }
    );

    // When ACCEPTED, create a collaboration record (idempotent)
    if (newStatus === 'ACCEPTED') {
      const collabColl = await getIndustryCollaborationCollection();
      const existing = await collabColl.findOne({
        projectId: interest.projectId,
        industryId: interest.industryId,
      });

      if (!existing) {
        const collaborationId = `COL-${new ObjectId().toHexString().substring(0, 10).toUpperCase()}`;
        const collaboration: IndustryCollaboration = {
          collaborationId,
          projectId: interest.projectId,
          universityId: interest.universityId,
          industryId: interest.industryId,
          interestId: interest.interestId,
          status: 'INITIATED' as CollaborationStatus,
          supportTypes: interest.supportTypes,
          scope: interest.proposedContribution,
          objectives: interest.proposedContribution,
          startDate: now,
          createdAt: now,
          updatedAt: now,
        };

        await collabColl.insertOne(collaboration);

        // Phase 9: Notify collaboration created
        await notifyCollaborationCreated(interest.universityId, 'UNIVERSITY', collaborationId, 'an Industry Partner');
        await notifyCollaborationCreated(interest.industryId, 'INDUSTRY', collaborationId, 'a University Partner');
      }
    }

    // Phase 9: Notify industry of decision
    await notifyIndustryInterestDecision(interest.industryId, interest.interestId, newStatus === 'ACCEPTED', project.title);

    return NextResponse.json({ success: true, message: `Interest ${newStatus.toLowerCase()} successfully` });
  } catch (error) {
    console.error('PATCH /api/university/industry/interests/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
