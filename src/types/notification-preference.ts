// src/types/notification-preference.ts

export interface NotificationPreference {
  _id?: string;
  userId: string;

  challengeUpdates: boolean;
  projectUpdates: boolean;
  collaborationUpdates: boolean;
  fundingUpdates: boolean;
  systemUpdates: boolean;

  createdAt: Date;
  updatedAt: Date;
}
