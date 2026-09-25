// src/app/dashboard/page.tsx
import { StatCard } from '@/components/ui/StatCard';
import { demoStats, demoChallenges, demoProjects } from '@/data/demo';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Good morning, Welcome to SamadhanSetu</h1>
      <p className="mb-6 text-gray-600">A unified view of societal challenges and innovation activity.</p>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Challenges" value={demoStats.totalChallenges} />
        <StatCard label="Active Projects" value={demoStats.activeProjects} />
        <StatCard label="University Partners" value={demoStats.universityPartners} />
        <StatCard label="Industry Partners" value={demoStats.industryPartners} />
        <StatCard label="Solutions Deployed" value={demoStats.solutionsDeployed} />
      </div>

      {/* Recent Challenges */}
      <section className="mb-8">
        <h2 className="text-xl font-medium mb-4">Recent Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoChallenges.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/challenges/${c.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-2 text-primary">{c.title}</h3>
                <p className="text-sm text-gray-600 mb-1">Domain: {c.domain}</p>
                <p className="text-sm text-gray-600">Status: {c.status}</p>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/challenges">
            <Button variant="outline">View All Challenges</Button>
          </Link>
        </div>
      </section>

      {/* Active Projects */}
      <section>
        <h2 className="text-xl font-medium mb-4">Active Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoProjects.slice(0, 4).map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}> 
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-2 text-primary">{p.title}</h3>
                <p className="text-sm text-gray-600 mb-1">University: {p.university}</p>
                <p className="text-sm text-gray-600">Status: {p.status}</p>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/projects">
            <Button variant="outline">View All Projects</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
