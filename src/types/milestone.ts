// src/types/milestone.ts
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface Milestone {
  _id?: string;
  milestoneId: string;
  projectId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  dueDate: Date;
  completedAt?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
