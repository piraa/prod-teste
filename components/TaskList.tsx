import React, { useState } from 'react';
import { ListTodo, ChevronLeft, ChevronRight, ChevronDown, Check, Inbox } from 'lucide-react';
import { Task } from '../types';
import { fireConfetti } from '../utils/confetti';

interface TaskListProps {
  tasks: Task[];
  allTasks: Task[]; // All tasks including those without due_date
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onQuickAdd?: (title: string) => Promise<void>;
  onToggleComplete?: (taskId: string, completed: boolean) => Promise<void>;
  onEditTask?: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  allTasks,
  selectedDate,
  onDateChange,
  onQuickAdd,
  onToggleComplete,
  onEditTask
}) => {
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  // Inbox: tasks without due_date
  const inboxTasks = allTasks.filter((task) => !task.due_date && !task.completed);

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // Calculate progress percentage
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleQuickAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickTaskTitle.trim() && onQuickAdd) {
      setIsAdding(true);
      await onQuickAdd(quickTaskTitle.trim());
      setQuickTaskTitle('');
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentCompleted: boolean, event: React.MouseEvent) => {
    const newValue = !currentCompleted;

    // Fire confetti when completing a task
    if (newValue) {
      fireConfetti(event);
    }

    if (onToggleComplete) {
      await onToggleComplete(taskId, newValue);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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

  const TaskItem = ({ task, isCompleted }: { task: Task; isCompleted: boolean; key?: string }) => (
    <div className="flex items-start gap-4 group">
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
        onClick={() => onEditTask?.(task)}
      >
        <p className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {task.description}
          </p>
        )}
      </div>
      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide ${priorityColors[task.priority]}`}>
        {priorityLabels[task.priority]}
      </span>
    </div>
  );

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-fit">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <ListTodo className="text-primary" size={20} />
          Foco Diário
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[70px] text-center">
            {formatDate(selectedDate)}
          </span>
          <button
            onClick={goToNextDay}
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
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

      <div className="p-6 space-y-5">
        {pendingTasks.map((task) => (
          <TaskItem key={task.id} task={task} isCompleted={false} />
        ))}

        {pendingTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
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
            <div className="px-6 pb-6 space-y-5">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} isCompleted={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inbox - Tasks without due date */}
      {inboxTasks.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowInbox(!showInbox)}
            className="w-full px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Inbox size={16} className="text-primary" />
            <span className="flex-1 text-left">Caixa de Entrada</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {inboxTasks.length}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showInbox ? 'rotate-180' : ''}`}
            />
          </button>

          {showInbox && (
            <div className="px-6 pb-6 space-y-5">
              {inboxTasks.map((task) => (
                <TaskItem key={task.id} task={task} isCompleted={false} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto bg-muted/50 p-4 border-t border-border">
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
  );
};
