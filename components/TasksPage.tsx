import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, Inbox, CheckCircle2, Clock, ChevronDown, Check } from 'lucide-react';
import { Task } from '../types';

interface TasksPageProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => Promise<void>;
}

type FilterType = 'all' | 'inbox' | 'today' | 'upcoming' | 'completed';

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onToggleComplete
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overdue: true,
    today: true,
    upcoming: true,
    noDate: true,
    completed: false
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter and categorize tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(query) &&
          !task.description?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Type filter
    switch (filter) {
      case 'inbox':
        return !task.due_date && !task.completed;
      case 'today':
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime() && !task.completed;
      case 'upcoming':
        if (!task.due_date) return false;
        const upcomingDate = new Date(task.due_date);
        upcomingDate.setHours(0, 0, 0, 0);
        return upcomingDate.getTime() > today.getTime() && !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  // Categorize tasks for "all" view
  const categorizedTasks = {
    overdue: filteredTasks.filter(task => {
      if (!task.due_date || task.completed) return false;
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() < today.getTime();
    }),
    today: filteredTasks.filter(task => {
      if (!task.due_date || task.completed) return false;
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }),
    upcoming: filteredTasks.filter(task => {
      if (!task.due_date || task.completed) return false;
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() > today.getTime();
    }),
    noDate: filteredTasks.filter(task => !task.due_date && !task.completed),
    completed: filteredTasks.filter(task => task.completed)
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const priorityColors = {
    low: 'bg-slate-500/15 text-slate-700 dark:text-slate-400',
    medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    high: 'bg-red-500/15 text-red-700 dark:text-red-400',
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors group"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task.id, !task.completed);
        }}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
          ${task.completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-input hover:border-primary'
          }`}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onEditTask(task)}
      >
        <p className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(task.due_date)}
            </span>
          )}
          {task.start_time && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} />
              {task.start_time.substring(0, 5)}
              {task.end_time && ` - ${task.end_time.substring(0, 5)}`}
            </span>
          )}
          {task.estimated_minutes && (
            <span className="text-xs text-muted-foreground">
              ~{task.estimated_minutes < 60
                ? `${task.estimated_minutes}min`
                : `${Math.floor(task.estimated_minutes / 60)}h${task.estimated_minutes % 60 > 0 ? task.estimated_minutes % 60 : ''}`}
            </span>
          )}
        </div>
      </div>

      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide flex-shrink-0 ${priorityColors[task.priority]}`}>
        {priorityLabels[task.priority]}
      </span>
    </div>
  );

  const TaskSection = ({
    title,
    tasks,
    sectionKey,
    icon: Icon,
    iconColor = 'text-muted-foreground',
    emptyMessage
  }: {
    title: string;
    tasks: Task[];
    sectionKey: string;
    icon: React.ElementType;
    iconColor?: string;
    emptyMessage?: string;
  }) => {
    if (tasks.length === 0 && !emptyMessage) return null;

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center gap-2 w-full text-left mb-3 group"
        >
          <ChevronDown
            size={16}
            className={`transition-transform text-muted-foreground ${expandedSections[sectionKey] ? '' : '-rotate-90'}`}
          />
          <Icon size={18} className={iconColor} />
          <span className="font-semibold text-foreground">{title}</span>
          <span className="text-sm text-muted-foreground">({tasks.length})</span>
        </button>

        {expandedSections[sectionKey] && (
          <div className="space-y-2 ml-6">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{emptyMessage}</p>
            ) : (
              tasks.map(task => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>
    );
  };

  const filterButtons: { key: FilterType; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todas', icon: Filter },
    { key: 'inbox', label: 'Caixa de Entrada', icon: Inbox },
    { key: 'today', label: 'Hoje', icon: Calendar },
    { key: 'upcoming', label: 'Próximas', icon: Clock },
    { key: 'completed', label: 'Concluídas', icon: CheckCircle2 },
  ];

  // Count for badges
  const counts = {
    all: tasks.length,
    inbox: tasks.filter(t => !t.due_date && !t.completed).length,
    today: tasks.filter(t => {
      if (!t.due_date || t.completed) return false;
      const d = new Date(t.due_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length,
    upcoming: tasks.filter(t => {
      if (!t.due_date || t.completed) return false;
      const d = new Date(t.due_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() > today.getTime();
    }).length,
    completed: tasks.filter(t => t.completed).length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minhas Tarefas</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.filter(t => !t.completed).length} tarefas pendentes
          </p>
        </div>
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-105 transition-all shadow-sm"
        >
          <Plus size={20} />
          Nova Tarefa
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Icon size={14} />
              {label}
              {counts[key] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === key ? 'bg-primary-foreground/20' : 'bg-background'
                }`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-background">
        {filter === 'all' ? (
          <>
            <TaskSection
              title="Atrasadas"
              tasks={categorizedTasks.overdue}
              sectionKey="overdue"
              icon={Clock}
              iconColor="text-destructive"
            />
            <TaskSection
              title="Hoje"
              tasks={categorizedTasks.today}
              sectionKey="today"
              icon={Calendar}
              iconColor="text-primary"
              emptyMessage="Nenhuma tarefa para hoje"
            />
            <TaskSection
              title="Próximas"
              tasks={categorizedTasks.upcoming}
              sectionKey="upcoming"
              icon={Clock}
              iconColor="text-blue-500"
            />
            <TaskSection
              title="Caixa de Entrada"
              tasks={categorizedTasks.noDate}
              sectionKey="noDate"
              icon={Inbox}
              iconColor="text-amber-500"
            />
            <TaskSection
              title="Concluídas"
              tasks={categorizedTasks.completed}
              sectionKey="completed"
              icon={CheckCircle2}
              iconColor="text-green-500"
            />
          </>
        ) : (
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
              </div>
            ) : (
              filteredTasks.map(task => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};
