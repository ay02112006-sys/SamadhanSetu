'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ORG_TYPES = ['STARTUP', 'MSME', 'CORPORATE', 'INDUSTRY_PARTNER', 'CSR_ORGANIZATION', 'RESEARCH_ORGANIZATION', 'OTHER'];
const SECTORS = ['AGRICULTURE', 'HEALTHCARE', 'EDTECH', 'FINTECH', 'CLIMATE', 'WATER', 'ENERGY', 'MANUFACTURING', 'AI_ML', 'SOFTWARE', 'INFRASTRUCTURE', 'MOBILITY', 'SOCIAL_IMPACT', 'RURAL_DEVELOPMENT', 'OTHER'];
const CAPABILITIES = ['MENTORSHIP', 'FUNDING', 'PROTOTYPING', 'TESTING', 'TECHNOLOGY', 'PILOT_DEPLOYMENT', 'IMPLEMENTATION', 'MARKET_ACCESS', 'DOMAIN_EXPERTISE', 'OTHER'];

export default function IndustryProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    organizationName: '',
    organizationType: 'STARTUP',
    industrySector: 'SOFTWARE',
    description: '',
    city: '',
    state: '',
    website: '',
    email: '',
    expertise: '',
    technologies: '',
    areasOfInterest: '',
    supportCapabilities: [] as string[],
    companySize: '',
  });

  useEffect(() => {
    fetch('/api/industry/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          const p = d.profile;
          setForm({
            organizationName: p.organizationName ?? '',
            organizationType: p.organizationType ?? 'STARTUP',
            industrySector: p.industrySector ?? 'SOFTWARE',
            description: p.description ?? '',
            city: p.city ?? '',
            state: p.state ?? '',
            website: p.website ?? '',
            email: p.email ?? '',
            expertise: (p.expertise ?? []).join(', '),
            technologies: (p.technologies ?? []).join(', '),
            areasOfInterest: (p.areasOfInterest ?? []).join(', '),
            supportCapabilities: p.supportCapabilities ?? [],
            companySize: p.companySize ?? '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleCapability = (cap: string) => {
    setForm((prev) => ({
      ...prev,
      supportCapabilities: prev.supportCapabilities.includes(cap)
        ? prev.supportCapabilities.filter((c) => c !== cap)
        : [...prev.supportCapabilities, cap],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      expertise: form.expertise.split(',').map((s) => s.trim()).filter(Boolean),
      technologies: form.technologies.split(',').map((s) => s.trim()).filter(Boolean),
      areasOfInterest: form.areasOfInterest.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch('/api/industry/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Profile saved successfully!');
        router.refresh();
      } else {
        setError(data.error ?? 'Failed to save profile');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading profile...</div>;
  }

  return (
    <section className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Organization Profile</h1>
      <p className="text-gray-500 mb-8">Tell universities and the platform about your organization so we can match you with relevant projects.</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Organization Name *</label>
            <input
              required
              type="text"
              value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Technologies Pvt Ltd"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization Type *</label>
            <select
              value={form.organizationType}
              onChange={(e) => setForm({ ...form, organizationType: e.target.value })}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Industry Sector *</label>
            <select
              value={form.industrySector}
              onChange={(e) => setForm({ ...form, industrySector: e.target.value })}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City *</label>
            <input
              required
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="Bengaluru"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">State *</label>
            <input
              required
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="Karnataka"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="partnerships@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company Size</label>
            <select
              value={form.companySize}
              onChange={(e) => setForm({ ...form, companySize: e.target.value })}
              className="w-full border rounded p-2"
            >
              <option value="">Select size</option>
              <option value="1-10">1–10 employees</option>
              <option value="11-50">11–50 employees</option>
              <option value="51-200">51–200 employees</option>
              <option value="201-500">201–500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Describe your organization, its mission, and what it does..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expertise Areas <span className="text-gray-400 font-normal">(comma separated)</span></label>
          <input
            type="text"
            value={form.expertise}
            onChange={(e) => setForm({ ...form, expertise: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="Water purification, IoT sensors, Rural deployment"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Technologies <span className="text-gray-400 font-normal">(comma separated)</span></label>
          <input
            type="text"
            value={form.technologies}
            onChange={(e) => setForm({ ...form, technologies: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="React, Node.js, Machine Learning, IoT"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Areas of Interest <span className="text-gray-400 font-normal">(comma separated)</span></label>
          <input
            type="text"
            value={form.areasOfInterest}
            onChange={(e) => setForm({ ...form, areasOfInterest: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="Clean water access, Rural healthcare, Sustainable agriculture"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Support Capabilities</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CAPABILITIES.map((cap) => (
              <label key={cap} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.supportCapabilities.includes(cap)}
                  onChange={() => toggleCapability(cap)}
                  className="rounded"
                />
                <span className="text-sm">{cap.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-6 rounded font-medium"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </section>
  );
}
