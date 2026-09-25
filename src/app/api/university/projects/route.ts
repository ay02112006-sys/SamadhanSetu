// src/app/api/university/projects/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection, getProjectActivitiesCollection } from '@/lib/project';
import { getUniversityTeamCollection, getUniversityMatchCollection } from '@/lib/university';
import { getChallengeCollection } from '@/lib/challenge';
import { notifyProjectCreated } from '@/lib/notifications';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { Project, ProjectStatus } from '@/types/project';
import { ActivityType } from '@/types/project-activity';

const createProjectSchema = z.object({
  challengeId: z.string().min(1),
  teamId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(10),
  targetDate: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string; name?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.errors }, { status: 422 });
    }

    const data = parseResult.data;
    const universityId = user.id;

    // Verify team
    const teamColl = await getUniversityTeamCollection();
    const team = await teamColl.findOne({ teamId: data.teamId, universityId });
    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found or not owned by you' }, { status: 404 });
    }
    
    // Verify team matches challenge
    if (team.challengeId !== data.challengeId) {
      return NextResponse.json({ success: false, error: 'Team does not belong to this challenge' }, { status: 400 });
    }

    // Verify challenge
    const challengeColl = await getChallengeCollection();
    const challenge = await challengeColl.findOne({ challengeId: data.challengeId });
    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
    }

    // Verify accepted match
    const matchColl = await getUniversityMatchCollection();
    const match = await matchColl.findOne({ challengeId: data.challengeId, universityId });
    if (!match || match.status !== 'ACCEPTED') {
      return NextResponse.json({ success: false, error: 'You must have an ACCEPTED match to create a project' }, { status: 403 });
    }

    // Verify duplicate project
    const projectsColl = await getProjectsCollection();
    const existingProject = await projectsColl.findOne({ challengeId: data.challengeId, universityId });
    if (existingProject) {
      return NextResponse.json({ success: false, error: 'Project already exists for this challenge' }, { status: 409 });
    }

    const projectId = `SAM-P-${new ObjectId().toHexString().substring(0, 8).toUpperCase()}`;

    const newProject: Project = {
      projectId,
      challengeId: data.challengeId,
      universityId,
      teamId: data.teamId,
      title: data.title,
      description: data.description,
      status: 'PLANNING' as ProjectStatus,
      progress: 0,
      mentor: {
        name: team.mentor,
      },
      members: team.members,
      startDate: new Date(),
      targetDate: new Date(data.targetDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await projectsColl.insertOne(newProject);
    if (!result.acknowledged) {
      return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
    }

    // Log activity
    const activitiesColl = await getProjectActivitiesCollection();
    await activitiesColl.insertOne({
      activityId: `ACT-${new ObjectId().toHexString()}`,
      projectId,
      type: 'PROJECT_CREATED' as ActivityType,
      message: 'Project has been created from the accepted challenge and team.',
      actorName: user.name || 'University User',
      createdAt: new Date()
    });

    // Phase 9: Notifications
    await notifyProjectCreated(universityId, 'UNIVERSITY', projectId, data.title);
    if (challenge.submittedBy) {
      await notifyProjectCreated(challenge.submittedBy, 'CITIZEN', projectId, data.title);
    }

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
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

    const projectsColl = await getProjectsCollection();
    const projects = await projectsColl.find({ universityId: user.id }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
