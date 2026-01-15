import React, { useState } from 'react';
import { ListTodo } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onQuickAdd?: (title: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onQuickAdd }) => {
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleQuickAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickTaskTitle.trim() && onQuickAdd) {
      setIsAdding(true);
      await onQuickAdd(quickTaskTitle.trim());
      setQuickTaskTitle('');
      setIsAdding(false);
    }
  };
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-fit">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <ListTodo className="text-primary" size={20} />
          Foco Diário
        </h3>
        <button className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
          VER TUDO
        </button>
      </div>
      
      <div className="p-6 space-y-5">
        {tasks.map((task) => {
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
          const dueTime = task.due_date
            ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            : '';

          return (
            <div key={task.id} className="flex items-start gap-4 group">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  defaultChecked={task.completed}
                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {task.description || 'Sem descrição'} {dueTime && `• ${dueTime}`}
                </p>
              </div>
              <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
            </div>
          );
        })}
      </div>

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