'use client';

import { useState, useEffect } from 'react';

// Analytics data types
type StatusCount = { _id: string; count: number };
type MonthlyCount = { _id: { year: number; month: number }; count: number };
type FundingCount = { _id: string; count: number; totalAmount: number };

type ChallengeData = {
  statusBreakdown: StatusCount[];
  domainBreakdown: StatusCount[];
  priorityBreakdown: StatusCount[];
  locationStateBreakdown: StatusCount[];
  monthlyTrend: MonthlyCount[];
  aiCoverage: { analyzed: number; total: number };
  duplicateDetections: number;
};

type ProjectData = {
  statusBreakdown: StatusCount[];
  progressBuckets: Array<{ _id: string | number; count: number }>;
  avgProgress: number;
  milestoneBreakdown: StatusCount[];
  overdueMillestones: number;
  deliverableBreakdown: StatusCount[];
  reviewBreakdown: StatusCount[];
};

type IndustryData = {
  totalOrganizations: number;
  interestBreakdown: StatusCount[];
  collaborationBreakdown: StatusCount[];
  activityTypeBreakdown: StatusCount[];
  fundingBreakdown: FundingCount[];
  sectorBreakdown: StatusCount[];
  supportTypeDistribution: StatusCount[];
};

type UniversityData = {
  totalUniversities: number;
  universitiesWithMatches: number;
  universitiesWithAcceptedChallenges: number;
  universitiesWithActiveProjects: number;
  universitiesWithCompletedProjects: number;
  topUniversities: Array<{ universityId: string; name: string; city: string; state: string; activeProjects: number; completedProjects: number }>;
};

type OutcomeData = {
  total: number;
  verified: number;
  unverified: number;
  byType: Array<{ _id: string; count: number; totalCurrent: number; totalTarget: number }>;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">{title}</h3>
      {children}
    </div>
  );
}

