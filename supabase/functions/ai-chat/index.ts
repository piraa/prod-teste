import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Gemini API via REST (mais confiável que SDK no Deno)
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Function declarations for Gemini
const functionDeclarations = [
  // QUERY FUNCTIONS
  {
    name: 'get_tasks',
    description: 'Retrieve user tasks. Can filter by single date, date range, completion status, or priority.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Filter by specific date (YYYY-MM-DD). Use "today", "tomorrow", "this_week", "next_week", "this_month".' },
        start_date: { type: 'string', description: 'Start date for range filter (YYYY-MM-DD). Use with end_date for custom ranges.' },
        end_date: { type: 'string', description: 'End date for range filter (YYYY-MM-DD). Use with start_date for custom ranges.' },
        completed: { type: 'boolean', description: 'Filter by completion status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filter by priority' },
        limit: { type: 'number', description: 'Maximum number of tasks to return' },
      },
    },
  },
  {
    name: 'get_habits',
    description: 'Retrieve user habits and their current progress.',
    parameters: {
      type: 'object',
      properties: {
        include_logs: { type: 'boolean', description: 'Include habit logs for progress calculation' },
      },
    },
  },
  {
    name: 'get_habit_stats',
    description: 'Get statistics for a specific habit including streak and goal progress.',
    parameters: {
      type: 'object',
      properties: {
        habit_title: { type: 'string', description: 'Title of the habit to get stats for' },
      },
      required: ['habit_title'],
    },
  },

  // CREATE FUNCTIONS
  {
    name: 'create_task',
    description: 'Create a new task for the user.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Task priority. Default is medium.' },
        due_date: { type: 'string', description: 'Due date (YYYY-MM-DD). Use "today" or "tomorrow" as shortcuts.' },
        estimated_minutes: { type: 'number', description: 'Estimated time in minutes' },
        start_time: { type: 'string', description: 'Start time (HH:MM)' },
        end_time: { type: 'string', description: 'End time (HH:MM)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_habit',
    description: 'Create a new habit for the user.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Habit title' },
        description: { type: 'string', description: 'Habit description' },
        frequency: { type: 'string', enum: ['daily', 'weekdays', 'custom'], description: 'How often the habit should be done' },
        target_days: {
          type: 'array',
          items: { type: 'string', enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          description: 'For custom frequency, specify which days'
        },
        goal_target: { type: 'number', description: 'Goal target count' },
        goal_period: { type: 'string', enum: ['weekly', 'monthly', 'yearly'], description: 'Period for the goal' },
      },
      required: ['title', 'frequency'],
    },
  },

  // UPDATE FUNCTIONS
  {
    name: 'complete_task',
    description: 'Mark a task as completed.',
    parameters: {
      type: 'object',
      properties: {
        task_title: { type: 'string', description: 'Title of the task to complete (partial match)' },
        task_id: { type: 'string', description: 'Task ID if known' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task. Can update title, description, priority, due date, times, and estimated duration.',
    parameters: {
      type: 'object',
      properties: {
        task_title: { type: 'string', description: 'Title of the task to update (partial match)' },
        task_id: { type: 'string', description: 'Task ID if known' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        due_date: { type: 'string', description: 'New due date (YYYY-MM-DD)' },
        start_time: { type: 'string', description: 'Start time (HH:MM format, e.g., "14:00")' },
        end_time: { type: 'string', description: 'End time (HH:MM format, e.g., "15:30")' },
        estimated_minutes: { type: 'number', description: 'Estimated duration in minutes' },
        completed: { type: 'boolean', description: 'Completion status' },
      },
    },
  },
  {
    name: 'log_habit',
    description: 'Log a habit as completed for a specific date.',
    parameters: {
      type: 'object',
      properties: {
        habit_title: { type: 'string', description: 'Title of the habit (partial match)' },
        date: { type: 'string', description: 'Date to log (YYYY-MM-DD). Defaults to today.' },
        completed: { type: 'boolean', description: 'Whether the habit was completed. Defaults to true.' },
      },
      required: ['habit_title'],
    },
  },

  // DELETE FUNCTIONS
  {
    name: 'delete_task',
    description: 'Delete a task.',
    parameters: {
      type: 'object',
      properties: {
        task_title: { type: 'string', description: 'Title of the task to delete (partial match)' },
        task_id: { type: 'string', description: 'Task ID if known' },
      },
    },
  },
  {
    name: 'delete_habit',
    description: 'Deactivate a habit (soft delete).',
    parameters: {
      type: 'object',
      properties: {
        habit_title: { type: 'string', description: 'Title of the habit to delete (partial match)' },
      },
      required: ['habit_title'],
    },
  },
];

function getSystemPrompt(context: { userName: string; currentDate: string; timezone: string }): string {
  return `Voce e o assistente de produtividade Produtivo.AI. Voce ajuda o usuario ${context.userName} a gerenciar suas tarefas e habitos.

CONTEXTO:
- Data atual: ${context.currentDate}
- Fuso horario: ${context.timezone}
- Idioma preferido: Portugues do Brasil

INSTRUCOES:
1. Sempre responda em portugues brasileiro de forma amigavel e concisa.
2. Quando o usuario pedir informacoes sobre tarefas ou habitos, use as funcoes de consulta apropriadas.
3. Quando o usuario pedir para criar, editar ou excluir algo, use as funcoes de modificacao.
4. Interprete datas relativas como "amanha", "proxima semana", "hoje" corretamente.
5. Confirme acoes realizadas de forma breve.
6. Se houver ambiguidade (ex: multiplas tarefas com nomes similares), peca esclarecimento.
7. Seja proativo em sugerir melhorias de produtividade quando apropriado.

CAPACIDADES:
- Consultar tarefas (por data, status, prioridade)
- Criar novas tarefas
- Marcar tarefas como concluidas
- Atualizar detalhes de tarefas
- Excluir tarefas
- Consultar habitos e seu progresso
- Registrar conclusao de habitos
- Criar novos habitos
- Ver estatisticas de habitos (streak, meta)

EXEMPLOS DE INTERACOES:
- "Quantas tarefas tenho para hoje?" -> Usa get_tasks com date="today"
- "Crie uma tarefa para amanha: Reuniao com cliente" -> Usa create_task
- "Marque meu treino de hoje como feito" -> Usa log_habit
- "Como esta meu progresso no habito de meditacao?" -> Usa get_habit_stats`;
}

function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;

  const today = new Date();

  if (dateStr === 'today' || dateStr === 'hoje') {
    return today.toISOString().split('T')[0];
  }

  if (dateStr === 'tomorrow' || dateStr === 'amanha') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Try parsing as date string
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Ignore parsing errors
  }

  return dateStr;
}

function parseDateRange(dateStr: string): { start: string; end: string } | null {
  const today = new Date();

  if (dateStr === 'this_week' || dateStr === 'esta_semana') {
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
    };
  }

  if (dateStr === 'next_week' || dateStr === 'proxima_semana' || dateStr === 'semana_que_vem') {
    const startOfNextWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfNextWeek.setDate(today.getDate() - dayOfWeek + 7);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    return {
      start: startOfNextWeek.toISOString().split('T')[0],
      end: endOfNextWeek.toISOString().split('T')[0],
    };
  }

  if (dateStr === 'this_month' || dateStr === 'este_mes') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0],
    };
  }

  if (dateStr === 'next_7_days' || dateStr === 'proximos_7_dias') {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    return {
      start: today.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }

  return null;
}

