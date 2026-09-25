'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function NewTeamForm({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mentor, setMentor] = useState('');
  const [members, setMembers] = useState([{ name: '', role: '', department: '', skills: '' }]);

  const handleAddMember = () => {
    setMembers([...members, { name: '', role: '', department: '', skills: '' }]);
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length === 1) return;
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formattedMembers = members.map(m => ({
      ...m,
      skills: m.skills.split(',').map(s => s.trim()).filter(Boolean)
    }));

    try {
      const res = await fetch('/api/university/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          name,
          description,
          mentor,
          members: formattedMembers
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        router.push('/dashboard/university/teams');
      } else {
        setError(data.error || 'Failed to create team');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded shadow-sm">
      {error && <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Team Name</label>
          <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mentor Name</label>
          <input required type="text" value={mentor} onChange={e => setMentor(e.target.value)} className="w-full border rounded p-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded p-2" rows={3}></textarea>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">Team Members</h3>
        {members.map((member, index) => (
          <div key={index} className="border p-4 rounded mb-4 bg-gray-50 relative">
            {members.length > 1 && (
              <button type="button" onClick={() => handleRemoveMember(index)} className="absolute top-2 right-2 text-red-500 text-sm">Remove</button>
            )}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input required type="text" value={member.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} className="w-full border rounded p-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Role (e.g. Developer, Researcher)</label>
                <input required type="text" value={member.role} onChange={e => handleMemberChange(index, 'role', e.target.value)} className="w-full border rounded p-1.5 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Department</label>
                <input required type="text" value={member.department} onChange={e => handleMemberChange(index, 'department', e.target.value)} className="w-full border rounded p-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Skills (comma separated)</label>
                <input required type="text" value={member.skills} onChange={e => handleMemberChange(index, 'skills', e.target.value)} className="w-full border rounded p-1.5 text-sm" />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" onClick={handleAddMember} className="bg-gray-200 text-black hover:bg-gray-300 text-sm py-1.5">
          + Add Member
        </Button>
      </div>

      <div className="border-t pt-4 flex justify-end">
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? 'Creating...' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}
