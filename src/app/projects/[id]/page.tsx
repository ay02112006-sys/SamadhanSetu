// src/app/projects/[id]/page.tsx
import { notFound } from 'next/navigation';
import { demoProjects, Project } from '@/data/demo';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default function ProjectDetail({ params }: Props) {
  const projectId = parseInt(params.id, 10);
  const project: Project | undefined = demoProjects.find((p) => p.id === projectId);

  if (!project) {
    notFound();
    return null;
  }

  return (
    <section className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4 text-primary">{project.title}</h1>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <li><strong>Related Challenge ID:</strong> {project.challengeId}</li>
          <li><strong>University:</strong> {project.university}</li>
          <li><strong>Industry Partner:</strong> {project.industryPartner}</li>
          <li><strong>Team:</strong> {project.team}</li>
          <li><strong>Faculty Mentor:</strong> {project.facultyMentor}</li>
          <li><strong>Status:</strong> {project.status}</li>
          <li><strong>Progress:</strong> {project.progress}%</li>
          <li><strong>Milestones:</strong> {project.milestones.join(', ')}</li>
        </ul>
        <div className="flex space-x-4">
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
          {/* Placeholder for future actions */}
          <Button variant="primary" disabled>Update Project (Phase 2)</Button>
        </div>
      </Card>
    </section>
  );
}
