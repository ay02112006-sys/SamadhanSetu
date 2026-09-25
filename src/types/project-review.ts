// src/types/project-review.ts
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface ProjectReview {
  _id?: string;
  reviewId: string;
  projectId: string;
  reviewerName: string;
  reviewerRole: string; // e.g., 'MENTOR'
  status: ReviewStatus;
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}
