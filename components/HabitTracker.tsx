import React, { useState, useMemo } from 'react';
import { History, Plus, Flame } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { HabitModal } from './HabitModal';

interface HabitTrackerProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  onToggleHabit: (habitId: string, date: string, completed: boolean) => Promise<void>;
  onAddHabit: (habitData: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    target_days: string[] | null;
  }) => Promise<void>;
  onUpdateHabit: (habitId: string, habitData: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    target_days: string[] | null;
  }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  habitLogs,
  onToggleHabit,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Generate the last 7 days (today is the last one)
  const last7Days = useMemo(() => {
    const days: { date: string; dayLabel: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      days.push({
        date: dateStr,
        dayLabel: dayLabels[d.getDay()]
      });
    }
    return days;
  }, []);

  // Calculate history for a habit (last 7 days)
  const getHabitHistory = (habitId: string): boolean[] => {
    return last7Days.map(({ date }) => {
      const log = habitLogs.find(
        (l) => l.habit_id === habitId && l.logged_date === date
      );
      return log?.completed || false;
    });
  };

  // Calculate streak for a habit (consecutive days completed up to today)
  const calculateStreak = (habitId: string): number => {
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    const currentDate = new Date();

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const log = habitLogs.find(
        (l) => l.habit_id === habitId && l.logged_date === dateStr && l.completed
      );

      if (log) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If today is not completed, check if yesterday started a streak
        if (dateStr === today) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  // Get frequency label
  const getFrequencyLabel = (habit: Habit): string => {
    switch (habit.frequency) {
      case 'daily':
        return 'Todos os dias';
      case 'weekdays':
        return 'Seg - Sex';
      case 'custom':
        if (habit.target_days && habit.target_days.length > 0) {
          const dayMap: Record<string, string> = {
            'Mon': 'Seg', 'Tue': 'Ter', 'Wed': 'Qua',
            'Thu': 'Qui', 'Fri': 'Sex', 'Sat': 'Sáb', 'Sun': 'Dom'
          };
          return habit.target_days.map(d => dayMap[d] || d).join(', ');
        }
        return 'Personalizado';
      default:
        return '';
    }
  };

  const handleToggle = async (habitId: string, dayIndex: number) => {
    const { date } = last7Days[dayIndex];
    const history = getHabitHistory(habitId);
    const currentValue = history[dayIndex];
    await onToggleHabit(habitId, date, !currentValue);
  };

  const handleOpenNewHabit = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleSaveHabit = async (habitData: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    target_days: string[] | null;
  }) => {
    if (editingHabit) {
      await onUpdateHabit(editingHabit.id, habitData);
    } else {
      await onAddHabit(habitData);
    }
  };

  return (
    <>
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden h-fit">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold flex items-center gap-2">
              <History className="text-primary" size={20} />
              Rastreador de Hábitos
            </h3>
            <button
              onClick={handleOpenNewHabit}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Adicionar hábito"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex gap-1 sm:gap-1.5 self-end sm:self-auto">
            {last7Days.map((day, i) => (
              <span key={i} className="text-[10px] font-bold text-muted-foreground w-5 sm:w-6 text-center">
                {day.dayLabel}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {habits.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Nenhum hábito cadastrado
              </p>
              <button
                onClick={handleOpenNewHabit}
                className="text-sm text-primary hover:underline"
              >
                Criar primeiro hábito
              </button>
            </div>
          ) : (
            habits.map((habit) => {
              const history = getHabitHistory(habit.id);
              const streak = calculateStreak(habit.id);

              return (
                <div key={habit.id} className="flex items-center justify-between">
                  <div
                    className="flex flex-col flex-1 min-w-0 mr-4 cursor-pointer"
                    onClick={() => handleEditHabit(habit)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{habit.title}</span>
                      {streak > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-orange-500 font-medium">
                          <Flame size={12} />
                          {streak}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {getFrequencyLabel(habit)}
                    </span>
                  </div>
                  <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
                    {history.map((done, index) => (
                      <button
                        key={index}
                        onClick={() => handleToggle(habit.id, index)}
                        className={`
                          w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-all cursor-pointer
                          hover:ring-2 hover:ring-primary/50
                          ${done
                            ? 'bg-primary'
                            : 'bg-muted hover:bg-muted/80'
                          }
                        `}
                        title={`${last7Days[index].date} - ${done ? 'Completo' : 'Não completo'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <HabitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveHabit}
        onDelete={onDeleteHabit}
        habit={editingHabit}
      />
    </>
  );
};
