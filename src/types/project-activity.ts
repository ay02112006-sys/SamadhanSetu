// src/types/project-activity.ts
export type ActivityType = 
  | 'PROJECT_CREATED' 
  | 'STATUS_CHANGED' 
  | 'MILESTONE_CREATED' 
  | 'MILESTONE_COMPLETED' 
  | 'TASK_COMPLETED' 
  | 'DELIVERABLE_SUBMITTED' 
  | 'REVIEW_SUBMITTED';

export interface ProjectActivity {
  _id?: string;
  activityId: string;
  projectId: string;
  type: ActivityType;
  message: string;
  actorName: string;
  createdAt: Date;
}
