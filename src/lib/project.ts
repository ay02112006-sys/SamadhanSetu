// src/lib/project.ts
import { Collection } from 'mongodb';
import clientPromise from './mongodb';
import { Project } from '@/types/project';
import { Milestone } from '@/types/milestone';
import { ProjectTask } from '@/types/project-task';
import { Deliverable } from '@/types/deliverable';
import { ProjectReview } from '@/types/project-review';
import { ProjectActivity } from '@/types/project-activity';

let projectsColl: Collection<Project> | null = null;
let milestonesColl: Collection<Milestone> | null = null;
let tasksColl: Collection<ProjectTask> | null = null;
let deliverablesColl: Collection<Deliverable> | null = null;
let reviewsColl: Collection<ProjectReview> | null = null;
let activitiesColl: Collection<ProjectActivity> | null = null;

export async function getProjectsCollection(): Promise<Collection<Project>> {
  if (!projectsColl) {
    const db = await clientPromise;
    projectsColl = db.collection<Project>('projects');
    await projectsColl.createIndex({ projectId: 1 }, { unique: true });
    await projectsColl.createIndex({ challengeId: 1 });
    await projectsColl.createIndex({ universityId: 1 });
    await projectsColl.createIndex({ teamId: 1 });
    await projectsColl.createIndex({ challengeId: 1, universityId: 1 }, { unique: true });
  }
  return projectsColl as Collection<Project>;
}

export async function getMilestonesCollection(): Promise<Collection<Milestone>> {
  if (!milestonesColl) {
    const db = await clientPromise;
    milestonesColl = db.collection<Milestone>('milestones');
    await milestonesColl.createIndex({ projectId: 1 });
    await milestonesColl.createIndex({ milestoneId: 1 }, { unique: true });
  }
  return milestonesColl as Collection<Milestone>;
}

export async function getProjectTasksCollection(): Promise<Collection<ProjectTask>> {
  if (!tasksColl) {
    const db = await clientPromise;
    tasksColl = db.collection<ProjectTask>('project_tasks');
    await tasksColl.createIndex({ projectId: 1 });
    await tasksColl.createIndex({ milestoneId: 1 });
    await tasksColl.createIndex({ assignedTo: 1 });
    await tasksColl.createIndex({ taskId: 1 }, { unique: true });
  }
  return tasksColl as Collection<ProjectTask>;
}

export async function getProjectDeliverablesCollection(): Promise<Collection<Deliverable>> {
  if (!deliverablesColl) {
    const db = await clientPromise;
    deliverablesColl = db.collection<Deliverable>('project_deliverables');
    await deliverablesColl.createIndex({ projectId: 1 });
    await deliverablesColl.createIndex({ deliverableId: 1 }, { unique: true });
  }
  return deliverablesColl as Collection<Deliverable>;
}

export async function getProjectReviewsCollection(): Promise<Collection<ProjectReview>> {
  if (!reviewsColl) {
    const db = await clientPromise;
    reviewsColl = db.collection<ProjectReview>('project_reviews');
    await reviewsColl.createIndex({ projectId: 1 });
    await reviewsColl.createIndex({ reviewId: 1 }, { unique: true });
  }
  return reviewsColl as Collection<ProjectReview>;
}

export async function getProjectActivitiesCollection(): Promise<Collection<ProjectActivity>> {
  if (!activitiesColl) {
    const db = await clientPromise;
    activitiesColl = db.collection<ProjectActivity>('project_activities');
    await activitiesColl.createIndex({ projectId: 1 });
    await activitiesColl.createIndex({ createdAt: -1 });
    await activitiesColl.createIndex({ activityId: 1 }, { unique: true });
  }
  return activitiesColl as Collection<ProjectActivity>;
}
