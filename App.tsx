import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { TaskList } from './components/TaskList';
import { HabitTracker } from './components/HabitTracker';
import { CalendarWidget } from './components/CalendarWidget';
import { GoalsWidget } from './components/GoalsWidget';
import { CheckCircle2, Flame, TrendingUp, Timer } from 'lucide-react';
import { Task, Habit, Goal } from './types';

// Mock Data
const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Revisão do projeto UX Design', category: 'Trabalho', time: '09:00 AM', completed: true, tag: { label: 'Feito', color: 'slate' } },
  { id: '2', title: 'Academia - Treino de Pernas', category: 'Saúde', time: '11:30 AM', completed: false, tag: { label: 'Urgente', color: 'amber' } },
  { id: '3', title: 'Reunião de alinhamento trimestral', category: 'Trabalho', time: '02:00 PM', completed: false, tag: { label: 'Reunião', color: 'blue' } },
  { id: '4', title: 'Leitura: "Hábitos Atômicos"', category: 'Pessoal', time: '08:00 PM', completed: false, tag: { label: 'Lazer', color: 'green' } },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

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
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Welcome Section */}
            <div className="animate-fade-in-up">
              <h2 className="text-3xl font-bold tracking-tight">Bom dia, Ricardo 👋</h2>
              <p className="text-muted-foreground mt-1">
                Hoje é segunda-feira, 15 de Maio. Você tem 5 tarefas para concluir hoje.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Tarefas Completas" 
                value="128" 
                trendLabel="+12% vs ontem" 
                trendColorClass="text-green-500 bg-green-500/10"
                icon={<CheckCircle2 size={24} />}
              />
              <StatCard 
                label="Foco Diário (Streak)" 
                value="15 Dias" 
                trendLabel="Recorde!" 
                trendColorClass="text-primary bg-primary/10"
                icon={<Flame size={24} />}
              />
              <StatCard 
                label="Produtividade" 
                value="92%" 
                trendLabel="85% da meta" 
                trendColorClass="text-blue-500 bg-blue-500/10"
                icon={<TrendingUp size={24} />}
              />
              <StatCard 
                label="Tempo Focado" 
                value="24.5h" 
                trendLabel="Total acumulado" 
                trendColorClass="text-muted-foreground bg-muted"
                icon={<Timer size={24} />}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column (Tasks & Habits) */}
              <div className="xl:col-span-2 space-y-8">
                <TaskList tasks={MOCK_TASKS} />
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
    </div>
  );
}

export default App;