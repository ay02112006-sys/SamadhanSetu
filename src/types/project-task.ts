// src/types/project-task.ts
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectTask {
  _id?: string;
  taskId: string;
  projectId: string;
  milestoneId?: string; // Optional linkage to milestone
  title: string;
  description: string;
  assignedTo: string; // Member name or ID
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
