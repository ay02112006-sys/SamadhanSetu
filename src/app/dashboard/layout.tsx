// src/app/dashboard/layout.tsx
import '@/app/globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { Sidebar } from '@/components/ui/Sidebar';
import React from 'react';

export const metadata = {
  title: 'Dashboard - SamadhanSetu',
  description: 'Dashboard overview',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans antialiased h-full bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="p-6 flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
