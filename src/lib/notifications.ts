// src/lib/notifications.ts
// Central notification service — all notification creation flows through here.
import { Collection } from 'mongodb';
import clientPromise from './mongodb';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationEntityType,
} from '@/types/notification';
import { NotificationPreference } from '@/types/notification-preference';
import { ObjectId } from 'mongodb';

// ─── Collection accessors ────────────────────────────────────────────
let notifColl: Collection<Notification> | null = null;
let prefColl: Collection<NotificationPreference> | null = null;

export async function getNotificationsCollection(): Promise<Collection<Notification>> {
  if (!notifColl) {
    const db = await clientPromise;
    notifColl = db.collection<Notification>('notifications');
    // Indexes
    await notifColl.createIndex({ recipientId: 1, createdAt: -1 });
    await notifColl.createIndex({ recipientId: 1, isRead: 1 });
    await notifColl.createIndex({ recipientId: 1, type: 1 });
    await notifColl.createIndex({ entityType: 1, entityId: 1 });
    await notifColl.createIndex({ notificationId: 1 }, { unique: true });
    await notifColl.createIndex(
      { eventKey: 1 },
      { unique: true, partialFilterExpression: { eventKey: { $exists: true, $ne: null } } }
    );
  }
  return notifColl as Collection<Notification>;
}

export async function getNotificationPreferencesCollection(): Promise<Collection<NotificationPreference>> {
  if (!prefColl) {
    const db = await clientPromise;
    prefColl = db.collection<NotificationPreference>('notification_preferences');
    await prefColl.createIndex({ userId: 1 }, { unique: true });
  }
  return prefColl as Collection<NotificationPreference>;
}

// ─── Preference helpers ──────────────────────────────────────────────

const DEFAULT_PREFS: Omit<NotificationPreference, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  challengeUpdates: true,
  projectUpdates: true,
  collaborationUpdates: true,
  fundingUpdates: true,
  systemUpdates: true,
};

export async function getUserPreferences(userId: string): Promise<NotificationPreference> {
  const coll = await getNotificationPreferencesCollection();
  const existing = await coll.findOne({ userId });
  if (existing) return existing;
  const now = new Date();
  const pref: NotificationPreference = { userId, ...DEFAULT_PREFS, createdAt: now, updatedAt: now };
  await coll.insertOne(pref);
  return pref;
}

// Map notification type → preference category key
function getCategoryForType(type: NotificationType): keyof typeof DEFAULT_PREFS | null {
  switch (type) {
    case 'CHALLENGE_SUBMITTED':
    case 'CHALLENGE_STATUS_CHANGED':
    case 'AI_ANALYSIS_COMPLETED':
    case 'UNIVERSITY_MATCH_FOUND':
    case 'UNIVERSITY_MATCH_ACCEPTED':
    case 'UNIVERSITY_MATCH_DECLINED':
      return 'challengeUpdates';

    case 'TEAM_CREATED':
    case 'PROJECT_CREATED':
    case 'PROJECT_STATUS_CHANGED':
    case 'PROJECT_PROGRESS_UPDATED':
    case 'MILESTONE_COMPLETED':
    case 'DELIVERABLE_SUBMITTED':
    case 'DELIVERABLE_REVIEWED':
    case 'PROJECT_REVIEW_SUBMITTED':
    case 'PROJECT_OUTCOME_UPDATED':
      return 'projectUpdates';

    case 'INDUSTRY_INTEREST_RECEIVED':
    case 'INDUSTRY_INTEREST_ACCEPTED':
    case 'INDUSTRY_INTEREST_DECLINED':
    case 'COLLABORATION_CREATED':
    case 'COLLABORATION_STATUS_CHANGED':
    case 'SUPPORT_ACTIVITY_COMPLETED':
      return 'collaborationUpdates';

    case 'FUNDING_COMMITMENT_CREATED':
    case 'FUNDING_STATUS_CHANGED':
      return 'fundingUpdates';

    case 'GOVERNMENT_CHALLENGE_ALERT':
    case 'GOVERNMENT_PROJECT_ALERT':
    case 'SYSTEM':
      return 'systemUpdates';

    default:
      return null;
  }
}

// ─── Core creation ───────────────────────────────────────────────────

export interface CreateNotificationParams {
  recipientId: string;
  recipientRole: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  actionUrl: string;
  priority?: NotificationPriority;
  eventKey?: string;
}

