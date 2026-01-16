import React, { useState, useMemo } from 'react';
import { Plus, ListTodo, ChevronLeft, ChevronRight, ChevronDown, Check, Inbox, Calendar, Clock, Search } from 'lucide-react';
import { Task } from '../types';
import { fireConfetti } from '../utils/confetti';

interface TasksPageProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => Promise<void>;
  onQuickAddTask?: (title: string, dueDate: string) => Promise<void>;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onToggleComplete,
  onQuickAddTask
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [showCompleted, setShowCompleted] = useState(false);
  const [showInbox, setShowInbox] = useState(true);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Filter tasks by selected date
  const filteredTasks = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDateStr = task.due_date.split('T')[0];
      return taskDateStr === dateStr;
    });
  }, [tasks, selectedDate]);

  // Inbox tasks (without due_date)
  const inboxTasks = useMemo(() => {
    let inbox = tasks.filter(task => !task.due_date && !task.completed);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      inbox = inbox.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }
    return inbox;
  }, [tasks, searchQuery]);

  const pendingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  // Calculate progress
  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    setSelectedDate(todayDate);
  };

  const formatDate = (date: Date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Hoje';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (compareDate.getTime() === yesterday.getTime()) {
      return 'Ontem';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    }

    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const isToday = selectedDate.getTime() === today.getTime();

  const handleToggleComplete = async (taskId: string, currentCompleted: boolean, event: React.MouseEvent) => {
    const newValue = !currentCompleted;
    if (newValue) {
      fireConfetti(event);
    }
    await onToggleComplete(taskId, newValue);
  };

  const handleQuickAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickTaskTitle.trim() && onQuickAddTask) {
      setIsAdding(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await onQuickAddTask(quickTaskTitle.trim(), dateStr);
      setQuickTaskTitle('');
      setIsAdding(false);
    }
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

  const formatTime = (task: Task) => {
    if (!task.start_time) return null;
    const start = task.start_time.substring(0, 5);
    const end = task.end_time ? task.end_time.substring(0, 5) : null;
    return end ? `${start} - ${end}` : start;
  };

  const TaskItem = ({ task, isCompleted }: { task: Task; isCompleted: boolean }) => (
    <div className="flex items-start gap-4 group py-1">
      <div className="pt-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleComplete(task.id, task.completed, e);
          }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer
            ${isCompleted
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-input hover:border-primary'
            }`}
        >
          {isCompleted && <Check size={12} strokeWidth={3} />}
        </button>
      </div>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onEditTask(task)}
      >
        <p className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {task.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {task.description}
            </p>
          )}
          {formatTime(task) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} />
              {formatTime(task)}
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

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Focus - Left Column (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
              {/* Day Navigation Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <ListTodo className="text-primary" size={20} />
                  Foco Diário
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousDay}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={goToToday}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      isToday
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {formatDate(selectedDate)}
                  </button>
                  <button
                    onClick={goToNextDay}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {totalTasks > 0 && (
                <div className="px-6 pt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">
                      {completedCount} de {totalTasks} tarefas concluídas
                    </span>
                    <span className="font-semibold text-primary">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              <div className="p-6 space-y-4">
                {pendingTasks.length > 0 ? (
                  pendingTasks.map(task => (
                    <TaskItem key={task.id} task={task} isCompleted={false} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa pendente para este dia.
                  </p>
                )}
              </div>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="border-t border-border">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${showCompleted ? 'rotate-180' : ''}`}
                    />
                    Concluídas ({completedTasks.length})
                  </button>

                  {showCompleted && (
                    <div className="px-6 pb-6 space-y-4">
                      {completedTasks.map(task => (
                        <TaskItem key={task.id} task={task} isCompleted={true} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Add */}
              <div className="bg-muted/50 p-4 border-t border-border">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  onKeyDown={handleQuickAdd}
                  placeholder={isAdding ? 'Adicionando...' : '+ Adicionar nova tarefa...'}
                  disabled={isAdding}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-muted-foreground text-foreground outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Inbox - Right Column (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
              {/* Inbox Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Inbox className="text-primary" size={20} />
                    Caixa de Entrada
                  </h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                    {inboxTasks.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tarefas sem data definida
                </p>
              </div>

              {/* Search */}
              {tasks.filter(t => !t.due_date && !t.completed).length > 5 && (
                <div className="px-4 py-3 border-b border-border">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Inbox Tasks */}
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {inboxTasks.length > 0 ? (
                  inboxTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(task.id, task.completed, e);
                          }}
                          className="mt-0.5 w-4 h-4 rounded-full border-2 border-input hover:border-primary flex-shrink-0 transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${priorityColors[task.priority]}`}>
                              {priorityLabels[task.priority]}
                            </span>
                            {task.estimated_minutes && (
                              <span className="text-[10px] text-muted-foreground">
                                ~{task.estimated_minutes}min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Inbox size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Nenhuma tarefa encontrada' : 'Caixa de entrada vazia'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
