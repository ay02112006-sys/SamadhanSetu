// src/components/ui/Navbar.tsx
// Server component — fetches session server-side.
// Logout is delegated to the LogoutButton client component.
// Notification bell is delegated to the NotificationBell client component.
import Link from 'next/link';
import { getServerAuthSession } from '@/lib/auth';
import { LogoutButton } from './LogoutButton';
import { NotificationBell } from './NotificationBell';

// Helper to convert role enum to human-friendly label
const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'CITIZEN':
      return 'Citizen';
    case 'UNIVERSITY':
      return 'University';
    case 'INDUSTRY':
      return 'Industry';
    case 'GOVERNMENT':
      return 'Government';
    default:
      return role;
  }
};

// Named export used by layout.tsx and dashboard/layout.tsx
export async function Navbar() {
  const session = await getServerAuthSession();
  const user = session?.user;
  const isAuthenticated = !!session;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/" className="text-xl font-semibold text-primary">
          SamadhanSetu
        </Link>
      </div>
      <div className="space-x-4 flex items-center">
        {isAuthenticated && user ? (
          <>
            <span className="text-gray-700">{user.name}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {getRoleLabel(user.role)}
            </span>
            <NotificationBell />
            <Link href="/dashboard" className="text-gray-700 hover:text-primary">
              Dashboard
            </Link>
            <Link href="/profile" className="text-gray-700 hover:text-primary">
              Profile
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-700 hover:text-primary">
              Login
            </Link>
            <Link href="/register" className="text-gray-700 hover:text-primary">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// Default export for any consumer that uses default-import syntax
export default Navbar;
