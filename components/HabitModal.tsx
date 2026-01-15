import React, { useState, useEffect } from 'react';
import { X, Trash2, Target } from 'lucide-react';
import { Habit } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    target_days: string[] | null;
    goal_target: number | null;
    goal_period: 'weekly' | 'monthly' | 'yearly' | null;
  }) => Promise<void>;
  onDelete?: (habitId: string) => Promise<void>;
  habit?: Habit | null;
}

const WEEKDAYS = [
  { value: 'Mon', label: 'Seg' },
  { value: 'Tue', label: 'Ter' },
  { value: 'Wed', label: 'Qua' },
  { value: 'Thu', label: 'Qui' },
  { value: 'Fri', label: 'Sex' },
  { value: 'Sat', label: 'Sáb' },
  { value: 'Sun', label: 'Dom' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  habit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [targetDays, setTargetDays] = useState<string[]>([]);
  const [hasGoal, setHasGoal] = useState(false);
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [goalPeriod, setGoalPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!habit;

  // Populate form when editing
  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || '');
      setFrequency(habit.frequency);
      setTargetDays(habit.target_days || []);
      setHasGoal(!!habit.goal_target);
      setGoalTarget(habit.goal_target);
      setGoalPeriod(habit.goal_period || 'monthly');
    } else {
      setTitle('');
      setDescription('');
      setFrequency('daily');
      setTargetDays([]);
      setHasGoal(false);
      setGoalTarget(null);
      setGoalPeriod('monthly');
    }
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      frequency,
      target_days: frequency === 'custom' ? targetDays :
                   frequency === 'weekdays' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : null,
      goal_target: hasGoal ? goalTarget : null,
      goal_period: hasGoal ? goalPeriod : null,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!habit || !onDelete) return;
    setDeleting(true);
    await onDelete(habit.id);
    setDeleting(false);
    onClose();
  };

  const toggleDay = (day: string) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
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
            {isEditing ? 'Editar Hábito' : 'Novo Hábito'}
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
              Nome do Hábito *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Treino de Jiu-Jitsu"
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
              rows={2}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Frequência
            </label>
            <div className="flex gap-2">
              {([
                { value: 'daily', label: 'Diário' },
                { value: 'weekdays', label: 'Dias úteis' },
                { value: 'custom', label: 'Personalizado' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    frequency === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Dias da Semana
              </label>
              <div className="flex gap-1">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                      targetDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasGoal}
                onChange={(e) => setHasGoal(e.target.checked)}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <Target size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Definir meta</span>
            </label>

            {hasGoal && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={goalTarget || ''}
                      onChange={(e) => setGoalTarget(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Ex: 20"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">
                      Período
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setGoalPeriod('weekly')}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          goalPeriod === 'weekly'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalPeriod('monthly')}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          goalPeriod === 'monthly'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        Mês
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalPeriod('yearly')}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                          goalPeriod === 'yearly'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        Ano
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {goalTarget && goalPeriod === 'yearly'
                    ? `Meta: ${goalTarget} vezes por ano`
                    : goalTarget && goalPeriod === 'monthly'
                    ? `Meta: ${goalTarget} vezes por mês`
                    : goalTarget && goalPeriod === 'weekly'
                    ? `Meta: ${goalTarget} vezes por semana`
                    : 'Defina quantas vezes deseja completar este hábito'}
                </p>
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
