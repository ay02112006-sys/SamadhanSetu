'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { UniversityProfile } from '@/types/university';

export default function ProfileForm({ initialProfile }: { initialProfile?: UniversityProfile }) {
  const [profile, setProfile] = useState<UniversityProfile>({
    universityName: initialProfile?.universityName || '',
    city: initialProfile?.city || '',
    state: initialProfile?.state || '',
    description: initialProfile?.description || '',
    disciplines: initialProfile?.disciplines || [],
    researchAreas: initialProfile?.researchAreas || [],
    expertise: initialProfile?.expertise || [],
    innovationCenters: initialProfile?.innovationCenters || [],
    website: initialProfile?.website || '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof UniversityProfile) => {
    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setProfile({ ...profile, [field]: arr });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/university/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded shadow-sm">
      {message && <div className="p-3 bg-green-50 text-green-700 rounded">{message}</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">University Name</label>
        <input required type="text" name="universityName" value={profile.universityName} onChange={handleChange} className="w-full border rounded p-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input required type="text" name="city" value={profile.city} onChange={handleChange} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input required type="text" name="state" value={profile.state} onChange={handleChange} className="w-full border rounded p-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea required name="description" value={profile.description} onChange={handleChange} className="w-full border rounded p-2" rows={3}></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Disciplines (comma separated)</label>
        <input required type="text" value={profile.disciplines.join(', ')} onChange={e => handleArrayChange(e, 'disciplines')} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Research Areas (comma separated)</label>
        <input type="text" value={profile.researchAreas.join(', ')} onChange={e => handleArrayChange(e, 'researchAreas')} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Expertise (comma separated)</label>
        <input type="text" value={profile.expertise.join(', ')} onChange={e => handleArrayChange(e, 'expertise')} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Innovation Centers (comma separated)</label>
        <input type="text" value={profile.innovationCenters.join(', ')} onChange={e => handleArrayChange(e, 'innovationCenters')} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Website URL</label>
        <input type="url" name="website" value={profile.website} onChange={handleChange} className="w-full border rounded p-2" />
      </div>

      <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</Button>
    </form>
  );
}
