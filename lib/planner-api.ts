import { supabase } from './supabase';
import {
  AnalyzePrioritiesResponse,
  EstimateDurationsResponse,
  ScheduleTasksResponse,
} from '../types/planner';

interface PlannerApiParams {
  accessToken: string;
  taskIds: string[];
}

interface ScheduleParams extends PlannerApiParams {
  startDate?: string;
  endDate?: string;
  workStartHour?: number;
  workEndHour?: number;
}

async function callPlannerFunction(
  functionName: string,
  args: Record<string, unknown>,
  accessToken: string
): Promise<unknown> {
  // We'll use a direct message that triggers the function
  const message = JSON.stringify({ function: functionName, args });

  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      message: `Execute function: ${functionName} with args: ${JSON.stringify(args)}`,
      context: {
        userName: 'User',
        currentDate: new Date().toISOString().split('T')[0],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function analyzePriorities(
  params: PlannerApiParams
): Promise<AnalyzePrioritiesResponse> {
  const { taskIds, accessToken } = params;

  // Fetch tasks directly from Supabase to analyze
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .in('id', taskIds);

  if (error || !tasks) {
    throw new Error(error?.message || 'Failed to fetch tasks');
  }

  // Analyze priorities based on keywords
  const priorityKeywords = {
    high: ['urgente', 'imediato', 'crítico', 'prazo', 'deadline', 'importante', 'prioridade', 'asap', 'cliente', 'reunião', 'apresentação', 'entrega'],
    medium: ['revisar', 'preparar', 'organizar', 'planejar', 'analisar', 'atualizar', 'email', 'responder'],
    low: ['estudar', 'pesquisar', 'ler', 'aprender', 'opcional', 'quando possível', 'ideias', 'futuro'],
  };

  const suggestions = tasks.map((task) => {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();

    let suggested_priority: 'low' | 'medium' | 'high' = 'medium';
    let reason = 'Prioridade padrão baseada no contexto';

    // Check for high priority keywords
    for (const keyword of priorityKeywords.high) {
      if (text.includes(keyword)) {
        suggested_priority = 'high';
        reason = `Contém palavra-chave de alta prioridade: "${keyword}"`;
        break;
      }
    }

    // Check for low priority keywords (only if not already high)
    if (suggested_priority !== 'high') {
      for (const keyword of priorityKeywords.low) {
        if (text.includes(keyword)) {
          suggested_priority = 'low';
          reason = `Tarefa de desenvolvimento/aprendizado: "${keyword}"`;
          break;
        }
      }
    }

    return {
      task_id: task.id,
      title: task.title,
      suggested_priority,
      reason,
    };
  });

  return { suggestions };
}

export async function estimateDurations(
  params: PlannerApiParams
): Promise<EstimateDurationsResponse> {
  const { taskIds } = params;

  // Fetch tasks directly from Supabase
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .in('id', taskIds);

  if (error || !tasks) {
    throw new Error(error?.message || 'Failed to fetch tasks');
  }

  // Estimate durations based on task complexity
  const durationKeywords = {
    quick: { keywords: ['email', 'responder', 'ligar', 'agendar', 'confirmar', 'enviar', 'verificar'], minutes: 15 },
    short: { keywords: ['revisar', 'ler', 'atualizar', 'organizar', 'limpar'], minutes: 30 },
    medium: { keywords: ['preparar', 'criar', 'escrever', 'analisar', 'planejar', 'configurar'], minutes: 60 },
    long: { keywords: ['desenvolver', 'implementar', 'estudar', 'pesquisar', 'documentar', 'relatório'], minutes: 120 },
  };

  const estimates = tasks.map((task) => {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();

    let estimated_minutes = 45;
    let reason = 'Estimativa padrão para tarefa comum';

    for (const [, config] of Object.entries(durationKeywords)) {
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          estimated_minutes = config.minutes;
          reason = `Baseado na complexidade: "${keyword}"`;
          break;
        }
      }
    }

    // Adjust based on description length
    if (task.description && task.description.length > 100) {
      estimated_minutes = Math.round(estimated_minutes * 1.5);
      reason += ' (ajustado por descrição detalhada)';
    }

    return {
      task_id: task.id,
      title: task.title,
      estimated_minutes,
      reason,
    };
  });

  return { estimates };
}

export async function scheduleTasks(
  params: ScheduleParams
): Promise<ScheduleTasksResponse> {
  const {
    taskIds,
    startDate = new Date().toISOString().split('T')[0],
    endDate,
    workStartHour = 9,
    workEndHour = 18,
  } = params;

  // Calculate end date (7 days from start if not provided)
  const finalEndDate = endDate || (() => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 7);
    return end.toISOString().split('T')[0];
  })();

  // Fetch tasks to schedule
  const { data: tasks, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .in('id', taskIds);

  if (fetchError || !tasks) {
    throw new Error(fetchError?.message || 'Failed to fetch tasks');
  }

  // Fetch existing scheduled tasks to avoid conflicts
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('*')
    .gte('due_date', startDate)
    .lte('due_date', finalEndDate)
    .not('start_time', 'is', null);

  // Build a map of occupied time slots per day
  const occupiedSlots: Record<string, { start: number; end: number }[]> = {};
  (existingTasks || []).forEach((task) => {
    if (!task.due_date || !task.start_time) return;
    const dateKey = task.due_date.split('T')[0];
    if (!occupiedSlots[dateKey]) occupiedSlots[dateKey] = [];

    const startHour = parseInt(task.start_time.split(':')[0]);
    const endHour = task.end_time ? parseInt(task.end_time.split(':')[0]) : startHour + 1;
    occupiedSlots[dateKey].push({ start: startHour, end: endHour });
  });

  // Sort tasks by priority (high first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...tasks].sort((a, b) =>
    (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) -
    (priorityOrder[b.priority as keyof typeof priorityOrder] || 1)
  );

  // Schedule tasks
  const schedule: ScheduleTasksResponse['schedule'] = [];
  let currentDate = new Date(startDate);
  const maxDate = new Date(finalEndDate);

  for (const task of sortedTasks) {
    const duration = task.estimated_minutes || 60;
    const durationHours = Math.ceil(duration / 60);

    let scheduled = false;
    const taskCurrentDate = new Date(startDate);

    while (taskCurrentDate <= maxDate && !scheduled) {
      const dateKey = taskCurrentDate.toISOString().split('T')[0];
      const daySlots = occupiedSlots[dateKey] || [];

      for (let hour = workStartHour; hour + durationHours <= workEndHour; hour++) {
        const isOccupied = daySlots.some(slot =>
          (hour >= slot.start && hour < slot.end) ||
          (hour + durationHours > slot.start && hour + durationHours <= slot.end) ||
          (hour <= slot.start && hour + durationHours >= slot.end)
        );

        if (!isOccupied) {
          const start_time = `${hour.toString().padStart(2, '0')}:00`;
          const endHour = hour + durationHours;
          const end_time = `${endHour.toString().padStart(2, '0')}:00`;

          schedule.push({
            task_id: task.id,
            due_date: dateKey,
            start_time,
            end_time,
          });

          if (!occupiedSlots[dateKey]) occupiedSlots[dateKey] = [];
          occupiedSlots[dateKey].push({ start: hour, end: endHour });

          scheduled = true;
          break;
        }
      }

      if (!scheduled) {
        taskCurrentDate.setDate(taskCurrentDate.getDate() + 1);
      }
    }
  }

  return { schedule };
}
