// src/app/api/challenges/[id]/matches/[universityId]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getUniversityMatchCollection, getUsersCollection } from '@/lib/university';
import { getChallengeCollection } from '@/lib/challenge';
import { notifyUniversityMatchAccepted, notifyUniversityMatchDeclined } from '@/lib/notifications';
import { MatchStatus } from '@/types/university-match';
import { z } from 'zod';

const updateMatchSchema = z.object({
  status: z.enum(['SHORTLISTED', 'ACCEPTED', 'DECLINED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; universityId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY') {
      return NextResponse.json({ success: false, error: 'Forbidden. Only university can update match status.' }, { status: 403 });
    }

    const { id: challengeId, universityId } = params;

    if (user.id !== universityId) {
      return NextResponse.json({ success: false, error: 'Forbidden. You can only update your own matches.' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = updateMatchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const { status } = parseResult.data;
    const matchColl = await getUniversityMatchCollection();

    const result = await matchColl.updateOne(
      { challengeId, universityId },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    // Phase 9: Notifications
    if (status === 'ACCEPTED' || status === 'DECLINED') {
      const challengeColl = await getChallengeCollection();
      const challenge = await challengeColl.findOne({ challengeId });
      
      const userColl = await getUsersCollection();
      const universityUser = await userColl.findOne({ _id: new (require('mongodb').ObjectId)(universityId) });
      const uniName = universityUser?.name || 'A University';

      if (challenge?.submittedBy) {
        if (status === 'ACCEPTED') {
          await notifyUniversityMatchAccepted(challenge.submittedBy, challengeId, challenge.title, uniName);
        } else if (status === 'DECLINED') {
          await notifyUniversityMatchDeclined(challenge.submittedBy, challengeId, challenge.title, uniName);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Match status updated' });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
