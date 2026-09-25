'use client';

import { useState, useEffect } from 'react';

type Preferences = {
  challengeUpdates: boolean;
  projectUpdates: boolean;
  collaborationUpdates: boolean;
  fundingUpdates: boolean;
  systemUpdates: boolean;
};

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPrefs(d.preferences);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof Preferences) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Preferences saved successfully.');
      } else {
        setMessage('Failed to save preferences.');
      }
    } catch {
      setMessage('Network error while saving.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading preferences...</div>;
  if (!prefs) return <div className="p-8 text-center text-red-500">Failed to load preferences.</div>;

  const toggles = [
    { key: 'challengeUpdates', label: 'Challenge Updates', desc: 'Alerts when your challenges are updated, analyzed by AI, or matched.' },
    { key: 'projectUpdates', label: 'Project Updates', desc: 'Notifications about project status changes, milestones, and deliverables.' },
    { key: 'collaborationUpdates', label: 'Collaboration Updates', desc: 'Alerts for industry interests, collaborations, and support activities.' },
    { key: 'fundingUpdates', label: 'Funding Updates', desc: 'Notifications regarding funding commitments and tracking.' },
    { key: 'systemUpdates', label: 'System Updates', desc: 'Critical alerts and platform-wide notifications.' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
      <p className="text-gray-600 mb-8">Control what alerts you receive in the platform.</p>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="divide-y divide-gray-100">
          {toggles.map(({ key, label, desc }) => (
            <div key={key} className="p-5 flex items-center justify-between hover:bg-gray-50">
              <div className="pr-4">
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={prefs[key as keyof Preferences]}
                  onChange={() => handleChange(key as keyof Preferences)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-sm ${message.includes('error') || message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
