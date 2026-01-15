import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { TaskList } from './components/TaskList';
import { HabitTracker } from './components/HabitTracker';
import { CalendarWidget } from './components/CalendarWidget';
import { GoalsWidget } from './components/GoalsWidget';
import { TaskModal } from './components/TaskModal';
import { AuthPage } from './components/AuthPage';
import { StyleguidePage } from './styleguide';
import { ChatCenterbar } from './components/ai-chat';
import { ChatProvider } from './contexts/ChatContext';
import { CheckCircle2, Flame, TrendingUp, Timer, Loader2 } from 'lucide-react';
import { Task, Habit, HabitLog, Goal } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

const MOCK_GOALS: Goal[] = [
  { id: '1', title: 'Ler 5 Livros', current: 3, target: 5 },
  { id: '2', title: 'Correr 100km', current: 42, target: 100 },
  { id: '3', title: 'Aprender Tailwind CSS', current: 90, target: 100, unit: '%' },
];

// Provided User Avatar URL
const AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDdbeaqp5CUaSkkQE5f5-WV10ZXKj9NGALSmdh04mqlJZhzIPflnSU_uw5K-JfH_1norVgLHEccFMlmpPf2K4yY9O27qRKA8uSQKet7cLdEpeMUYvnMhmpAnKobj_8_OHbO3SCqAosf0SlGFK7RA7c3-hMvHPcZx_gEqHRk_-YAWIdemt51SwUKywaAXV8xeON7cPpfHZlgck_yuMkWJTgnJcBMihZHC5hm-O77vrzdNMMaAUEnOKXDHc1873FTV-DDUeOTAI67";

