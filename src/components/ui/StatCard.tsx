// src/components/ui/StatCard.tsx
import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
    <div className="text-2xl font-bold text-primary mb-1">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);
