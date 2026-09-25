// src/app/page.tsx
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { demoStats } from '@/data/demo';

export default function HomePage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-primary text-white py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">From Local Problems to Lasting Solutions.</h1>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          SamadhanSetu connects citizens, universities, industry and government to transform real societal challenges into research, innovation and deployable solutions.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login" className="inline-block">
            <Button variant="primary">Report a Problem</Button>
          </Link>
          <Link href="/challenges" className="inline-block">
            <Button variant="outline">Explore Challenges</Button>
          </Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container py-12">
        <h2 className="text-2xl font-semibold mb-4">The Problem</h2>
        <p>
          Thousands of local challenges are identified by communities, but many remain disconnected from the institutions and organizations capable of solving them.
        </p>
      </section>

      {/* How It Works */}
      <section className="bg-gray-100 py-12">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-6 text-center">How SamadhanSetu Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Report', 'Understand', 'Match', 'Collaborate', 'Build', 'Impact'].map((step, i) => (
              <div key={i} className="card text-center p-6">
                <div className="card-header text-lg font-medium mb-2">{i + 1}. {step}</div>
                <div className="card-body text-sm text-muted">Placeholder description for {step.toLowerCase()} step.</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholder Section */}
      <section className="container py-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Who It Connects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Citizens', 'Universities', 'Industry', 'Government'].map((role, i) => (
            <div key={i} className="card p-6">
              <div className="card-header font-medium mb-2">{role}</div>
              <div className="card-body text-sm text-muted">Brief description of how {role.toLowerCase()} benefit from the platform.</div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Preview */}
      <section className="bg-gray-50 py-12">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-6 text-center">Impact Preview (Demo)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {label: 'Challenges', value: demoStats.totalChallenges},
              {label: 'Projects', value: demoStats.activeProjects},
              {label: 'University Partners', value: demoStats.universityPartners},
              {label: 'Industry Partners', value: demoStats.industryPartners},
              {label: 'Solutions Deployed', value: demoStats.solutionsDeployed},
            ].map((item, i) => (
              <div key={i} className="stat-card bg-white p-6 text-center rounded-md shadow-sm">
                <div className="value text-2xl font-bold text-primary mb-1">{item.value}</div>
                <div className="label text-sm text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primaryLight text-white py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Have a problem worth solving?</h2>
        <Link href="/login" className="inline-block">
          <Button variant="primary">Report a Challenge</Button>
        </Link>
      </section>
    </main>
  );
}