/**
 * Create a single notification, respecting user preferences and duplicate prevention.
 * Returns the inserted notification or null if suppressed/duplicate.
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  // Check user preferences (skip for SYSTEM/URGENT — always deliver)
  if (params.priority !== 'URGENT' && params.type !== 'SYSTEM') {
    const prefs = await getUserPreferences(params.recipientId);
    const category = getCategoryForType(params.type);
    if (category && !prefs[category]) {
      return null; // user opted out
    }
  }

  const now = new Date();
  const notification: Notification = {
    notificationId: `NOTIF-${new ObjectId().toHexString().substring(0, 12).toUpperCase()}`,
    recipientId: params.recipientId,
    recipientRole: params.recipientRole,
    type: params.type,
    title: params.title,
    message: params.message,
    entityType: params.entityType,
    entityId: params.entityId,
    actionUrl: params.actionUrl,
    priority: params.priority ?? 'NORMAL',
    isRead: false,
    eventKey: params.eventKey,
    createdAt: now,
    updatedAt: now,
  };

  const coll = await getNotificationsCollection();

  // Duplicate prevention via eventKey
  if (params.eventKey) {
    try {
      await coll.insertOne(notification);
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        return null; // duplicate — silently skip
      }
      throw err;
    }
  } else {
    await coll.insertOne(notification);
  }

  return notification;
}

/**
 * Create notifications for multiple recipients in bulk.
 * Each entry is independently validated for preferences/duplicates.
 */
export async function createNotifications(
  paramsList: CreateNotificationParams[]
): Promise<(Notification | null)[]> {
  const results: (Notification | null)[] = [];
  for (const params of paramsList) {
    results.push(await createNotification(params));
  }
  return results;
}

// ─── Query helpers ───────────────────────────────────────────────────

