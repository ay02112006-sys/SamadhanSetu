// src/types/deliverable.ts
export type DeliverableType = 'DOCUMENT' | 'PROTOTYPE' | 'REPORT' | 'PRESENTATION' | 'DEMO' | 'OTHER';
export type DeliverableStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface Deliverable {
  _id?: string;
  deliverableId: string;
  projectId: string;
  title: string;
  description: string;
  type: DeliverableType;
  url: string; // Link-based deliverables for Phase 6
  status: DeliverableStatus;
  submittedBy: string; // User ID or Name
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
