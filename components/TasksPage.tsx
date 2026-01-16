import React, { useState, useMemo } from 'react';
import { Plus, ListTodo, ChevronLeft, ChevronRight, ChevronDown, Check, Inbox, Calendar, Clock, Search, Circle, AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle states for "All Tasks" section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overdue: true,
    today: true,
    upcoming: false,
    completed: false
  });

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  // Categorized tasks for "All Tasks" section
  const categorizedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach(task => {
      if (task.completed) {
        completed.push(task);
        return;
      }

      if (!task.due_date) return; // Skip inbox tasks

      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() < today.getTime()) {
        overdue.push(task);
      } else if (taskDate.getTime() === today.getTime()) {
        todayTasks.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return { overdue, today: todayTasks, upcoming, completed };
  }, [tasks, today]);

  const pendingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  // Calculate progress
  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentMonth]);

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDateStr = task.due_date.split('T')[0];
      return taskDateStr === dateStr;
    });
  };

  const isToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

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
    setCurrentMonth(todayDate);
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

  const isTodaySelected = selectedDate.getTime() === today.getTime();

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

  const formatTime = (task: Task) => {
    if (!task.start_time) return null;
    const start = task.start_time.substring(0, 5);
    const end = task.end_time ? task.end_time.substring(0, 5) : null;
    return end ? `${start} - ${end}` : start;
  };

  const formatTaskDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const TaskItem = ({ task, isCompleted, showDate = false }: { task: Task; isCompleted: boolean; showDate?: boolean }) => (
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
          {showDate && task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={10} />
              {formatTaskDate(task.due_date)}
            </span>
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

  const TaskSection = ({
    title,
    tasks,
    sectionKey,
    icon: Icon,
    iconColor = 'text-muted-foreground',
    showDate = false
  }: {
    title: string;
    tasks: Task[];
    sectionKey: string;
    icon: React.ElementType;
    iconColor?: string;
    showDate?: boolean;
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center gap-2 w-full text-left mb-2 group"
        >
          <ChevronDown
            size={14}
            className={`transition-transform text-muted-foreground ${expandedSections[sectionKey] ? '' : '-rotate-90'}`}
          />
          <Icon size={16} className={iconColor} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">({tasks.length})</span>
        </button>

        {expandedSections[sectionKey] && (
          <div className="space-y-3 ml-6">
            {tasks.map(task => (
              <TaskItem key={task.id} task={task} isCompleted={task.completed} showDate={showDate} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
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

        {/* Row 1: Daily Focus + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Focus */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
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
                    isTodaySelected
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

            <div className="p-6 space-y-4 min-h-[200px]">
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

          {/* Calendar */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
              {weekDays.map((d) => (
                <span key={d} className="font-bold text-muted-foreground uppercase py-2">{d}</span>
              ))}

              {calendarDays.map((day, i) => {
                const dayTasks = getTasksForDate(day.date);
                const hasTasks = dayTasks.length > 0;
                const hasIncompleteTasks = dayTasks.some(t => !t.completed);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      relative py-1.5 flex flex-col items-center justify-center font-medium rounded-lg transition-all
                      ${!day.isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                      ${isToday(day.date) && !isSelected(day.date) ? 'bg-accent text-accent-foreground' : ''}
                      ${isSelected(day.date) ? 'bg-primary text-primary-foreground font-bold shadow-sm' : ''}
                      ${day.isCurrentMonth && !isSelected(day.date) && !isToday(day.date) ? 'hover:bg-accent/50' : ''}
                    `}
                  >
                    <span>{day.date.getDate()}</span>
                    {hasTasks && (
                      <div className="flex gap-0.5 mt-0.5">
                        <Circle
                          size={4}
                          className={`${hasIncompleteTasks ? 'fill-primary text-primary' : 'fill-muted-foreground/50 text-muted-foreground/50'}`}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Inbox + All Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inbox */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
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

            <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
              {inboxTasks.length > 0 ? (
                inboxTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
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

          {/* All Tasks */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarDays className="text-primary" size={20} />
                Todas as Tarefas
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Organizadas por status
              </p>
            </div>

            <div className="p-4 max-h-[350px] overflow-y-auto">
              <TaskSection
                title="Atrasadas"
                tasks={categorizedTasks.overdue}
                sectionKey="overdue"
                icon={AlertCircle}
                iconColor="text-destructive"
                showDate
              />

              <TaskSection
                title="Hoje"
                tasks={categorizedTasks.today}
                sectionKey="today"
                icon={Clock}
                iconColor="text-primary"
              />

              <TaskSection
                title="Próximas"
                tasks={categorizedTasks.upcoming}
                sectionKey="upcoming"
                icon={CalendarDays}
                iconColor="text-blue-500"
                showDate
              />

              <TaskSection
                title="Concluídas"
                tasks={categorizedTasks.completed}
                sectionKey="completed"
                icon={CheckCircle2}
                iconColor="text-green-500"
                showDate
              />

              {categorizedTasks.overdue.length === 0 &&
               categorizedTasks.today.length === 0 &&
               categorizedTasks.upcoming.length === 0 &&
               categorizedTasks.completed.length === 0 && (
                <div className="text-center py-8">
                  <CalendarDays size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa com data definida
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