function App() {
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(true);

  // Fetch user profile from Supabase
  useEffect(() => {
    if (!user) {
      setUserName('');
      return;
    }

    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        setUserName(user.email?.split('@')[0] || 'Usuário');
      } else {
        setUserName(data?.name || user.email?.split('@')[0] || 'Usuário');
      }
    }

    fetchProfile();
  }, [user]);

  // Fetch tasks from Supabase (only when user is logged in)
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    async function fetchTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
      } else {
        setTasks(data || []);
      }
      setLoadingTasks(false);
    }

    fetchTasks();
  }, [user]);

  // Fetch habits from Supabase
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setHabitLogs([]);
      setLoadingHabits(false);
      return;
    }

    async function fetchHabits() {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar hábitos:', error);
      } else {
        setHabits(data || []);
      }
      setLoadingHabits(false);
    }

    fetchHabits();
  }, [user]);

  // Fetch habit logs for goal progress calculation (from start of month or week)
  useEffect(() => {
    if (!user || habits.length === 0) {
      return;
    }

    async function fetchHabitLogs() {
      const today = new Date();
      // Get start of current month to include all data needed for monthly goals
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_date', startDate)
        .order('logged_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar logs de hábitos:', error);
      } else {
        setHabitLogs(data || []);
      }
    }

    fetchHabitLogs();
  }, [user, habits]);

  // Add new task to Supabase
  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    estimated_minutes: number | null;
    start_time: string | null;
    end_time: string | null;
  }) => {
    if (!user) return;

    console.log('handleAddTask received:', taskData);

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: user.id,
          title: taskData.title,
          description: taskData.description || null,
          priority: taskData.priority,
          due_date: taskData.due_date,
          completed: false,
          estimated_minutes: taskData.estimated_minutes,
          start_time: taskData.start_time,
          end_time: taskData.end_time,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar tarefa:', error);
    } else if (data) {
      setTasks((prev) => [...prev, data]);
    }
  };

  // Quick add task (only title, defaults for rest)
  const handleQuickAddTask = async (title: string) => {
    if (!user) return;

    // Format selected date as YYYY-MM-DD for Supabase
    const dueDateStr = selectedDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: user.id,
          title,
          description: null,
          priority: 'low',
          due_date: dueDateStr,
          completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar tarefa:', error);
    } else if (data) {
      setTasks((prev) => [...prev, data]);
    }
  };

  // Update existing task in Supabase
  const handleUpdateTask = async (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    estimated_minutes: number | null;
    start_time: string | null;
    end_time: string | null;
  }) => {
    if (!user || !editingTask) return;

    console.log('handleUpdateTask received:', taskData);

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority,
        due_date: taskData.due_date,
        estimated_minutes: taskData.estimated_minutes,
        start_time: taskData.start_time,
        end_time: taskData.end_time,
      })
      .eq('id', editingTask.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
    } else if (data) {
      setTasks((prev) =>
        prev.map((task) => (task.id === editingTask.id ? data : task))
      );
    }
  };

  // Delete task from Supabase
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao excluir tarefa:', error);
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    }
  };

  // Open modal to edit a task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Open modal to create a new task
  const handleNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Toggle task completion status
  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, completed, completed_at: completed ? new Date().toISOString() : null }
            : task
        )
      );
    }
  };

  // Toggle habit completion for a specific date
  const handleToggleHabit = async (habitId: string, date: string, completed: boolean) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('habit_logs')
      .upsert({
        habit_id: habitId,
        user_id: user.id,
        logged_date: date,
        completed,
      }, {
        onConflict: 'habit_id,logged_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar hábito:', error);
    } else if (data) {
      setHabitLogs((prev) => {
        const existingIndex = prev.findIndex(
          (log) => log.habit_id === habitId && log.logged_date === date
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        }
        return [...prev, data];
      });
    }
  };

  // Add new habit
  const handleAddHabit = async (habitData: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    target_days: string[] | null;
    goal_target: number | null;
    goal_period: 'weekly' | 'monthly' | 'yearly' | null;
  }) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('habits')
      .insert([{
        user_id: user.id,
        title: habitData.title,
        description: habitData.description || null,
        frequency: habitData.frequency,
        target_days: habitData.target_days,
        color: 'primary',
        is_active: true,
        goal_target: habitData.goal_target,
        goal_period: habitData.goal_period,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar hábito:', error);
    } else if (data) {
      setHabits((prev) => [...prev, data]);
    }
  };

  // Update existing habit
  const handleUpdateHabit = async (habitId: string, habitData: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    target_days: string[] | null;
    goal_target: number | null;
    goal_period: 'weekly' | 'monthly' | 'yearly' | null;
  }) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('habits')
      .update({
        title: habitData.title,
        description: habitData.description || null,
        frequency: habitData.frequency,
        target_days: habitData.target_days,
        goal_target: habitData.goal_target,
        goal_period: habitData.goal_period,
      })
      .eq('id', habitId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar hábito:', error);
    } else if (data) {
      setHabits((prev) =>
        prev.map((habit) => (habit.id === habitId ? data : habit))
      );
    }
  };

  // Delete habit (soft delete - set is_active to false)
  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao excluir hábito:', error);
    } else {
      setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
    }
  };

  // Callback for AI chat to update data after modifications
  const handleDataUpdated = useCallback((updatedData: {
    tasks?: Task[];
    habits?: Habit[];
    habitLogs?: HabitLog[];
  }) => {
    if (updatedData.tasks) {
      setTasks(updatedData.tasks);
    }
    if (updatedData.habits) {
      setHabits(updatedData.habits);
    }
    if (updatedData.habitLogs) {
      setHabitLogs(updatedData.habitLogs);
    }
  }, []);

  // Filter tasks by selected date
  const filteredTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date).toISOString().split('T')[0];
    const selected = selectedDate.toISOString().split('T')[0];
    return taskDate === selected;
  });

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Get today's date formatted in Portuguese
  const getTodayFormatted = () => {
    const today = new Date();
    const weekDays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const dayOfWeek = weekDays[today.getDay()];
    const day = today.getDate();
    const month = months[today.getMonth()];
    return `Hoje é ${dayOfWeek}, ${day} de ${month}.`;
  };

  // Get today's pending tasks count
  const getTodayPendingTasksCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = task.due_date.split('T')[0];
      return taskDate === today && !task.completed;
    }).length;
  };

  // Initialize theme based on preference or system
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  // Update HTML class for Tailwind dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Show styleguide if URL is /styleguide (dev only)
  if (window.location.pathname === '/styleguide') {
    return (
      <StyleguidePage
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onClose={() => window.location.href = '/'}
      />
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  return (
    <ChatProvider onDataUpdated={handleDataUpdated} userName={userName}>
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar userAvatar={AVATAR_URL} isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen w-full relative">
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          toggleTheme={() => setIsDark(!isDark)}
          isDark={isDark}
          onNewTask={handleNewTask}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Welcome Section */}
            <div className="animate-fade-in-up">
              <h2 className="text-3xl font-bold tracking-tight">{getGreeting()}, {userName} ⚡️</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {getTodayFormatted()}
              </p>
              <p className="text-sm text-muted-foreground">
                {getTodayPendingTasksCount() === 0
                  ? 'Você não tem tarefas pendentes para hoje.'
                  : getTodayPendingTasksCount() === 1
                  ? 'Você tem 1 tarefa para concluir hoje.'
                  : `Você tem ${getTodayPendingTasksCount()} tarefas para concluir hoje.`}
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column (Tasks & Habits) */}
              <div className="xl:col-span-2 space-y-8">
                {loadingTasks ? (
                  <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
                    <p className="text-muted-foreground">Carregando tarefas...</p>
                  </div>
                ) : (
                  <TaskList
                    tasks={filteredTasks}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onQuickAdd={handleQuickAddTask}
                    onToggleComplete={handleToggleComplete}
                    onEditTask={handleEditTask}
                  />
                )}
                {loadingHabits ? (
                  <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
                    <p className="text-muted-foreground">Carregando hábitos...</p>
                  </div>
                ) : (
                  <HabitTracker
                    habits={habits}
                    habitLogs={habitLogs}
                    onToggleHabit={handleToggleHabit}
                    onAddHabit={handleAddHabit}
                    onUpdateHabit={handleUpdateHabit}
                    onDeleteHabit={handleDeleteHabit}
                  />
                )}
              </div>

              {/* Right Column (Calendar & Goals) */}
              <div className="space-y-8">
                <CalendarWidget
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onEditTask={handleEditTask}
                />
                <GoalsWidget goals={MOCK_GOALS} />
              </div>

            </div>
          </div>
        </main>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSave={editingTask ? handleUpdateTask : handleAddTask}
        onDelete={handleDeleteTask}
        task={editingTask}
      />

      <ChatCenterbar />
    </div>
    </ChatProvider>
  );
}

export default App;