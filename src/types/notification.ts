// src/types/notification.ts

export type NotificationType =
  | 'CHALLENGE_SUBMITTED'
  | 'CHALLENGE_STATUS_CHANGED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'UNIVERSITY_MATCH_FOUND'
  | 'UNIVERSITY_MATCH_ACCEPTED'
  | 'UNIVERSITY_MATCH_DECLINED'
  | 'TEAM_CREATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_PROGRESS_UPDATED'
  | 'MILESTONE_COMPLETED'
  | 'DELIVERABLE_SUBMITTED'
  | 'DELIVERABLE_REVIEWED'
  | 'PROJECT_REVIEW_SUBMITTED'
  | 'INDUSTRY_INTEREST_RECEIVED'
  | 'INDUSTRY_INTEREST_ACCEPTED'
  | 'INDUSTRY_INTEREST_DECLINED'
  | 'COLLABORATION_CREATED'
  | 'COLLABORATION_STATUS_CHANGED'
  | 'SUPPORT_ACTIVITY_COMPLETED'
  | 'FUNDING_COMMITMENT_CREATED'
  | 'FUNDING_STATUS_CHANGED'
  | 'PROJECT_OUTCOME_UPDATED'
  | 'GOVERNMENT_CHALLENGE_ALERT'
  | 'GOVERNMENT_PROJECT_ALERT'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationEntityType =
  | 'CHALLENGE'
  | 'PROJECT'
  | 'TEAM'
  | 'MILESTONE'
  | 'DELIVERABLE'
  | 'REVIEW'
  | 'INDUSTRY_INTEREST'
  | 'COLLABORATION'
  | 'FUNDING'
  | 'OUTCOME'
  | 'SYSTEM';

export interface Notification {
  _id?: string;
  notificationId: string;
  recipientId: string;
  recipientRole: string;

  type: NotificationType;
  title: string;
  message: string;

  entityType: NotificationEntityType;
  entityId: string;

  actionUrl: string;

  priority: NotificationPriority;

  isRead: boolean;
  readAt?: Date;

  eventKey?: string;

  createdAt: Date;
  updatedAt: Date;
}
