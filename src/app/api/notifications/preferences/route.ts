// src/app/api/notifications/preferences/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getUserPreferences, getNotificationPreferencesCollection } from '@/lib/notifications';
import { z } from 'zod';

const updateSchema = z.object({
  challengeUpdates: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  collaborationUpdates: z.boolean().optional(),
  fundingUpdates: z.boolean().optional(),
  systemUpdates: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string };
    if (!user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await getUserPreferences(user.id);
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error('GET notification preferences error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string };
    if (!user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation error', details: parsed.error.errors }, { status: 422 });
    }

    // Ensure preferences doc exists
    await getUserPreferences(user.id);

    const coll = await getNotificationPreferencesCollection();
    await coll.updateOne(
      { userId: user.id },
      { $set: { ...parsed.data, updatedAt: new Date() } }
    );

    const updated = await getUserPreferences(user.id);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (error) {
    console.error('PATCH notification preferences error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
