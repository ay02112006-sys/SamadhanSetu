// src/data/demo.ts
export interface Challenge {
  id: number;
  title: string;
  description: string;
  domain: string;
  location: string;
  status: 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  submittedBy: string;
  submittedDate: string; // ISO date string
  impact: string;
  requiredDisciplines: string[];
}

export interface Project {
  id: number;
  title: string;
  challengeId: number;
  university: string;
  team: string;
  facultyMentor: string;
  industryPartner: string;
  progress: number; // 0-100
  status: 'Planned' | 'In Progress' | 'Completed';
  milestones: string[];
}

export interface Stats {
  totalChallenges: number;
  activeProjects: number;
  universityPartners: number;
  industryPartners: number;
  solutionsDeployed: number;
}

export const demoStats: Stats = {
  totalChallenges: 1284,
  activeProjects: 428,
  universityPartners: 67,
  industryPartners: 34,
  solutionsDeployed: 126,
};

export const demoChallenges: Challenge[] = [
  {
    id: 1,
    title: 'Rural Drinking Water Monitoring',
    description: 'Install low-cost sensors to monitor water quality in rural villages.',
    domain: 'Water',
    location: 'Dhanbad',
    status: 'Submitted',
    priority: 'High',
    submittedBy: 'Citizen A',
    submittedDate: '2024-03-12',
    impact: 'Improved health',
    requiredDisciplines: ['Environmental Engineering', 'Data Science'],
  },
  {
    id: 2,
    title: 'Smart Waste Management',
    description: 'IoT bins to optimize waste collection routes.',
    domain: 'Environment',
    location: 'Ranchi',
    status: 'Under Review',
    priority: 'Medium',
    submittedBy: 'Citizen B',
    submittedDate: '2024-02-28',
    impact: 'Reduced litter',
    requiredDisciplines: ['Computer Science', 'Logistics'],
  },
  {
    id: 3,
    title: 'School Science Lab Accessibility',
    description: 'Equip rural schools with basic lab equipment.',
    domain: 'Education',
    location: 'Bokaro',
    status: 'Assigned',
    priority: 'Low',
    submittedBy: 'Citizen C',
    submittedDate: '2024-01-15',
    impact: 'Better STEM learning',
    requiredDisciplines: ['Education', 'Mechanical Design'],
  },
  {
    id: 4,
    title: 'Crop Disease Detection',
    description: 'AI models to detect diseases from leaf images.',
    domain: 'Agriculture',
    location: 'Giridih',
    status: 'In Progress',
    priority: 'High',
    submittedBy: 'Citizen D',
    submittedDate: '2024-04-01',
    impact: 'Higher yields',
    requiredDisciplines: ['AI', 'Plant Pathology'],
  },
  {
    id: 5,
    title: 'Rural Healthcare Access',
    description: 'Telemedicine hubs for remote villages.',
    domain: 'Health',
    location: 'Latehar',
    status: 'Resolved',
    priority: 'Medium',
    submittedBy: 'Citizen E',
    submittedDate: '2024-03-20',
    impact: 'Faster treatment',
    requiredDisciplines: ['Medicine', 'Network Engineering'],
  },
  {
    id: 6,
    title: 'Village Road Condition Monitoring',
    description: 'Sensors to report road wear and plan repairs.',
    domain: 'Infrastructure',
    location: 'Hazaribagh',
    status: 'Submitted',
    priority: 'Low',
    submittedBy: 'Citizen F',
    submittedDate: '2024-02-10',
    impact: 'Safer travel',
    requiredDisciplines: ['Civil Engineering', 'IoT'],
  },
];

export const demoProjects: Project[] = [
  {
    id: 101,
    title: 'AI-powered Water Quality Dashboard',
    challengeId: 1,
    university: 'JNU',
    team: 'Team Aqua',
    facultyMentor: 'Prof. Sharma',
    industryPartner: 'AquaTech Ltd.',
    progress: 70,
    status: 'In Progress',
    milestones: ['Data collection', 'Model training', 'Dashboard UI', 'Pilot deployment'],
  },
  // Additional mock projects can be added here
];
