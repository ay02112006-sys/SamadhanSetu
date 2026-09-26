"use client";
// src/components/ui/Sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface NavItem {
  href: string;
  label: string;
}

const items: NavItem[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/projects', label: 'Projects' },
  { href: '/dashboard/partners', label: 'Partners' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/notifications', label: 'Notifications' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(href);
  return (
    <aside className="sidebar hidden md:block">
      <div className="px-4 mb-6">
        <Link href="/" className="text-xl font-semibold text-primary">
          SamadhanSetu
        </Link>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-md text-sm ${isActive(item.href) ? 'bg-primaryLight text-white' : 'text-muted hover:bg-gray-100 hover:text-primary'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