export interface GetNotificationsParams {
  recipientId: string;
  filter?: 'all' | 'unread' | 'read';
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export async function getNotifications(params: GetNotificationsParams) {
  const coll = await getNotificationsCollection();
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { recipientId: params.recipientId };
  if (params.filter === 'unread') query.isRead = false;
  if (params.filter === 'read') query.isRead = true;
  if (params.type) query.type = params.type;

  const [notifications, total] = await Promise.all([
    coll.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    coll.countDocuments(query),
  ]);

  return { notifications, total, page, pages: Math.ceil(total / limit) };
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  const coll = await getNotificationsCollection();
  return coll.countDocuments({ recipientId, isRead: false });
}

export async function markAsRead(notificationId: string, recipientId: string): Promise<boolean> {
  const coll = await getNotificationsCollection();
  const result = await coll.updateOne(
    { notificationId, recipientId },
    { $set: { isRead: true, readAt: new Date(), updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function markAllAsRead(recipientId: string): Promise<number> {
  const coll = await getNotificationsCollection();
  const result = await coll.updateMany(
    { recipientId, isRead: false },
    { $set: { isRead: true, readAt: new Date(), updatedAt: new Date() } }
  );
  return result.modifiedCount;
}

// ─── Event-specific helpers ──────────────────────────────────────────

export async function notifyChallengeSubmitted(
  citizenId: string,
  challengeId: string,
  challengeTitle: string
) {
  return createNotification({
    recipientId: citizenId,
    recipientRole: 'CITIZEN',
    type: 'CHALLENGE_SUBMITTED',
    title: 'Challenge Submitted',
    message: `Your challenge "${challengeTitle}" has been submitted successfully.`,
    entityType: 'CHALLENGE',
    entityId: challengeId,
    actionUrl: `/challenges/${challengeId}`,
    priority: 'NORMAL',
    eventKey: `challenge-submitted:${challengeId}`,
  });
}

export async function notifyChallengeStatusChanged(
  citizenId: string,
  challengeId: string,
  challengeTitle: string,
  newStatus: string
) {
  return createNotification({
    recipientId: citizenId,
    recipientRole: 'CITIZEN',
    type: 'CHALLENGE_STATUS_CHANGED',
    title: 'Challenge Status Updated',
    message: `Your challenge "${challengeTitle}" status changed to ${newStatus.replace(/_/g, ' ')}.`,
    entityType: 'CHALLENGE',
    entityId: challengeId,
    actionUrl: `/challenges/${challengeId}`,
    priority: newStatus === 'REJECTED' ? 'HIGH' : 'NORMAL',
    eventKey: `challenge-status:${challengeId}:${newStatus}`,
  });
}

export async function notifyAIAnalysisCompleted(
  citizenId: string,
  challengeId: string,
  challengeTitle: string
) {
  return createNotification({
    recipientId: citizenId,
    recipientRole: 'CITIZEN',
    type: 'AI_ANALYSIS_COMPLETED',
    title: 'AI Analysis Completed',
    message: `AI analysis for "${challengeTitle}" is now available.`,
    entityType: 'CHALLENGE',
    entityId: challengeId,
    actionUrl: `/challenges/${challengeId}`,
    priority: 'NORMAL',
    eventKey: `ai-analysis-completed:${challengeId}`,
  });
}

export async function notifyUniversityMatchFound(
  universityId: string,
  challengeId: string,
  challengeTitle: string,
  score: number
) {
  return createNotification({
    recipientId: universityId,
    recipientRole: 'UNIVERSITY',
    type: 'UNIVERSITY_MATCH_FOUND',
    title: 'New Challenge Match',
    message: `New challenge match: "${challengeTitle}" (${Math.round(score * 100)}% match).`,
    entityType: 'CHALLENGE',
    entityId: challengeId,
    actionUrl: `/dashboard/university/challenges/${challengeId}`,
    priority: 'NORMAL',
    eventKey: `match-found:${challengeId}:${universityId}`,
  });
}

export async function notifyUniversityMatchAccepted(
  citizenId: string,
  challengeId: string,
  challengeTitle: string,
  universityName: string
) {
  return createNotification({
    recipientId: citizenId,
    recipientRole: 'CITIZEN',
    type: 'UNIVERSITY_MATCH_ACCEPTED',
    title: 'University Accepted Your Challenge',
    message: `${universityName} accepted your challenge "${challengeTitle}".`,
    entityType: 'CHALLENGE',
    entityId: challengeId,
    actionUrl: `/challenges/${challengeId}`,
    priority: 'HIGH',
    eventKey: `match-accepted:${challengeId}:${citizenId}`,
  });
}

export async function notifyUniversityMatchDeclined(
  citizenId: string,
  challengeId: string,
  challengeTitle: string,
  universityName: string
) {
  return createNotification({
    recipientId: citizenId,
    recipientRole: 'CITIZEN',
    type: 'UNIVERSITY_MATCH_DECLINED',
    title: 'University Declined Challenge',
    message: `${universityName} declined your challenge "${challengeTitle}".`,
    entityType: 'CHALLENGE',
    entityId: challengeId,
    actionUrl: `/challenges/${challengeId}`,
    priority: 'NORMAL',
    eventKey: `match-declined:${challengeId}:${citizenId}`,
  });
}

export async function notifyProjectCreated(
  recipientId: string,
  recipientRole: string,
  projectId: string,
  projectTitle: string
) {
  return createNotification({
    recipientId,
    recipientRole,
    type: 'PROJECT_CREATED',
    title: 'Project Created',
    message: `Project "${projectTitle}" has been created.`,
    entityType: 'PROJECT',
    entityId: projectId,
    actionUrl: recipientRole === 'UNIVERSITY'
      ? `/dashboard/university/projects/${projectId}`
      : `/challenges/${projectId}`,
    priority: 'NORMAL',
    eventKey: `project-created:${projectId}:${recipientId}`,
  });
}

export async function notifyProjectStatusChanged(
  recipientId: string,
  recipientRole: string,
  projectId: string,
  projectTitle: string,
  newStatus: string
) {
  return createNotification({
    recipientId,
    recipientRole,
    type: 'PROJECT_STATUS_CHANGED',
    title: 'Project Status Updated',
    message: `Project "${projectTitle}" status changed to ${newStatus.replace(/_/g, ' ')}.`,
    entityType: 'PROJECT',
    entityId: projectId,
    actionUrl: recipientRole === 'UNIVERSITY'
      ? `/dashboard/university/projects/${projectId}`
      : recipientRole === 'GOVERNMENT'
        ? `/dashboard/government/projects/${projectId}`
        : `/challenges/${projectId}`,
    priority: newStatus === 'COMPLETED' ? 'HIGH' : 'NORMAL',
    eventKey: `project-status:${projectId}:${newStatus}:${recipientId}`,
  });
}

export async function notifyMilestoneCompleted(
  recipientId: string,
  recipientRole: string,
  projectId: string,
  milestoneTitle: string,
  milestoneId: string
) {
  return createNotification({
    recipientId,
    recipientRole,
    type: 'MILESTONE_COMPLETED',
    title: 'Milestone Completed',
    message: `Milestone "${milestoneTitle}" has been completed.`,
    entityType: 'MILESTONE',
    entityId: milestoneId,
    actionUrl: `/dashboard/university/projects/${projectId}`,
    priority: 'NORMAL',
    eventKey: `milestone-completed:${milestoneId}:${recipientId}`,
  });
}

export async function notifyIndustryInterestReceived(
  universityId: string,
  projectId: string,
  interestId: string,
  orgName: string
) {
  return createNotification({
    recipientId: universityId,
    recipientRole: 'UNIVERSITY',
    type: 'INDUSTRY_INTEREST_RECEIVED',
    title: 'Industry Interest Received',
    message: `${orgName} expressed interest in your project.`,
    entityType: 'INDUSTRY_INTEREST',
    entityId: interestId,
    actionUrl: `/dashboard/university/industry`,
    priority: 'NORMAL',
    eventKey: `interest-received:${interestId}`,
  });
}

export async function notifyIndustryInterestDecision(
  industryId: string,
  interestId: string,
  accepted: boolean,
  projectTitle: string
) {
  return createNotification({
    recipientId: industryId,
    recipientRole: 'INDUSTRY',
    type: accepted ? 'INDUSTRY_INTEREST_ACCEPTED' : 'INDUSTRY_INTEREST_DECLINED',
    title: accepted ? 'Interest Accepted' : 'Interest Declined',
    message: accepted
      ? `Your interest in project "${projectTitle}" has been accepted.`
      : `Your interest in project "${projectTitle}" has been declined.`,
    entityType: 'INDUSTRY_INTEREST',
    entityId: interestId,
    actionUrl: `/dashboard/industry/interests`,
    priority: accepted ? 'HIGH' : 'NORMAL',
    eventKey: `interest-decision:${interestId}:${accepted ? 'accepted' : 'declined'}`,
  });
}

export async function notifyCollaborationCreated(
  recipientId: string,
  recipientRole: string,
  collaborationId: string,
  partnerName: string
) {
  return createNotification({
    recipientId,
    recipientRole,
    type: 'COLLABORATION_CREATED',
    title: 'Collaboration Created',
    message: `New collaboration established with ${partnerName}.`,
    entityType: 'COLLABORATION',
    entityId: collaborationId,
    actionUrl: recipientRole === 'UNIVERSITY'
      ? `/dashboard/university/collaborations/${collaborationId}`
      : `/dashboard/industry/collaborations/${collaborationId}`,
    priority: 'HIGH',
    eventKey: `collaboration-created:${collaborationId}:${recipientId}`,
  });
}

export async function notifyFundingCommitmentCreated(
  recipientId: string,
  recipientRole: string,
  fundingId: string,
  collaborationId: string,
  amount: number,
  currency: string
) {
  return createNotification({
    recipientId,
    recipientRole,
    type: 'FUNDING_COMMITMENT_CREATED',
    title: 'Funding Commitment Created',
    message: `New funding commitment of ${currency} ${amount.toLocaleString()} has been created.`,
    entityType: 'FUNDING',
    entityId: fundingId,
    actionUrl: recipientRole === 'UNIVERSITY'
      ? `/dashboard/university/collaborations/${collaborationId}`
      : `/dashboard/industry/collaborations/${collaborationId}`,
    priority: 'HIGH',
    eventKey: `funding-created:${fundingId}:${recipientId}`,
  });
}

export async function notifyGovernmentHighPriorityChallenge(
  governmentUserIds: string[],
  challengeId: string,
  challengeTitle: string,
  priority: string
) {
  return createNotifications(
    governmentUserIds.map((govId) => ({
      recipientId: govId,
      recipientRole: 'GOVERNMENT',
      type: 'GOVERNMENT_CHALLENGE_ALERT' as NotificationType,
      title: `${priority} Priority Challenge`,
      message: `New ${priority.toLowerCase()}-priority challenge requires attention: "${challengeTitle}".`,
      entityType: 'CHALLENGE' as NotificationEntityType,
      entityId: challengeId,
      actionUrl: `/dashboard/government/challenges/${challengeId}`,
      priority: 'HIGH' as NotificationPriority,
      eventKey: `gov-challenge-alert:${challengeId}`,
    }))
  );
}

export async function notifyGovernmentProjectCompleted(
  governmentUserIds: string[],
  projectId: string,
  projectTitle: string
) {
  return createNotifications(
    governmentUserIds.map((govId) => ({
      recipientId: govId,
      recipientRole: 'GOVERNMENT',
      type: 'GOVERNMENT_PROJECT_ALERT' as NotificationType,
      title: 'Project Completed',
      message: `Project "${projectTitle}" has been completed.`,
      entityType: 'PROJECT' as NotificationEntityType,
      entityId: projectId,
      actionUrl: `/dashboard/government/projects/${projectId}`,
      priority: 'NORMAL' as NotificationPriority,
      eventKey: `gov-project-completed:${projectId}`,
    }))
  );
}

// Helper: fetch all government user IDs for alert routing
export async function getGovernmentUserIds(): Promise<string[]> {
  const db = await clientPromise;
  const usersColl = db.collection('users');
  const govUsers = await usersColl
    .find({ role: 'GOVERNMENT' }, { projection: { _id: 1 } })
    .toArray();
  return govUsers.map((u) => u._id?.toString()).filter(Boolean) as string[];
}
