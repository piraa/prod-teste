import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Clock } from 'lucide-react';
import { Task } from '../types';

interface TimeBlockingViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onUpdateTaskTime: (taskId: string, date: string, startTime: string, endTime: string) => Promise<void>;
}

// Generate time slots from 6:00 to 22:00 in 30-min intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const SLOT_HEIGHT = 40; // pixels per 30-min slot

export const TimeBlockingView: React.FC<TimeBlockingViewProps> = ({
  tasks,
  onEditTask,
  onUpdateTaskTime
}) => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Drag state
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ date: string; time: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  const formatDayHeader = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = dayNames[date.getDay()];
    const dayNum = date.getDate();

    return { dayName, dayNum, isToday };
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() - 5);
    setStartDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + 5);
    setStartDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today);
  };

  // Get tasks for a specific day
  const getTasksForDay = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date || !task.start_time) return false;
      const taskDateStr = task.due_date.split('T')[0];
      return taskDateStr === dateStr;
    });
  };

  // Get unscheduled tasks (tasks without time but with date, or without date)
  const unscheduledTasks = tasks.filter(task => {
    if (task.completed) return false;
    // Tasks without start_time are unscheduled
    return !task.start_time;
  });

  // Calculate task position and height
  const getTaskStyle = (task: Task): React.CSSProperties => {
    if (!task.start_time) return {};

    const [startHour, startMin] = task.start_time.split(':').map(Number);
    const startSlotIndex = (startHour - 6) * 2 + (startMin >= 30 ? 1 : 0);

    let durationSlots = 2; // Default 1 hour
    if (task.end_time) {
      const [endHour, endMin] = task.end_time.split(':').map(Number);
      const endSlotIndex = (endHour - 6) * 2 + (endMin >= 30 ? 1 : 0);
      durationSlots = Math.max(1, endSlotIndex - startSlotIndex);
    } else if (task.estimated_minutes) {
      durationSlots = Math.max(1, Math.ceil(task.estimated_minutes / 30));
    }

    return {
      top: `${startSlotIndex * SLOT_HEIGHT}px`,
      height: `${durationSlots * SLOT_HEIGHT - 4}px`,
    };
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-400';
      case 'medium': return 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-400';
      case 'low': return 'bg-slate-500/20 border-slate-500/50 text-slate-700 dark:text-slate-400';
      default: return 'bg-primary/20 border-primary/50';
    }
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

    if (!draggingTask) return;

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

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">
          Arraste tarefas para agendar
        </span>
      </div>

      <div className="flex">
        {/* Unscheduled tasks sidebar */}
        <div className="w-48 border-r border-border bg-muted/30 flex-shrink-0">
          <div className="p-3 border-b border-border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Sem horário ({unscheduledTasks.length})
            </h4>
          </div>
          <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
            {unscheduledTasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onClick={() => onEditTask(task)}
                className={`p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-sm ${getPriorityColor(task.priority)}`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{task.title}</p>
                    {task.estimated_minutes && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock size={10} />
                        {task.estimated_minutes < 60
                          ? `${task.estimated_minutes}min`
                          : `${Math.floor(task.estimated_minutes / 60)}h${task.estimated_minutes % 60 > 0 ? task.estimated_minutes % 60 : ''}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {unscheduledTasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma tarefa sem horário
              </p>
            )}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10">
              <div className="w-16 flex-shrink-0 border-r border-border" />
              {days.map((date, i) => {
                const { dayName, dayNum, isToday } = formatDayHeader(date);
                return (
                  <div
                    key={i}
                    className={`flex-1 p-3 text-center border-r border-border last:border-r-0 ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{dayName}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {dayNum}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div ref={gridRef} className="relative flex">
              {/* Time labels */}
              <div className="w-16 flex-shrink-0 border-r border-border">
                {TIME_SLOTS.map((time, i) => (
                  <div
                    key={time}
                    className="border-b border-border/50 text-right pr-2 text-xs text-muted-foreground"
                    style={{ height: `${SLOT_HEIGHT}px`, lineHeight: `${SLOT_HEIGHT}px` }}
                  >
                    {time.endsWith(':00') ? time : ''}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((date, dayIndex) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayTasks = getTasksForDay(date);
                const { isToday } = formatDayHeader(date);

                return (
                  <div
                    key={dayIndex}
                    className={`flex-1 border-r border-border last:border-r-0 relative ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Time slots (drop zones) */}
                    {TIME_SLOTS.map((time) => {
                      const isDropTarget = dragOverSlot?.date === dateStr && dragOverSlot?.time === time;
                      return (
                        <div
                          key={time}
                          className={`border-b border-border/50 transition-colors ${
                            isDropTarget ? 'bg-primary/20' : 'hover:bg-accent/30'
                          }`}
                          style={{ height: `${SLOT_HEIGHT}px` }}
                          onDragOver={(e) => handleDragOver(e, date, time)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, date, time)}
                        />
                      );
                    })}

                    {/* Scheduled tasks */}
                    <div className="absolute inset-0 pointer-events-none">
                      {dayTasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, task);
                          }}
                          onDragEnd={handleDragEnd}
                          onClick={() => onEditTask(task)}
                          className={`absolute left-1 right-1 p-2 rounded-lg border cursor-grab active:cursor-grabbing pointer-events-auto overflow-hidden transition-shadow hover:shadow-md ${getPriorityColor(task.priority)} ${
                            draggingTask?.id === task.id ? 'opacity-50' : ''
                          }`}
                          style={getTaskStyle(task)}
                        >
                          <div className="flex items-start gap-1">
                            <GripVertical size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{task.title}</p>
                              {task.start_time && (
                                <p className="text-[10px] text-muted-foreground">
                                  {task.start_time.substring(0, 5)}
                                  {task.end_time && ` - ${task.end_time.substring(0, 5)}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
