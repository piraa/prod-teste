import React from 'react';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  estimated_minutes: number | null;
  start_time: string | null;
  end_time: string | null;
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