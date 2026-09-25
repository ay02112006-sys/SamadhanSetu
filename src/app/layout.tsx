// src/app/layout.tsx
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';

export const metadata = {
  title: 'SamadhanSetu',
  description: 'From Local Problems to Lasting Solutions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans antialiased h-full bg-gray-50">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
