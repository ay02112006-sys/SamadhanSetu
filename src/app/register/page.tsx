"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name')).trim();
    const email = String(formData.get('email')).trim();
    const password = String(formData.get('password'));
    const confirmPassword = String(formData.get('confirmPassword'));
    const roleLabel = String(formData.get('role'));
    if (!name || !email || !password || !confirmPassword || !roleLabel) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // Map human-friendly role to canonical uppercase role
    const roleMap: Record<string, string> = {
      Citizen: 'CITIZEN',
      University: 'UNIVERSITY',
      Industry: 'INDUSTRY',
      Government: 'GOVERNMENT',
    };
    const role = roleMap[roleLabel];
    if (!role) {
      setError('Invalid role selected');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        setSuccess('Account created successfully. You can now log in.');
        // Optionally redirect to login after a short delay
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Create Account</h2>
        {error && <div className="mb-4 text-sm text-red-600" role="alert">{error}</div>}
        {success && <div className="mb-4 text-sm text-green-600" role="status">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
            <input id="name" name="name" type="text" required disabled={loading} className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input id="email" name="email" type="email" required disabled={loading} className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input id="password" name="password" type="password" required disabled={loading} className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required disabled={loading} className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
            <select id="role" name="role" required disabled={loading} className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select a role</option>
              <option value="Citizen">Citizen</option>
              <option value="University">University</option>
              <option value="Industry">Industry</option>
              <option value="Government">Government</option>
            </select>
          </div>
          <Button type="submit" variant="primary" className="w-full mb-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
          <p className="text-xs text-gray-600 text-center mt-2">Registration will be connected in the next development phase.</p>
          <p className="text-center mt-4">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
