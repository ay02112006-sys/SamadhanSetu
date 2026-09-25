// src/types/university-team.ts
export interface TeamMember {
  userId?: string;
  name: string;
  role: string;
  department: string;
  skills: string[];
}

export interface UniversityTeam {
  _id?: string;
  teamId: string;
  challengeId: string;
  universityId: string;
  name: string;
  description: string;
  mentor: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}
