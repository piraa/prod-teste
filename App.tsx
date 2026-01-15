import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { TaskList } from './components/TaskList';
import { HabitTracker } from './components/HabitTracker';
import { CalendarWidget } from './components/CalendarWidget';
import { GoalsWidget } from './components/GoalsWidget';
import { NewTaskModal } from './components/NewTaskModal';
import { AuthPage } from './components/AuthPage';
import { CheckCircle2, Flame, TrendingUp, Timer, Loader2 } from 'lucide-react';
import { Task, Habit, Goal } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

const MOCK_HABITS: Habit[] = [
  { id: '1', title: 'Meditação (15 min)', meta: 'Meta: Todos os dias', history: [true, true, true, true, false, false, false] },
  { id: '2', title: 'Beber 2L de Água', meta: 'Meta: Todos os dias', history: [true, true, true, true, true, false, false] },
  { id: '3', title: 'Sem redes sociais matinal', meta: 'Meta: Seg - Sex', history: [true, true, true, true, false, false, false] },
];

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
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  // Add new task to Supabase
  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
  }) => {
    if (!user) return;

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

  // Filter tasks by selected date
  const filteredTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date).toISOString().split('T')[0];
    const selected = selectedDate.toISOString().split('T')[0];
    return taskDate === selected;
  });

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

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  return (
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
          onNewTask={() => setIsNewTaskModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Welcome Section */}
            <div className="animate-fade-in-up">
              <h2 className="text-3xl font-bold tracking-tight">Bom dia, {userName} 👋</h2>
              <p className="text-muted-foreground mt-1">
                Hoje é segunda-feira, 15 de Maio.
              </p>
              <p className="text-muted-foreground">
                Você tem 5 tarefas para concluir hoje.
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
                  />
                )}
                <HabitTracker habits={MOCK_HABITS} />
              </div>

              {/* Right Column (Calendar & Goals) */}
              <div className="space-y-8">
                <CalendarWidget />
                <GoalsWidget goals={MOCK_GOALS} />
              </div>

            </div>
          </div>
        </main>
      </div>

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSave={handleAddTask}
      />
    </div>
  );
}

export default App;