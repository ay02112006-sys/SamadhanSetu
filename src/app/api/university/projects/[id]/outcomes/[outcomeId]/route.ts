// src/app/api/university/projects/[id]/outcomes/[outcomeId]/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getProjectsCollection } from '@/lib/project';
import { getProjectOutcomeCollection } from '@/lib/outcome';
import { z } from 'zod';

const updateSchema = z.object({
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  baselineValue: z.number().optional(),
  description: z.string().optional(),
  verified: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; outcomeId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const user = session.user as { id?: string; role?: string };
    if (user.role !== 'UNIVERSITY' || !user.id) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // IDOR: verify university owns the project
    const projectsColl = await getProjectsCollection();
    const project = await projectsColl.findOne({ projectId: params.id, universityId: user.id });
    if (!project) return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 404 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });

    const coll = await getProjectOutcomeCollection();
    const outcome = await coll.findOne({ outcomeId: params.outcomeId, projectId: params.id });
    if (!outcome) return NextResponse.json({ success: false, error: 'Outcome not found' }, { status: 404 });

    await coll.updateOne(
      { outcomeId: params.outcomeId },
      { $set: { ...parsed.data, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: 'Outcome updated' });
  } catch (error) {
    console.error('PATCH outcome error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
