'use client';
// src/components/ui/LogoutButton.tsx
// Tiny client component that handles NextAuth sign-out.
// Kept separate so Navbar itself remains a server component.
import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-gray-700 hover:text-primary"
    >
      Logout
    </button>
  );
}
