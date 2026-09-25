// src/app/api/challenges/[id]/match-universities/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getChallengeCollection } from '@/lib/challenge';
import { getUniversityMatchCollection, getUsersCollection } from '@/lib/university';
import { calculateUniversityMatch } from '@/lib/university-matching';
import { MatchStatus, UniversityMatch } from '@/types/university-match';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string };
    const role = user.role;
    const userId = user.id;

    if (!userId || role !== 'CITIZEN') {
      return NextResponse.json({ success: false, error: 'Forbidden. Only citizens can trigger matching.' }, { status: 403 });
    }

    const challengeId = params.id;
    const challengeColl = await getChallengeCollection();
    const challenge = await challengeColl.findOne({ challengeId });

    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.submittedBy !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden. You do not own this challenge.' }, { status: 403 });
    }

    if (!challenge.aiAnalysis || challenge.aiAnalysis.status !== 'COMPLETED' && challenge.aiAnalysis.status !== 'FALLBACK') {
      return NextResponse.json({ success: false, error: 'AI analysis is required before university matching.' }, { status: 400 });
    }

    const usersColl = await getUsersCollection();
    // Only universities with a profile
    const universities = await usersColl.find({ role: 'UNIVERSITY', universityProfile: { $exists: true } }).toArray();

    if (universities.length === 0) {
      return NextResponse.json({ success: true, matches: [], message: 'No university profiles found.' }, { status: 200 });
    }

    const matchColl = await getUniversityMatchCollection();
    const now = new Date();
    const matchesToUpsert: UniversityMatch[] = [];

    for (const uni of universities) {
      try {
        const matchData = calculateUniversityMatch(challenge, challenge.aiAnalysis, uni);
        
        matchesToUpsert.push({
          ...matchData,
          status: 'SUGGESTED' as MatchStatus,
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        console.error(`Failed to calculate match for uni ${uni._id}:`, err);
      }
    }

    if (matchesToUpsert.length > 0) {
      // Upsert all matches
      const bulkOps = matchesToUpsert.map(match => ({
        updateOne: {
          filter: { challengeId: match.challengeId, universityId: match.universityId },
          update: { 
            $set: { 
              score: match.score,
              reasons: match.reasons,
              matchedDomains: match.matchedDomains,
              matchedResearchAreas: match.matchedResearchAreas,
              matchedExpertise: match.matchedExpertise,
              locationRelevance: match.locationRelevance,
              confidence: match.confidence,
              updatedAt: now
            },
            $setOnInsert: {
              status: match.status,
              createdAt: match.createdAt
            }
          },
          upsert: true
        }
      }));

      await matchColl.bulkWrite(bulkOps);
    }

    // Retrieve the updated matches sorted by score
    const finalMatches = await matchColl.find({ challengeId }).sort({ score: -1 }).toArray();

    return NextResponse.json({ success: true, matches: finalMatches });
  } catch (error: any) {
    console.error('Match error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
