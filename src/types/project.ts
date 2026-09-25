// src/types/project.ts
import { TeamMember } from './university-team';
import { Milestone } from './milestone';
import { Deliverable } from './deliverable';

export type ProjectStatus = 
  | 'PLANNING' 
  | 'IN_PROGRESS' 
  | 'ON_HOLD' 
  | 'UNDER_REVIEW' 
  | 'TESTING' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface Project {
  _id?: string;
  projectId: string; // e.g., SAM-P-26001
  challengeId: string;
  universityId: string;
  teamId: string;

  title: string;
  description: string;

  status: ProjectStatus;
  progress: number; // 0-100

  mentor: {
    name: string;
    department?: string;
    email?: string;
  };
  members: TeamMember[];

  startDate?: Date;
  targetDate: Date;

  createdAt: Date;
  updatedAt: Date;
}
