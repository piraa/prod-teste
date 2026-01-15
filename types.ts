import React from 'react';

export interface Task {
  id: string;
  title: string;
  category: string;
  time: string;
  completed: boolean;
  tag?: {
    label: string;
    color: 'green' | 'amber' | 'blue' | 'slate';
  };
}

export interface Habit {
  id: string;
  title: string;
  meta: string;
  history: boolean[]; // true = completed, false = not completed/pending
}

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit?: string;
}

export interface Stat {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  trendColor?: string;
  iconColor?: string;
}