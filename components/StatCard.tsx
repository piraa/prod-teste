import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  trendLabel: string;
  trendColorClass: string; // e.g., 'text-green-500'
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trendLabel, trendColorClass, icon }) => {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="text-primary bg-primary/10 p-2.5 rounded-lg">
           {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendColorClass}`}>
          {trendLabel}
        </span>
      </div>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};