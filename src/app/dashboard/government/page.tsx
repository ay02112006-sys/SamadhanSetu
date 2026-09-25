// src/app/dashboard/government/page.tsx
import { getServerAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getChallengeCollection } from '@/lib/challenge';
import { getProjectsCollection } from '@/lib/project';
import { getUsersCollection } from '@/lib/university';
import { getIndustryProfileCollection, getIndustryCollaborationCollection } from '@/lib/industry';

export default async function GovernmentDashboard() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect('/login');
  const user = session.user as { id?: string; role?: string; name?: string };
  if (user.role !== 'GOVERNMENT') redirect('/dashboard');

  // Parallel aggregation queries
  const [challengeColl, projectsColl, usersColl, industryProfileColl, collabColl] = await Promise.all([
    getChallengeCollection(),
    getProjectsCollection(),
    getUsersCollection(),
    getIndustryProfileCollection(),
    getIndustryCollaborationCollection(),
  ]);

  const [
    totalChallenges,
    validatedChallenges,
    totalProjects,
    activeProjects,
    completedProjects,
    totalUniversities,
    totalIndustry,
    activeCollaborations,
    challengeStatusAgg,
  ] = await Promise.all([
    challengeColl.countDocuments({}),
    challengeColl.countDocuments({ status: 'VALIDATED' }),
    projectsColl.countDocuments({}),
    projectsColl.countDocuments({ status: { $in: ['PLANNING', 'IN_PROGRESS', 'UNDER_REVIEW', 'TESTING'] } }),
    projectsColl.countDocuments({ status: 'COMPLETED' }),
    usersColl.countDocuments({ role: 'UNIVERSITY' }),
    industryProfileColl.countDocuments({}),
    collabColl.countDocuments({ status: { $in: ['INITIATED', 'ACTIVE'] } }),
    challengeColl.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
  ]);

  const statusMap = new Map(challengeStatusAgg.map((s) => [s._id, s.count]));

  const kpis = [
    { label: 'Total Challenges', value: totalChallenges, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
    { label: 'Validated', value: validatedChallenges, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
    { label: 'Total Projects', value: totalProjects, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
    { label: 'Active Projects', value: activeProjects, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' },
    { label: 'Completed Projects', value: completedProjects, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Universities', value: totalUniversities, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-100' },
    { label: 'Industry Orgs', value: totalIndustry, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    { label: 'Active Collaborations', value: activeCollaborations, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
  ];

  const CHALLENGE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'VALIDATED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

  return (
    <section className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Government Command Dashboard</h1>
        <p className="text-gray-500 text-sm">SamadhanSetu Platform — Ecosystem Monitoring & Analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`border rounded-lg p-5 ${kpi.bg}`}>
            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Challenge Status Distribution */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Challenge Status Distribution</h2>
          <div className="space-y-3">
            {CHALLENGE_STATUSES.map((status) => {
              const count = statusMap.get(status) ?? 0;
              const pct = totalChallenges > 0 ? Math.round((count / totalChallenges) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{status.replace(/_/g, ' ')}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Monitoring</h2>
          <div className="space-y-3">
            {[
              { label: '📊 Detailed Analytics', href: '/dashboard/government/analytics', desc: 'Domain, priority, AI, outcomes' },
              { label: '🏛 All Challenges', href: '/dashboard/government/challenges', desc: 'Filter and monitor challenges' },
              { label: '🚀 All Projects', href: '/dashboard/government/projects', desc: 'Filter and monitor projects' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex justify-between items-center w-full px-4 py-3 bg-gray-50 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Platform Health</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded text-center">
                <p className="font-bold text-lg">{totalChallenges > 0 ? Math.round((validatedChallenges / totalChallenges) * 100) : 0}%</p>
                <p className="text-gray-500 text-xs">Validation Rate</p>
              </div>
              <div className="p-3 bg-gray-50 rounded text-center">
                <p className="font-bold text-lg">{totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%</p>
                <p className="text-gray-500 text-xs">Project Completion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
