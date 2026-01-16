import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { Task } from '../types';

interface CalendarWidgetProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEditTask?: (task: Task) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  tasks,
  selectedDate,
  onDateChange,
  onEditTask
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAllTasks, setShowAllTasks] = useState(false);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Get month name in Portuguese
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Day of week for first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Add days from next month to complete the grid (6 rows)
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentMonth]);

  // Check if a date has tasks
  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDateStr = task.due_date.split('T')[0];
      return taskDateStr === dateStr;
    });
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Navigate to previous month
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    setShowAllTasks(false); // Reset expansion when changing date
    onDateChange(date);
  };

  // Get tasks for selected date, sorted by start_time (earliest first)
  const selectedDateTasks = getTasksForDate(selectedDate).sort((a, b) => {
    // Tasks with start_time come first, sorted by time
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    // Tasks with start_time come before tasks without
    if (a.start_time && !b.start_time) return -1;
    if (!a.start_time && b.start_time) return 1;
    // Tasks without start_time maintain original order
    return 0;
  });

  // Format time for display (e.g., "09:00" -> "9:00")
  const formatTime = (time: string | null): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours)}:${minutes}`;
  };

  // Get priority color
  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-primary';
      case 'low': return 'bg-blue-400';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-1 rounded hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-2 text-center text-xs mb-4">
        {/* Week day headers */}
        {weekDays.map((d) => (
          <span key={d} className="font-bold text-muted-foreground uppercase py-2">{d}</span>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, i) => {
          const dayTasks = getTasksForDate(day.date);
          const hasTasks = dayTasks.length > 0;
          const hasIncompleteTasks = dayTasks.some(t => !t.completed);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day.date)}
              className={`
                relative py-1.5 flex flex-col items-center justify-center font-medium rounded-lg transition-all
                ${!day.isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                ${isToday(day.date) && !isSelected(day.date) ? 'bg-accent text-accent-foreground' : ''}
                ${isSelected(day.date) ? 'bg-primary text-primary-foreground font-bold shadow-sm' : ''}
                ${day.isCurrentMonth && !isSelected(day.date) && !isToday(day.date) ? 'hover:bg-accent/50' : ''}
              `}
            >
              <span>{day.date.getDate()}</span>
              {/* Task indicator */}
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

      {/* Selected Date Tasks */}
      <div className="space-y-2 pt-4 border-t border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Tarefas para {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
        </p>

        {selectedDateTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhuma tarefa para este dia</p>
        ) : (
          (showAllTasks ? selectedDateTasks : selectedDateTasks.slice(0, 3)).map((task) => (
            <div
              key={task.id}
              onClick={() => onEditTask?.(task)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group"
            >
              <div className={`w-1.5 ${task.start_time ? 'h-10' : 'h-8'} ${getPriorityColor(task.priority)} rounded-full shadow-sm ${task.completed ? 'opacity-50' : ''}`}></div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {task.start_time && (
                  <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                    {formatTime(task.start_time)}{task.end_time ? ` - ${formatTime(task.end_time)}` : ''}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        {selectedDateTasks.length > 3 && (
          <button
            onClick={() => setShowAllTasks(!showAllTasks)}
            className="text-xs text-primary hover:text-primary/80 text-center pt-1 w-full transition-colors"
          >
            {showAllTasks ? 'Mostrar menos' : `+${selectedDateTasks.length - 3} mais tarefas`}
          </button>
        )}
      </div>
    </div>
  );
};
