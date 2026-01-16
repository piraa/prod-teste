import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    estimated_minutes: number | null;
    start_time: string | null;
    end_time: string | null;
  }) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  task?: Task | null; // If provided, we're editing; otherwise, creating
}

const ESTIMATE_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCustomEstimate, setShowCustomEstimate] = useState(false);
  const [customEstimateInput, setCustomEstimateInput] = useState('');

  const isEditing = !!task;

  // Calculate estimated minutes from start and end time
  const calculateEstimateFromTimes = (start: string, end: string): number | null => {
    if (!start || !end) return null;
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    const diff = endTotal - startTotal;
    return diff > 0 ? diff : null;
  };

  // Check if we have both times defined
  const hasDefinedTimes = startTime && endTime;
  const calculatedEstimate = calculateEstimateFromTimes(startTime, endTime);

  // Format minutes to display string
  const formatEstimate = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setEstimatedMinutes(task.estimated_minutes);
      setStartTime(task.start_time ? task.start_time.substring(0, 5) : '');
      setEndTime(task.end_time ? task.end_time.substring(0, 5) : '');
      // Check if estimate is custom (not in predefined options)
      const isCustom = task.estimated_minutes && !ESTIMATE_OPTIONS.some(opt => opt.value === task.estimated_minutes);
      setShowCustomEstimate(isCustom || false);
      setCustomEstimateInput(isCustom && task.estimated_minutes ? task.estimated_minutes.toString() : '');
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setEstimatedMinutes(null);
      setStartTime('');
      setEndTime('');
      setShowCustomEstimate(false);
      setCustomEstimateInput('');
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Use calculated estimate if times are defined, otherwise use manual estimate
    const finalEstimate = hasDefinedTimes && calculatedEstimate
      ? calculatedEstimate
      : estimatedMinutes;

    console.log('TaskModal handleSubmit:', {
      hasDefinedTimes,
      calculatedEstimate,
      estimatedMinutes,
      finalEstimate,
      startTime,
      endTime,
    });

    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      estimated_minutes: finalEstimate,
      start_time: startTime || null,
      end_time: endTime || null,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;

    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-md mx-4 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-bold text-foreground">
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da tarefa"
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Prioridade
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === p
                      ? p === 'low'
                        ? 'bg-slate-500/20 text-slate-700 dark:text-slate-300 ring-2 ring-slate-500'
                        : p === 'medium'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500'
                        : 'bg-red-500/20 text-red-700 dark:text-red-300 ring-2 ring-red-500'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Horários */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <Clock size={14} className="inline mr-1" />
              Horário
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="Início"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground mt-1 block">Início</span>
              </div>
              <div className="flex-1">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Fim"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground mt-1 block">Fim</span>
              </div>
            </div>
          </div>

          {/* Estimativa */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Estimativa de Duração
            </label>
            {hasDefinedTimes && calculatedEstimate ? (
              <div className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                <span className="text-sm font-medium text-primary">
                  {formatEstimate(calculatedEstimate)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  (calculado automaticamente)
                </span>
              </div>
            ) : showCustomEstimate ? (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={customEstimateInput}
                  onChange={(e) => {
                    setCustomEstimateInput(e.target.value);
                    const value = parseInt(e.target.value);
                    setEstimatedMinutes(value > 0 ? value : null);
                  }}
                  placeholder="Minutos"
                  min="1"
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">min</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomEstimate(false);
                    setCustomEstimateInput('');
                    setEstimatedMinutes(null);
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ESTIMATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEstimatedMinutes(estimatedMinutes === opt.value ? null : opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      estimatedMinutes === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomEstimate(true)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
                >
                  Personalizado
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
