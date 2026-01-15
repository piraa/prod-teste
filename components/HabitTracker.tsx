import React, { useState, useMemo } from 'react';
import { History, Plus, Flame, Target } from 'lucide-react';
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
    goal_target: number | null;
    goal_period: 'weekly' | 'monthly' | 'yearly' | null;
  }) => Promise<void>;
  onUpdateHabit: (habitId: string, habitData: {
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    target_days: string[] | null;
    goal_target: number | null;
    goal_period: 'weekly' | 'monthly' | 'yearly' | null;
  }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
}

// Map JS day (0=Sun, 1=Mon, ...) to day code
const JS_DAY_TO_CODE: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
};

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
    const days: { date: string; dayLabel: string; dayCode: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      days.push({
        date: dateStr,
        dayLabel: dayLabels[d.getDay()],
        dayCode: JS_DAY_TO_CODE[d.getDay()]
      });
    }
    return days;
  }, []);

  // Check if a day is enabled for a habit based on its frequency
  const isDayEnabledForHabit = (habit: Habit, dayCode: string): boolean => {
    switch (habit.frequency) {
      case 'daily':
        return true;
      case 'weekdays':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(dayCode);
      case 'custom':
        return habit.target_days?.includes(dayCode) ?? false;
      default:
        return true;
    }
  };

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

  // Calculate goal progress for a habit
  const calculateGoalProgress = (habit: Habit): { current: number; target: number } | null => {
    if (!habit.goal_target || !habit.goal_period) return null;

    const today = new Date();
    let startDate: Date;

    if (habit.goal_period === 'weekly') {
      // Start of current week (Sunday)
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
    } else if (habit.goal_period === 'yearly') {
      // Start of current year
      startDate = new Date(today.getFullYear(), 0, 1);
    } else {
      // Start of current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const completedCount = habitLogs.filter(
      (l) =>
        l.habit_id === habit.id &&
        l.completed &&
        l.logged_date >= startDateStr &&
        l.logged_date <= todayStr
    ).length;

    return { current: completedCount, target: habit.goal_target };
  };

  // Get frequency label
  const getFrequencyLabel = (habit: Habit): string => {
    // If has goal, show goal progress instead
    if (habit.goal_target && habit.goal_period) {
      const progress = calculateGoalProgress(habit);
      if (progress) {
        const periodLabels: Record<string, string> = {
          'weekly': 'esta semana',
          'monthly': 'este mês',
          'yearly': 'este ano'
        };
        const periodLabel = periodLabels[habit.goal_period] || 'este período';
        return `${progress.current}/${progress.target} ${periodLabel}`;
      }
    }

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
    goal_target: number | null;
    goal_period: 'weekly' | 'monthly' | 'yearly' | null;
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
              const goalProgress = calculateGoalProgress(habit);

              return (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between">
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
                        {goalProgress && (
                          <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
                            <Target size={12} />
                            {goalProgress.current >= goalProgress.target ? '✓' : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {getFrequencyLabel(habit)}
                      </span>
                    </div>
                    <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
                      {history.map((done, index) => {
                        const dayInfo = last7Days[index];
                        const isScheduledDay = isDayEnabledForHabit(habit, dayInfo.dayCode);
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isPastDay = dayInfo.date < todayStr;
                        // Only scheduled days can be "missed" (red)
                        const isMissedDay = isScheduledDay && !done && isPastDay;

                        return (
                          <button
                            key={index}
                            onClick={() => handleToggle(habit.id, index)}
                            className={`
                              w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-all cursor-pointer
                              ${done
                                ? isScheduledDay
                                  ? 'bg-primary hover:ring-2 hover:ring-primary/50'
                                  : 'bg-primary/50 hover:ring-2 hover:ring-primary/30'
                                : isMissedDay
                                  ? 'bg-red-500/20 border border-red-500/40 hover:ring-2 hover:ring-red-500/50'
                                  : isScheduledDay
                                    ? 'bg-muted hover:bg-muted/80 hover:ring-2 hover:ring-primary/50'
                                    : 'bg-muted/30 hover:bg-muted/50 hover:ring-2 hover:ring-muted-foreground/30'
                              }
                            `}
                            title={
                              !isScheduledDay
                                ? `${dayInfo.date} - Dia extra (não programado)`
                                : isMissedDay
                                  ? `${dayInfo.date} - Dia perdido`
                                  : `${dayInfo.date} - ${done ? 'Completo' : 'Não completo'}`
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress bar for goals */}
                  {goalProgress && (
                    <div className="ml-0">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            goalProgress.current >= goalProgress.target
                              ? 'bg-green-500'
                              : 'bg-primary'
                          }`}
                          style={{
                            width: `${Math.min((goalProgress.current / goalProgress.target) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
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
