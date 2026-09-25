// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';
import { NotificationType } from '@/types/notification';

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { id?: string };
    if (!user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') ?? 'all') as 'all' | 'unread' | 'read';
    const typeParam = searchParams.get('type') as NotificationType | null;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');

    const result = await getNotifications({
      recipientId: user.id,
      filter,
      type: typeParam ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
