// src/app/api/challenges/[id]/matches/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { getUniversityMatchCollection } from '@/lib/university';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Safely cast user
    const user = session.user as { id?: string; role?: string };
    const userId = user.id;
    const role = user.role;

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const challengeId = params.id;
    const matchColl = await getUniversityMatchCollection();

    if (role === 'CITIZEN') {
      const challengeColl = await getChallengeCollection();
      const challenge = await challengeColl.findOne({ challengeId });
      
      if (!challenge) {
        return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
      }

      if (challenge.submittedBy !== userId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const matches = await matchColl.find({ challengeId }).sort({ score: -1 }).toArray();
      return NextResponse.json({ success: true, matches });

    } else if (role === 'UNIVERSITY') {
      // University can only view its own match for this challenge
      const match = await matchColl.findOne({ challengeId, universityId: userId });
      if (!match) {
        return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, matches: [match] });

    } else {
      return NextResponse.json({ success: false, error: 'Forbidden role' }, { status: 403 });
    }

  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
