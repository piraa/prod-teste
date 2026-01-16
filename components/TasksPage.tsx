import React, { useState, useMemo, useRef } from 'react';
import { Plus, Calendar, ChevronLeft, ChevronRight, Check, GripVertical, Clock, Filter } from 'lucide-react';
import { Task } from '../types';
import { fireConfetti } from '../utils/confetti';

interface TasksPageProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => Promise<void>;
  onUpdateTaskTime?: (taskId: string, date: string, startTime: string, endTime: string) => Promise<void>;
  onUpdateTaskDate?: (taskId: string, date: string) => Promise<void>;
  onQuickAddTask?: (title: string, dueDate: string) => Promise<void>;
}

// Generate time slots from 6:00 to 23:00
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const SLOT_HEIGHT = 60; // pixels per hour

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onToggleComplete,
  onUpdateTaskTime,
  onUpdateTaskDate,
  onQuickAddTask
}) => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Drag state
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ date: string; time: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Quick add state per column
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Generate 5 days starting from startDate
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      result.push(date);
    }
    return result;
  }, [startDate]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const weekDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const formatDayHeader = (date: Date) => {
    const isToday = date.getTime() === today.getTime();
    const dayName = weekDayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const dayNum = date.getDate();

    return { dayName, monthName, dayNum, isToday };
  };

  const goToPrevious = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() - 5);
    setStartDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + 5);
    setStartDate(newDate);
  };

  const goToToday = () => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    setStartDate(todayDate);
  };

  // Get tasks for a specific day
  const getTasksForDay = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDateStr = task.due_date.split('T')[0];
      return taskDateStr === dateStr && !task.completed;
    });
  };

  // Get completed tasks for a specific day
  const getCompletedTasksForDay = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDateStr = task.due_date.split('T')[0];
      return taskDateStr === dateStr && task.completed;
    });
  };

  // Get tasks with scheduled time for time blocking sidebar
  const getScheduledTasks = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date || !task.start_time) return false;
      const taskDateStr = task.due_date.split('T')[0];
      return taskDateStr === dateStr;
    });
  };

  // Calculate task position and height for time blocking
  const getTaskStyle = (task: Task): React.CSSProperties => {
    if (!task.start_time) return {};

    const [startHour, startMin] = task.start_time.split(':').map(Number);
    const topPosition = (startHour - 6) * SLOT_HEIGHT + (startMin / 60) * SLOT_HEIGHT;

    let durationMinutes = 60; // Default 1 hour
    if (task.end_time) {
      const [endHour, endMin] = task.end_time.split(':').map(Number);
      durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    } else if (task.estimated_minutes) {
      durationMinutes = task.estimated_minutes;
    }

    const height = (durationMinutes / 60) * SLOT_HEIGHT;

    return {
      top: `${topPosition}px`,
      height: `${Math.max(height, 30)}px`,
    };
  };

  const getPriorityBorderColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-amber-500';
      case 'low': return 'border-l-slate-400';
      default: return 'border-l-primary';
    }
  };

  const formatDuration = (minutes: number | null | undefined): string => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggingTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date, time: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dateStr = date.toISOString().split('T')[0];
    setDragOverSlot({ date: dateStr, time });
  };

  const handleDrop = async (e: React.DragEvent, date: Date, time: string) => {
    e.preventDefault();

    if (!draggingTask || !onUpdateTaskTime) return;

    const dateStr = date.toISOString().split('T')[0];
    const [hour, min] = time.split(':').map(Number);

    // Calculate end time based on estimated duration or default 1 hour
    let endHour = hour + 1;
    let endMin = min;

    if (draggingTask.estimated_minutes) {
      const totalEndMinutes = hour * 60 + min + draggingTask.estimated_minutes;
      endHour = Math.floor(totalEndMinutes / 60);
      endMin = totalEndMinutes % 60;
    }

    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    await onUpdateTaskTime(draggingTask.id, dateStr, time, endTime);

    setDraggingTask(null);
    setDragOverSlot(null);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  // Column drag handlers (for moving between days)
  const handleColumnDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(dateStr);
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleColumnDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingTask) return;

    // If the task already has this date, don't update
    const currentDateStr = draggingTask.due_date?.split('T')[0];
    if (currentDateStr === dateStr) {
      setDraggingTask(null);
      setDragOverColumn(null);
      return;
    }

    if (onUpdateTaskDate) {
      await onUpdateTaskDate(draggingTask.id, dateStr);
    }

    setDraggingTask(null);
    setDragOverColumn(null);
  };

  // Quick add handler
  const handleQuickAdd = async (dateStr: string) => {
    if (!quickAddTitle.trim()) {
      setQuickAddColumn(null);
      return;
    }

    if (onQuickAddTask) {
      await onQuickAddTask(quickAddTitle.trim(), dateStr);
    }

    setQuickAddTitle('');
    setQuickAddColumn(null);
  };

  // Task Card Component
  const TaskCard = ({ task, showTime = false }: { task: Task; showTime?: boolean }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragEnd={handleDragEnd}
      onClick={() => onEditTask(task)}
      className={`
        bg-card border rounded-lg p-3 cursor-pointer
        border-l-4 ${getPriorityBorderColor(task.priority)}
        hover:shadow-md transition-all group
        ${draggingTask?.id === task.id ? 'opacity-50' : ''}
        ${task.completed ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            const newValue = !task.completed;
            if (newValue) {
              fireConfetti(e);
            }
            onToggleComplete(task.id, newValue);
          }}
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
            ${task.completed
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-muted-foreground/40 hover:border-primary'
            }`}
        >
          {task.completed && <Check size={10} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {showTime && task.start_time && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {task.start_time.substring(0, 5)}
                {task.end_time && ` - ${task.end_time.substring(0, 5)}`}
              </span>
            )}
            {task.estimated_minutes && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(task.estimated_minutes)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Currently viewing today
  const todayDateStr = today.toISOString().split('T')[0];
  const todayScheduledTasks = getScheduledTasks(today);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Calendar size={16} />
            Hoje
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-105 transition-all shadow-sm"
        >
          <Plus size={18} />
          Nova Tarefa
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Day Columns */}
        <div className="flex-1 flex overflow-x-auto">
          {days.map((date, index) => {
            const { dayName, monthName, dayNum, isToday } = formatDayHeader(date);
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = getTasksForDay(date);
            const completedTasks = getCompletedTasksForDay(date);
            const isQuickAddOpen = quickAddColumn === dateStr;

            // Calculate total estimated time
            const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

            const isDragOver = dragOverColumn === dateStr;

            return (
              <div
                key={dateStr}
                onDragOver={(e) => handleColumnDragOver(e, dateStr)}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleColumnDrop(e, dateStr)}
                className={`flex-1 min-w-[200px] max-w-[280px] border-r border-border flex flex-col transition-colors ${
                  isToday ? 'bg-primary/5' : 'bg-background'
                } ${isDragOver ? 'bg-primary/10 ring-2 ring-inset ring-primary/30' : ''}`}
              >
                {/* Day Header */}
                <div className="p-4 border-b border-border">
                  <p className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {dayName}
                  </p>
                  <p className={`text-2xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {monthName} {dayNum}
                  </p>
                  {totalMinutes > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDuration(totalMinutes)} planejado
                    </p>
                  )}
                </div>

                {/* Add Task Button / Quick Add */}
                <div className="px-3 py-2 border-b border-border">
                  {isQuickAddOpen ? (
                    <input
                      type="text"
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(dateStr);
                        if (e.key === 'Escape') {
                          setQuickAddColumn(null);
                          setQuickAddTitle('');
                        }
                      }}
                      onBlur={() => handleQuickAdd(dateStr)}
                      autoFocus
                      placeholder="Nome da tarefa..."
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <button
                      onClick={() => setQuickAddColumn(dateStr)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                      Adicionar tarefa
                    </button>
                  )}
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {dayTasks.map(task => (
                    <TaskCard key={task.id} task={task} showTime />
                  ))}

                  {dayTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhuma tarefa
                    </p>
                  )}

                  {/* Completed tasks section */}
                  {completedTasks.length > 0 && (
                    <div className="pt-4 border-t border-border mt-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Concluídas ({completedTasks.length})
                      </p>
                      <div className="space-y-2">
                        {completedTasks.map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Blocking Sidebar (Desktop only) */}
        <div className="hidden xl:flex w-80 border-l border-border flex-col bg-background">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <span className="font-semibold">Calendário</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Arraste tarefas para agendar
            </p>
          </div>

          {/* Today mini header */}
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground">
              Hoje, {today.getDate()} de {monthNames[today.getMonth()]}
            </p>
          </div>

          {/* Time Grid */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Time slots */}
            <div className="relative">
              {TIME_SLOTS.map((time) => {
                const isDropTarget = dragOverSlot?.date === todayDateStr && dragOverSlot?.time === time;
                return (
                  <div
                    key={time}
                    className={`flex border-b border-border/50 transition-colors ${
                      isDropTarget ? 'bg-primary/20' : ''
                    }`}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    onDragOver={(e) => handleDragOver(e, today, time)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, today, time)}
                  >
                    <div className="w-14 flex-shrink-0 text-right pr-2 pt-1">
                      <span className="text-xs text-muted-foreground">{time}</span>
                    </div>
                    <div className="flex-1 border-l border-border/50 hover:bg-accent/20 transition-colors" />
                  </div>
                );
              })}

              {/* Scheduled tasks overlay */}
              <div className="absolute top-0 left-14 right-0 pointer-events-none">
                {todayScheduledTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className={`
                      absolute left-1 right-1 p-2 rounded-lg border cursor-pointer pointer-events-auto
                      border-l-4 ${getPriorityBorderColor(task.priority)}
                      bg-primary/20 hover:bg-primary/30 transition-colors
                      overflow-hidden
                    `}
                    style={getTaskStyle(task)}
                  >
                    <p className="text-xs font-semibold truncate text-foreground">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {task.start_time?.substring(0, 5)} - {task.end_time?.substring(0, 5)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
