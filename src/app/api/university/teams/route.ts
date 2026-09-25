// src/app/api/university/teams/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getUniversityTeamCollection, getUniversityMatchCollection } from '@/lib/university';
import { getChallengeCollection } from '@/lib/challenge';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';
import { TeamMember, UniversityTeam } from '@/types/university-team';
import { ObjectId } from 'mongodb';

const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  department: z.string().min(1),
  skills: z.array(z.string()),
});

const createTeamSchema = z.object({
  challengeId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(10),
  mentor: z.string().min(1),
  members: z.array(teamMemberSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createTeamSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const teamData = parseResult.data;
    const { challengeId } = teamData;
    const universityId = user.id;

    const challengeColl = await getChallengeCollection();
    const challenge = await challengeColl.findOne({ challengeId });
    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
    }

    const matchColl = await getUniversityMatchCollection();
    const match = await matchColl.findOne({ challengeId, universityId });

    if (!match || match.status !== 'ACCEPTED') {
      return NextResponse.json({ success: false, error: 'You must ACCEPT the match before forming a team.' }, { status: 403 });
    }

    const teamColl = await getUniversityTeamCollection();
    const existingTeam = await teamColl.findOne({ challengeId, universityId });
    if (existingTeam) {
      return NextResponse.json({ success: false, error: 'Team already exists for this challenge' }, { status: 409 });
    }

    const newTeam: UniversityTeam = {
      teamId: `TEAM-${new ObjectId().toHexString()}`,
      challengeId,
      universityId,
      name: teamData.name,
      description: teamData.description,
      mentor: teamData.mentor,
      members: teamData.members as TeamMember[],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await teamColl.insertOne(newTeam);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create team' }, { status: 500 });
    }

    // Phase 9: Notification
    if (challenge.submittedBy) {
      await createNotification({
        recipientId: challenge.submittedBy,
        recipientRole: 'CITIZEN',
        type: 'TEAM_CREATED',
        title: 'University Team Formed',
        message: `A university team "${newTeam.name}" has been formed for your challenge.`,
        entityType: 'TEAM',
        entityId: newTeam.teamId,
        actionUrl: `/challenges/${challengeId}`,
        eventKey: `team-created:${newTeam.teamId}`,
      });
    }

    return NextResponse.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
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
    const teams = await teamColl.find({ universityId: user.id }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
