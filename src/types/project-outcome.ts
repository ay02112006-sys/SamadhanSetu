// src/types/project-outcome.ts

export type OutcomeType =
  | 'PEOPLE_REACHED'
  | 'TIME_SAVED'
  | 'COST_SAVED'
  | 'SERVICE_ACCESS'
  | 'WATER_SAVED'
  | 'ENERGY_SAVED'
  | 'FARMERS_SUPPORTED'
  | 'STUDENTS_SUPPORTED'
  | 'HEALTHCARE_ACCESS'
  | 'JOBS_SUPPORTED'
  | 'PILOTS_COMPLETED'
  | 'OTHER';

export interface ProjectOutcome {
  _id?: string;
  outcomeId: string;
  projectId: string;

  outcomeType: OutcomeType;
  metricName: string;
  baselineValue?: number;
  targetValue?: number;
  currentValue?: number;
  unit: string;

  description: string;
  verified: boolean;

  createdAt: Date;
  updatedAt: Date;
}
