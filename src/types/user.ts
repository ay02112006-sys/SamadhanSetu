// src/types/user.ts
import { UniversityProfile } from "./university";

export type UserRole = "CITIZEN" | "UNIVERSITY" | "INDUSTRY" | "GOVERNMENT";

export interface User {
  _id?: string; // MongoDB ObjectId as string
  name: string;
  email: string;
  passwordHash: string; // bcrypt hash
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  universityProfile?: UniversityProfile;
}

