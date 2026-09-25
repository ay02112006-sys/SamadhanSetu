// src/app/projects/page.tsx
import { Card } from '@/components/ui/Card';
import { demoProjects } from '@/data/demo';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ProjectsPage() {
  return (
    <section className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoProjects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2 text-primary">{p.title}</h3>
              <p className="text-sm text-gray-600 mb-1">University: {p.university}</p>
              <p className="text-sm text-gray-600 mb-1">Industry: {p.industryPartner}</p>
              <p className="text-sm text-gray-600">Status: {p.status} | Progress: {p.progress}%</p>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <Button variant="outline">Load More (demo)</Button>
      </div>
    </section>
  );
}
