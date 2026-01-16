import { Task } from '../types';

export type PlannerStep = 1 | 2 | 3;

export interface PrioritySuggestion {
  taskId: string;
  title: string;
  currentPriority: 'low' | 'medium' | 'high';
  suggestedPriority: 'low' | 'medium' | 'high';
  reason: string;
}

export interface DurationEstimate {
  taskId: string;
  title: string;
  currentMinutes: number | null;
  suggestedMinutes: number;
  reason: string;
}

export interface ScheduleSuggestion {
  taskId: string;
  title: string;
  dueDate: string;
  startTime: string;
  endTime: string;
}

export interface PlannerState {
  step: PlannerStep;
  selectedTasks: Task[];
  priorities: Record<string, PrioritySuggestion>;
  estimates: Record<string, DurationEstimate>;
  schedule: Record<string, ScheduleSuggestion>;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

export interface TaskUpdate {
  taskId: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
}

// API Response types
export interface AnalyzePrioritiesResponse {
  suggestions: Array<{
    task_id: string;
    title: string;
    suggested_priority: 'low' | 'medium' | 'high';
    reason: string;
  }>;
}

export interface EstimateDurationsResponse {
  estimates: Array<{
    task_id: string;
    title: string;
    estimated_minutes: number;
    reason: string;
  }>;
}

export interface ScheduleTasksResponse {
  schedule: Array<{
    task_id: string;
    due_date: string;
    start_time: string;
    end_time: string;
  }>;
}
