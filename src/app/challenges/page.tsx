// src/app/challenges/page.tsx
import { Card } from '@/components/ui/Card';
import { demoChallenges } from '@/data/demo';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ChallengesPage() {
  return (
    <section className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Challenges</h1>
      {/* Filters (UI only) */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>All Domains</option>
          <option>Water</option>
          <option>Environment</option>
          <option>Education</option>
          <option>Agriculture</option>
          <option>Health</option>
          <option>Infrastructure</option>
        </select>
        <select className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>All Statuses</option>
          <option>Submitted</option>
          <option>Under Review</option>
          <option>Assigned</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
        <select className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>All Priorities</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <input type="text" placeholder="Search…" className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoChallenges.map((c) => (
          <Link key={c.id} href={`/challenges/${c.id}`}> 
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2 text-primary">{c.title}</h3>
              <p className="text-sm text-gray-600 mb-1">Domain: {c.domain}</p>
              <p className="text-sm text-gray-600 mb-1">Location: {c.location}</p>
              <p className="text-sm text-gray-600">Status: {c.status} | Priority: {c.priority}</p>
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