interface FunctionResult {
  name: string;
  response: Record<string, unknown>;
  action: {
    type: string;
    entity: string;
    description: string;
    status: 'success' | 'error';
  };
}

async function executeFunction(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<FunctionResult> {
  switch (name) {
    case 'get_tasks': {
      let query = supabase.from('tasks').select('*').eq('user_id', userId);

      // Check for date range shortcuts first
      if (args.date) {
        const dateRange = parseDateRange(args.date as string);
        if (dateRange) {
          query = query.gte('due_date', dateRange.start).lte('due_date', dateRange.end);
        } else {
          const date = parseDate(args.date as string);
          if (date) query = query.eq('due_date', date);
        }
      }
      // Check for explicit date range
      if (args.start_date && args.end_date) {
        const startDate = parseDate(args.start_date as string);
        const endDate = parseDate(args.end_date as string);
        if (startDate && endDate) {
          query = query.gte('due_date', startDate).lte('due_date', endDate);
        }
      }
      if (args.completed !== undefined) {
        query = query.eq('completed', args.completed);
      }
      if (args.priority) {
        query = query.eq('priority', args.priority);
      }

      const { data, error } = await query.order('due_date', { ascending: true }).limit(args.limit as number || 50);

      return {
        name,
        response: error ? { error: error.message } : { tasks: data, count: data?.length || 0 },
        action: {
          type: 'query',
          entity: 'task',
          description: 'Consultando tarefas',
          status: error ? 'error' : 'success',
        },
      };
    }

    case 'get_habits': {
      const { data: habits, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        return {
          name,
          response: { error: error.message },
          action: { type: 'query', entity: 'habit', description: 'Consultando habitos', status: 'error' },
        };
      }

      let logs: unknown[] = [];
      if (args.include_logs && habits && habits.length > 0) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('logged_date', startOfMonth.toISOString().split('T')[0]);
        logs = logsData || [];
      }

      return {
        name,
        response: { habits, logs, count: habits?.length || 0 },
        action: { type: 'query', entity: 'habit', description: 'Consultando habitos', status: 'success' },
      };
    }

    case 'get_habit_stats': {
      const { data: habit, error: findError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .ilike('title', `%${args.habit_title}%`)
        .single();

      if (findError || !habit) {
        return {
          name,
          response: { error: 'Habito nao encontrado' },
          action: { type: 'query', entity: 'habit', description: `Habito "${args.habit_title}" nao encontrado`, status: 'error' },
        };
      }

      // Get logs for streak calculation
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habit.id)
        .eq('completed', true)
        .order('logged_date', { ascending: false });

      // Calculate streak
      let streak = 0;
      const today = new Date();
      const checkDate = new Date(today);

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasLog = logs?.some((log: { logged_date: string }) => log.logged_date === dateStr);

        if (hasLog) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (dateStr === today.toISOString().split('T')[0]) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        } else {
          break;
        }
      }

      // Calculate goal progress
      let goalProgress = null;
      if (habit.goal_target && habit.goal_period) {
        let startDate: Date;
        if (habit.goal_period === 'weekly') {
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
        } else if (habit.goal_period === 'yearly') {
          startDate = new Date(today.getFullYear(), 0, 1);
        } else {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        const completedCount = logs?.filter((log: { logged_date: string }) =>
          log.logged_date >= startDate.toISOString().split('T')[0]
        ).length || 0;

        goalProgress = {
          current: completedCount,
          target: habit.goal_target,
          period: habit.goal_period,
        };
      }

      return {
        name,
        response: { habit: habit.title, streak, goalProgress, totalCompletions: logs?.length || 0 },
        action: { type: 'query', entity: 'habit', description: `Estatisticas de "${habit.title}"`, status: 'success' },
      };
    }

    case 'create_task': {
      const dueDate = parseDate(args.due_date as string);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: args.title,
          description: args.description || null,
          priority: args.priority || 'medium',
          due_date: dueDate,
          estimated_minutes: args.estimated_minutes || null,
          start_time: args.start_time || null,
          end_time: args.end_time || null,
          completed: false,
        })
        .select()
        .single();

      return {
        name,
        response: error ? { error: error.message } : { task: data, success: true },
        action: {
          type: 'create',
          entity: 'task',
          description: `Criando tarefa: ${args.title}`,
          status: error ? 'error' : 'success',
        },
      };
    }

    case 'create_habit': {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          title: args.title,
          description: args.description || null,
          frequency: args.frequency,
          target_days: args.target_days || null,
          goal_target: args.goal_target || null,
          goal_period: args.goal_period || null,
          color: 'primary',
          is_active: true,
        })
        .select()
        .single();

      return {
        name,
        response: error ? { error: error.message } : { habit: data, success: true },
        action: {
          type: 'create',
          entity: 'habit',
          description: `Criando habito: ${args.title}`,
          status: error ? 'error' : 'success',
        },
      };
    }

    case 'complete_task': {
      // Find task by title or id
      let query = supabase.from('tasks').select('*').eq('user_id', userId).eq('completed', false);

      if (args.task_id) {
        query = query.eq('id', args.task_id);
      } else if (args.task_title) {
        query = query.ilike('title', `%${args.task_title}%`);
      }

      const { data: tasks, error: findError } = await query;

      if (findError || !tasks || tasks.length === 0) {
        return {
          name,
          response: { error: 'Tarefa nao encontrada' },
          action: { type: 'update', entity: 'task', description: 'Tarefa nao encontrada', status: 'error' },
        };
      }

      const task = tasks[0];
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', task.id)
        .select()
        .single();

      return {
        name,
        response: error ? { error: error.message } : { task: data, success: true },
        action: {
          type: 'update',
          entity: 'task',
          description: `Completando: ${task.title}`,
          status: error ? 'error' : 'success',
        },
      };
    }

    case 'update_task': {
      // Find task
      let query = supabase.from('tasks').select('*').eq('user_id', userId);

      if (args.task_id) {
        query = query.eq('id', args.task_id);
      } else if (args.task_title) {
        query = query.ilike('title', `%${args.task_title}%`);
      }

      const { data: tasks, error: findError } = await query;

      if (findError || !tasks || tasks.length === 0) {
        return {
          name,
          response: { error: 'Tarefa nao encontrada' },
          action: { type: 'update', entity: 'task', description: 'Tarefa nao encontrada', status: 'error' },
        };
      }

      const task = tasks[0];
      const updates: Record<string, unknown> = {};
      if (args.title) updates.title = args.title;
      if (args.description !== undefined) updates.description = args.description;
      if (args.priority) updates.priority = args.priority;
      if (args.due_date) updates.due_date = parseDate(args.due_date as string);
      if (args.start_time !== undefined) updates.start_time = args.start_time;
      if (args.end_time !== undefined) updates.end_time = args.end_time;
      if (args.estimated_minutes !== undefined) updates.estimated_minutes = args.estimated_minutes;
      if (args.completed !== undefined) {
        updates.completed = args.completed;
        if (args.completed) updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id)
        .select()
        .single();

      return {
        name,
        response: error ? { error: error.message } : { task: data, success: true },
        action: {
          type: 'update',
          entity: 'task',
          description: `Atualizando: ${task.title}`,
          status: error ? 'error' : 'success',
        },
      };
    }

    case 'log_habit': {
      // Find habit
      const { data: habit, error: findError } = await supabase
        .from('habits')
        .select('id, title')
        .eq('user_id', userId)
        .eq('is_active', true)
        .ilike('title', `%${args.habit_title}%`)
        .single();

      if (findError || !habit) {
        return {
          name,
          response: { error: 'Habito nao encontrado' },
          action: { type: 'update', entity: 'habit_log', description: `Habito "${args.habit_title}" nao encontrado`, status: 'error' },
        };
      }

      const date = parseDate(args.date as string) || new Date().toISOString().split('T')[0];
      const completed = args.completed !== false;

      const { data, error } = await supabase
        .from('habit_logs')
        .upsert({
          habit_id: habit.id,
          user_id: userId,
          logged_date: date,
          completed,
        }, {
          onConflict: 'habit_id,logged_date',
        })
        .select()
        .single();

      return {
        name,
        response: error ? { error: error.message } : { log: data, success: true },
        action: {
          type: 'update',
          entity: 'habit_log',
          description: `Registrando: ${habit.title}`,
          status: error ? 'error' : 'success',
        },
      };
    }

    case 'delete_task': {
      // Find task
      let query = supabase.from('tasks').select('*').eq('user_id', userId);

      if (args.task_id) {
        query = query.eq('id', args.task_id);
      } else if (args.task_title) {
        query = query.ilike('title', `%${args.task_title}%`);
      }

      const { data: tasks, error: findError } = await query;

      if (findError || !tasks || tasks.length === 0) {
        return {
          name,
          response: { error: 'Tarefa nao encontrada' },
          action: { type: 'delete', entity: 'task', description: 'Tarefa nao encontrada', status: 'error' },
        };
      }

      const task = tasks[0];
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);

      return {
        name,
        response: error ? { error: error.message } : { success: true, deletedTask: task.title },
        action: {
          type: 'delete',
          entity: 'task',
          description: `Excluindo: ${task.title}`,
          status: error ? 'error' : 'success',
        },
      };
    }

    case 'delete_habit': {
      // Soft delete - set is_active to false
      const { data: habit, error: findError } = await supabase
        .from('habits')
        .select('id, title')
        .eq('user_id', userId)
        .eq('is_active', true)
        .ilike('title', `%${args.habit_title}%`)
        .single();

      if (findError || !habit) {
        return {
          name,
          response: { error: 'Habito nao encontrado' },
          action: { type: 'delete', entity: 'habit', description: `Habito "${args.habit_title}" nao encontrado`, status: 'error' },
        };
      }

      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habit.id);

      return {
        name,
        response: error ? { error: error.message } : { success: true, deletedHabit: habit.title },
        action: {
          type: 'delete',
          entity: 'habit',
          description: `Excluindo: ${habit.title}`,
          status: error ? 'error' : 'success',
        },
      };
    }

    default:
      return {
        name,
        response: { error: `Unknown function: ${name}` },
        action: { type: 'unknown', entity: 'unknown', description: `Funcao desconhecida: ${name}`, status: 'error' },
      };
  }
}

