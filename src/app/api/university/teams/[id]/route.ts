// src/app/api/university/teams/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getUniversityTeamCollection } from '@/lib/university';

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

    const teamColl = await getUniversityTeamCollection();
    const team = await teamColl.findOne({ teamId: params.id, universityId: user.id });

    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found or not owned by you' }, { status: 404 });
    }

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