function BarRow({ label, count, total, color = 'bg-blue-500' }: { label: string; count: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label.replace(/_/g, ' ')}</span>
        <span className="text-gray-500">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatGrid({ items }: { items: Array<{ label: string; value: number | string; color?: string }> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 border rounded p-4 text-center">
          <p className={`text-2xl font-bold ${item.color ?? 'text-gray-800'}`}>{item.value}</p>
          <p className="text-xs text-gray-500 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-gray-400 text-sm italic">{message}</p>;
}

export default function GovernmentAnalyticsPage() {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);
  const [universityData, setUniversityData] = useState<UniversityData | null>(null);
  const [outcomeData, setOutcomeData] = useState<OutcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes, iRes, uRes, oRes] = await Promise.all([
          fetch('/api/government/analytics/challenges'),
          fetch('/api/government/analytics/projects'),
          fetch('/api/government/analytics/industry'),
          fetch('/api/government/analytics/universities'),
          fetch('/api/government/analytics/outcomes'),
        ]);
        const [cData, pData, iData, uData, oData] = await Promise.all([
          cRes.json(), pRes.json(), iRes.json(), uRes.json(), oRes.json(),
        ]);
        if (cData.success) setChallengeData(cData.data);
        if (pData.success) setProjectData(pData.data);
        if (iData.success) setIndustryData(iData.data);
        if (uData.success) setUniversityData(uData.data);
        if (oData.success) setOutcomeData(oData.data);
      } catch {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading analytics...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const totalChallenges = challengeData?.statusBreakdown.reduce((s, x) => s + x.count, 0) ?? 0;
  const totalProjects = projectData?.statusBreakdown.reduce((s, x) => s + x.count, 0) ?? 0;
  const totalInterests = industryData?.interestBreakdown.reduce((s, x) => s + x.count, 0) ?? 0;
  const totalCollabs = industryData?.collaborationBreakdown.reduce((s, x) => s + x.count, 0) ?? 0;

  const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  };

  const PROGRESS_LABELS: Record<string, string> = {
    '0': '0–25%',
    '26': '26–50%',
    '51': '51–75%',
    '76': '76–99%',
    '100': '100%',
  };

  const totalFundingINR = industryData?.fundingBreakdown
    .filter((f) => f._id !== 'CANCELLED')
    .reduce((s, f) => s + f.totalAmount, 0) ?? 0;

  return (
    <section className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Detailed Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide analytics derived from live database data</p>
      </div>

      {/* === CHALLENGE ANALYTICS === */}
      <SectionCard title="Challenge Analytics">
        {totalChallenges === 0 ? (
          <EmptyState message="No challenges submitted yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Status Breakdown</h4>
              {challengeData?.statusBreakdown.map((s) => (
                <BarRow key={s._id} label={s._id} count={s.count} total={totalChallenges} />
              ))}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">AI Coverage</h4>
              {challengeData && (
                <>
                  <StatGrid items={[
                    { label: 'AI Analyzed', value: challengeData.aiCoverage.analyzed, color: 'text-blue-700' },
                    { label: 'Not Analyzed', value: challengeData.aiCoverage.total - challengeData.aiCoverage.analyzed },
                    { label: 'Duplicate Signals', value: challengeData.duplicateDetections, color: 'text-amber-600' },
                    { label: 'Coverage', value: `${challengeData.aiCoverage.total > 0 ? Math.round((challengeData.aiCoverage.analyzed / challengeData.aiCoverage.total) * 100) : 0}%` },
                  ]} />
                </>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* === DOMAIN ANALYTICS === */}
      <SectionCard title="Domain Distribution">
        {!challengeData || challengeData.domainBreakdown.length === 0 ? (
          <EmptyState message="No domain data available yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {challengeData.domainBreakdown.map((d) => (
                <BarRow key={d._id} label={d._id} count={d.count} total={totalChallenges} color="bg-indigo-500" />
              ))}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Priority Breakdown</h4>
              {challengeData.priorityBreakdown.map((p) => (
                <BarRow key={p._id} label={p._id} count={p.count} total={totalChallenges} color={PRIORITY_COLORS[p._id] ?? 'bg-gray-500'} />
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* === LOCATION ANALYTICS === */}
      <SectionCard title="Location Analytics (State-level)">
        {!challengeData || challengeData.locationStateBreakdown.length === 0 ? (
          <EmptyState message="Location data not available. Challenge submissions may not contain structured state information." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {challengeData.locationStateBreakdown.map((l) => (
              <div key={l._id} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2 text-sm border">
                <span className="font-medium">{l._id || 'Unspecified'}</span>
                <span className="text-gray-600 font-mono">{l.count}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3 italic">Note: Derived from submitted challenge location fields. May not reflect complete geographic coverage.</p>
      </SectionCard>

      {/* === MONTHLY TREND === */}
      <SectionCard title="Challenge Submission Trend (Last 6 Months)">
        {!challengeData || challengeData.monthlyTrend.length === 0 ? (
          <EmptyState message="Insufficient historical data for trend analysis." />
        ) : (
          <div className="flex items-end gap-4 h-24">
            {challengeData.monthlyTrend.map((m, i) => {
              const maxCount = Math.max(...challengeData.monthlyTrend.map((x) => x.count));
              const pct = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500">{m.count}</span>
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${Math.max(pct, 4)}px`, maxHeight: '72px' }} />
                  <span className="text-xs text-gray-400">{MONTH_NAMES[m._id.month - 1]}</span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* === PROJECT ANALYTICS === */}
      <SectionCard title="Project Analytics">
        {totalProjects === 0 ? (
          <EmptyState message="No projects created yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Status Breakdown</h4>
              {projectData?.statusBreakdown.map((s) => (
                <BarRow key={s._id} label={s._id} count={s.count} total={totalProjects} color="bg-purple-500" />
              ))}
              <div className="mt-4 p-3 bg-purple-50 rounded text-center">
                <p className="text-xl font-bold text-purple-700">{projectData?.avgProgress ?? 0}%</p>
                <p className="text-xs text-gray-500">Average Progress</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Progress Distribution</h4>
              {projectData?.progressBuckets.map((b) => {
                const key = String(b._id);
                return (
                  <BarRow
                    key={key}
                    label={PROGRESS_LABELS[key] ?? `${key}%`}
                    count={b.count}
                    total={totalProjects}
                    color="bg-emerald-500"
                  />
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* === MILESTONE / DELIVERABLE / REVIEW === */}
      <SectionCard title="Milestones, Deliverables & Reviews">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Milestones</h4>
            {!projectData || projectData.milestoneBreakdown.length === 0 ? (
              <EmptyState message="No milestones recorded." />
            ) : (
              <>
                {projectData.milestoneBreakdown.map((m) => {
                  const total = projectData.milestoneBreakdown.reduce((s, x) => s + x.count, 0);
                  return <BarRow key={m._id} label={m._id} count={m.count} total={total} color="bg-cyan-500" />;
                })}
                {(projectData.overdueMillestones ?? 0) > 0 && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-sm font-medium">
                    ⚠ {projectData.overdueMillestones} overdue milestones
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Deliverables</h4>
            {!projectData || projectData.deliverableBreakdown.length === 0 ? (
              <EmptyState message="No deliverables recorded." />
            ) : (
              <>
                {projectData.deliverableBreakdown.map((d) => {
                  const total = projectData.deliverableBreakdown.reduce((s, x) => s + x.count, 0);
                  return <BarRow key={d._id} label={d._id} count={d.count} total={total} color="bg-amber-500" />;
                })}
              </>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Reviews</h4>
            {!projectData || projectData.reviewBreakdown.length === 0 ? (
              <EmptyState message="No reviews recorded." />
            ) : (
              <>
                {projectData.reviewBreakdown.map((r) => {
                  const total = projectData.reviewBreakdown.reduce((s, x) => s + x.count, 0);
                  return <BarRow key={r._id} label={r._id} count={r.count} total={total} color="bg-rose-500" />;
                })}
              </>
            )}
          </div>
        </div>
      </SectionCard>

      {/* === UNIVERSITY ANALYTICS === */}
      <SectionCard title="University Participation">
        {!universityData ? (
          <EmptyState message="University data unavailable." />
        ) : (
          <>
            <StatGrid items={[
              { label: 'Total Universities', value: universityData.totalUniversities },
              { label: 'Receiving Matches', value: universityData.universitiesWithMatches, color: 'text-blue-700' },
              { label: 'Accepted Challenges', value: universityData.universitiesWithAcceptedChallenges, color: 'text-green-700' },
              { label: 'Active Projects', value: universityData.universitiesWithActiveProjects, color: 'text-purple-700' },
            ]} />

            {universityData.topUniversities.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Top Universities by Activity</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500 uppercase">
                        <th className="pb-2">University</th>
                        <th className="pb-2">Location</th>
                        <th className="pb-2 text-right">Active Projects</th>
                        <th className="pb-2 text-right">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {universityData.topUniversities.map((u) => (
                        <tr key={u.universityId} className="border-b hover:bg-gray-50">
                          <td className="py-2 font-medium">{u.name}</td>
                          <td className="py-2 text-gray-500">{[u.city, u.state].filter(Boolean).join(', ')}</td>
                          <td className="py-2 text-right font-bold text-purple-700">{u.activeProjects}</td>
                          <td className="py-2 text-right text-green-700">{u.completedProjects}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* === INDUSTRY ANALYTICS === */}
      <SectionCard title="Industry Collaboration Analytics">
        {!industryData ? (
          <EmptyState message="Industry data unavailable." />
        ) : (
          <>
            <StatGrid items={[
              { label: 'Industry Orgs', value: industryData.totalOrganizations },
              { label: 'Total Interests', value: totalInterests, color: 'text-amber-700' },
              { label: 'Total Collaborations', value: totalCollabs, color: 'text-green-700' },
              { label: 'Funding (INR)', value: `₹${totalFundingINR.toLocaleString()}`, color: 'text-blue-700' },
            ]} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Interest Status</h4>
                {industryData.interestBreakdown.map((s) => (
                  <BarRow key={s._id} label={s._id} count={s.count} total={totalInterests} color="bg-amber-500" />
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Collaboration Status</h4>
                {industryData.collaborationBreakdown.map((s) => (
                  <BarRow key={s._id} label={s._id} count={s.count} total={totalCollabs} color="bg-green-500" />
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Support Types</h4>
                {industryData.supportTypeDistribution.length === 0 ? (
                  <EmptyState message="No support types recorded." />
                ) : (
                  industryData.supportTypeDistribution.slice(0, 8).map((s) => {
                    const totalSupport = industryData.supportTypeDistribution.reduce((sum, x) => sum + x.count, 0);
                    return <BarRow key={s._id} label={s._id} count={s.count} total={totalSupport} color="bg-indigo-500" />;
                  })
                )}
              </div>
            </div>

            {/* Funding Breakdown */}
            {industryData.fundingBreakdown.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Funding Commitments</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {industryData.fundingBreakdown.map((f) => (
                    <div key={f._id} className="bg-gray-50 border rounded p-3 text-center">
                      <p className="text-lg font-bold">₹{f.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">{f._id} ({f.count})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* === OUTCOME ANALYTICS === */}
      <SectionCard title="Social Impact Outcomes">
        {!outcomeData || outcomeData.total === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 font-medium mb-1">Not reported yet</p>
            <p className="text-gray-400 text-sm">Universities can report project outcomes from the project management portal.</p>
          </div>
        ) : (
          <>
            <StatGrid items={[
              { label: 'Total Outcomes', value: outcomeData.total },
              { label: 'Verified', value: outcomeData.verified, color: 'text-green-700' },
              { label: 'Pending Verification', value: outcomeData.unverified, color: 'text-amber-600' },
            ]} />
            <div className="mt-4 space-y-2">
              {outcomeData.byType.map((o) => (
                <div key={o._id} className="flex justify-between items-center p-3 bg-gray-50 rounded border text-sm">
                  <span className="font-medium">{o._id.replace(/_/g, ' ')}</span>
                  <div className="text-right text-gray-600">
                    <span className="font-mono">{o.totalCurrent} / {o.totalTarget} (target)</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </section>
  );
}
