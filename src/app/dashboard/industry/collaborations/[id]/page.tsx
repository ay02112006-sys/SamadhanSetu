'use client';

import { useState, useEffect } from 'react';

type Collaboration = {
  collaborationId: string;
  projectId: string;
  universityId: string;
  status: string;
  supportTypes: string[];
  scope: string;
  objectives: string;
  startDate: string;
  targetDate?: string;
};

type Activity = {
  activityId: string;
  type: string;
  title: string;
  description: string;
  status: string;
  actorName: string;
  createdAt: string;
};

type Funding = {
  fundingId: string;
  amount: number;
  currency: string;
  purpose: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function CollaborationDetailPage({ params }: { params: { id: string } }) {
  const collaborationId = params.id;
  const [collab, setCollab] = useState<Collaboration | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [funding, setFunding] = useState<Funding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activities' | 'funding'>('activities');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showFundingForm, setShowFundingForm] = useState(false);

  // Activity form
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actType, setActType] = useState('MENTORSHIP_SESSION');

  // Funding form
  const [fundAmount, setFundAmount] = useState('');
  const [fundCurrency, setFundCurrency] = useState('INR');
  const [fundPurpose, setFundPurpose] = useState('');

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [collabRes, actRes, fundRes] = await Promise.all([
        fetch(`/api/industry/collaborations/${collaborationId}`),
        fetch(`/api/industry/collaborations/${collaborationId}/activities`),
        fetch(`/api/industry/collaborations/${collaborationId}/funding`),
      ]);
      const [collabData, actData, fundData] = await Promise.all([
        collabRes.json(),
        actRes.json(),
        fundRes.json(),
      ]);

      setCollab(collabData.collaboration ?? null);
      setActivities(actData.activities ?? []);
      setFunding(fundData.funding ?? []);
      setLoading(false);
    };
    load();
  }, [collaborationId]);

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    const res = await fetch(`/api/industry/collaborations/${collaborationId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: actType, title: actTitle, description: actDesc }),
    });
    const data = await res.json();
    if (res.ok) {
      setActivities((prev) => [data.activity, ...prev]);
      setShowActivityForm(false);
      setActTitle(''); setActDesc(''); setActType('MENTORSHIP_SESSION');
    } else {
      setFormError(data.error ?? 'Failed to create activity');
    }
    setFormLoading(false);
  };

  const submitFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    const res = await fetch(`/api/industry/collaborations/${collaborationId}/funding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(fundAmount), currency: fundCurrency, purpose: fundPurpose }),
    });
    const data = await res.json();
    if (res.ok) {
      setFunding((prev) => [data.funding, ...prev]);
      setShowFundingForm(false);
      setFundAmount(''); setFundPurpose('');
    } else {
      setFormError(data.error ?? 'Failed to record funding');
    }
    setFormLoading(false);
  };

  if (loading) return <div className="p-8 text-gray-400">Loading collaboration...</div>;
  if (!collab) return <div className="p-8 text-red-500">Collaboration not found.</div>;

  return (
    <section className="p-8 max-w-4xl mx-auto">
      <a href="/dashboard/industry/collaborations" className="text-sm text-blue-600 hover:underline mb-6 block">← Back to Collaborations</a>

      <div className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
          <div>
            <span className="text-xs font-mono text-gray-400 block mb-1">{collab.collaborationId}</span>
            <h1 className="text-2xl font-bold">Collaboration</h1>
            <p className="text-sm text-gray-600 mt-1">Project: {collab.projectId}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded font-medium ${STATUS_COLORS[collab.status] ?? 'bg-gray-100'}`}>
            {collab.status}
          </span>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Scope</h3>
            <p className="text-gray-700 text-sm">{collab.scope}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Support Types</h3>
            <div className="flex flex-wrap gap-1">
              {collab.supportTypes.map((t) => (
                <span key={t} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">Started: {new Date(collab.startDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex border-b mb-6">
          {(['activities', 'funding'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">{formError}</div>}

        {activeTab === 'activities' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Support Activities</h3>
              <button onClick={() => setShowActivityForm(!showActivityForm)} className="text-sm bg-gray-900 text-white py-1.5 px-3 rounded hover:bg-gray-700">+ Add Activity</button>
            </div>

            {showActivityForm && (
              <form onSubmit={submitActivity} className="mb-6 p-4 bg-gray-50 rounded border space-y-3">
                <select value={actType} onChange={(e) => setActType(e.target.value)} className="w-full border rounded p-2 text-sm">
                  {['MENTORSHIP_SESSION', 'FUNDING_COMMITMENT', 'PROTOTYPE_SUPPORT', 'TESTING_SUPPORT', 'TECHNOLOGY_SUPPORT', 'PILOT_SUPPORT', 'IMPLEMENTATION_SUPPORT', 'OTHER'].map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <input required value={actTitle} onChange={(e) => setActTitle(e.target.value)} placeholder="Title" className="w-full border rounded p-2 text-sm" />
                <textarea required value={actDesc} onChange={(e) => setActDesc(e.target.value)} placeholder="Description" rows={2} className="w-full border rounded p-2 text-sm" />
                <div className="flex gap-2">
                  <button type="submit" disabled={formLoading} className="bg-blue-600 text-white py-1.5 px-4 rounded text-sm disabled:opacity-50">Add</button>
                  <button type="button" onClick={() => setShowActivityForm(false)} className="border py-1.5 px-3 rounded text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            )}

            {activities.length === 0 ? (
              <p className="text-gray-400 text-sm">No activities yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.activityId} className="border rounded p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{act.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{act.type.replace(/_/g, ' ')} · {act.actorName}</p>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{act.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{act.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'funding' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Funding Commitments</h3>
              <button onClick={() => setShowFundingForm(!showFundingForm)} className="text-sm bg-gray-900 text-white py-1.5 px-3 rounded hover:bg-gray-700">+ Record Funding</button>
            </div>

            {showFundingForm && (
              <form onSubmit={submitFunding} className="mb-6 p-4 bg-gray-50 rounded border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" min="1" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="Amount" className="border rounded p-2 text-sm" />
                  <select value={fundCurrency} onChange={(e) => setFundCurrency(e.target.value)} className="border rounded p-2 text-sm">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <input required value={fundPurpose} onChange={(e) => setFundPurpose(e.target.value)} placeholder="Purpose" className="w-full border rounded p-2 text-sm" />
                <div className="flex gap-2">
                  <button type="submit" disabled={formLoading} className="bg-blue-600 text-white py-1.5 px-4 rounded text-sm disabled:opacity-50">Record</button>
                  <button type="button" onClick={() => setShowFundingForm(false)} className="border py-1.5 px-3 rounded text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            )}

            {funding.length === 0 ? (
              <p className="text-gray-400 text-sm">No funding commitments recorded.</p>
            ) : (
              <div className="space-y-3">
                {funding.map((f) => (
                  <div key={f.fundingId} className="border rounded p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{f.currency} {f.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{f.purpose}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{f.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