async function fetchUpdatedData(userId: string, supabase: ReturnType<typeof createClient>) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [tasksResult, habitsResult, logsResult] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId).order('due_date', { ascending: true }),
    supabase.from('habits').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('habit_logs').select('*').eq('user_id', userId).gte('logged_date', startOfMonth.toISOString().split('T')[0]),
  ]);

  return {
    tasks: tasksResult.data || [],
    habits: habitsResult.data || [],
    habitLogs: logsResult.data || [],
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request
    const { message, history, context } = await req.json();

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Build Gemini request
    const geminiUrl = `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Build conversation contents
    const contents = [
      ...(history || []).map((h: { role: string; parts: { text: string }[] }) => ({
        role: h.role,
        parts: h.parts,
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const actions: FunctionResult['action'][] = [];
    let hasDataChanges = false;
    let responseText = '';

    // 4. Make initial request to Gemini
    let geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: [{ functionDeclarations }],
        systemInstruction: { parts: [{ text: getSystemPrompt(context) }] },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    let geminiData = await geminiResponse.json();

    // 5. Process function calls if any
    while (geminiData.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      const functionCall = geminiData.candidates[0].content.parts[0].functionCall;
      const funcResult = await executeFunction(functionCall.name, functionCall.args || {}, user.id, supabase);
      actions.push(funcResult.action);

      // Track if we made data changes
      if (['create', 'update', 'delete'].includes(funcResult.action.type)) {
        hasDataChanges = true;
      }

      // Add function call and response to contents
      contents.push({
        role: 'model',
        parts: [{ functionCall }],
      });
      contents.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: funcResult.name,
            response: funcResult.response,
          },
        }],
      });

      // Send function result back to Gemini
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          tools: [{ functionDeclarations }],
          systemInstruction: { parts: [{ text: getSystemPrompt(context) }] },
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      geminiData = await geminiResponse.json();
    }

    // 6. Get final text response
    responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua solicitação.';

    // 7. Fetch updated data if changes were made
    let updatedData = null;
    if (hasDataChanges) {
      updatedData = await fetchUpdatedData(user.id, supabase);
    }

    // 8. Return response
    return new Response(JSON.stringify({
      message: responseText,
      actions,
      updatedData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
