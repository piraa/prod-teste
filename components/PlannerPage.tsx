import React, { useState, useMemo } from 'react';
import {
  Wand2,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Task } from '../types';
import {
  PlannerStep,
  PrioritySuggestion,
  DurationEstimate,
  ScheduleSuggestion,
  TaskUpdate,
} from '../types/planner';
import { analyzePriorities, estimateDurations, scheduleTasks } from '../lib/planner-api';
import { supabase } from '../lib/supabase';
import { PageType } from './Sidebar';

interface PlannerPageProps {
  tasks: Task[];
  onApplyPlan: (updates: TaskUpdate[]) => Promise<void>;
  onNavigate: (page: PageType) => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({
  tasks,
  onApplyPlan,
  onNavigate,
}) => {
  const [step, setStep] = useState<PlannerStep>(1);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [priorities, setPriorities] = useState<Record<string, PrioritySuggestion>>({});
  const [estimates, setEstimates] = useState<Record<string, DurationEstimate>>({});
  const [schedule, setSchedule] = useState<Record<string, ScheduleSuggestion>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get inbox tasks (without due date)
  const inboxTasks = useMemo(() => {
    return tasks.filter((task) => !task.due_date && !task.completed);
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    return inboxTasks.filter((task) => selectedTaskIds.has(task.id));
  }, [inboxTasks, selectedTaskIds]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    setSelectedTaskIds(new Set(inboxTasks.map((t) => t.id)));
  };

  const deselectAllTasks = () => {
    setSelectedTaskIds(new Set());
  };

  const handleAnalyzePriorities = async () => {
    if (selectedTaskIds.size === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const result = await analyzePriorities({
        taskIds: Array.from(selectedTaskIds),
        accessToken: session.access_token,
      });

      const prioritiesMap: Record<string, PrioritySuggestion> = {};
      result.suggestions.forEach((s) => {
        const task = inboxTasks.find((t) => t.id === s.task_id);
        prioritiesMap[s.task_id] = {
          taskId: s.task_id,
          title: s.title,
          currentPriority: task?.priority || 'medium',
          suggestedPriority: s.suggested_priority,
          reason: s.reason,
        };
      });

      setPriorities(prioritiesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar prioridades');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEstimateDurations = async () => {
    if (selectedTaskIds.size === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const result = await estimateDurations({
        taskIds: Array.from(selectedTaskIds),
        accessToken: session.access_token,
      });

      const estimatesMap: Record<string, DurationEstimate> = {};
      result.estimates.forEach((e) => {
        const task = inboxTasks.find((t) => t.id === e.task_id);
        estimatesMap[e.task_id] = {
          taskId: e.task_id,
          title: e.title,
          currentMinutes: task?.estimated_minutes || null,
          suggestedMinutes: e.estimated_minutes,
          reason: e.reason,
        };
      });

      setEstimates(estimatesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao estimar durações');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScheduleTasks = async () => {
    if (selectedTaskIds.size === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const result = await scheduleTasks({
        taskIds: Array.from(selectedTaskIds),
        accessToken: session.access_token,
      });

      const scheduleMap: Record<string, ScheduleSuggestion> = {};
      result.schedule.forEach((s) => {
        const task = inboxTasks.find((t) => t.id === s.task_id);
        scheduleMap[s.task_id] = {
          taskId: s.task_id,
          title: task?.title || '',
          dueDate: s.due_date,
          startTime: s.start_time,
          endTime: s.end_time,
        };
      });

      setSchedule(scheduleMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar tarefas');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyPlan = async () => {
    setIsApplying(true);
    setError(null);

    try {
      const updates: TaskUpdate[] = Array.from(selectedTaskIds).map((taskId) => {
        const update: TaskUpdate = { taskId };

        if (priorities[taskId]) {
          update.priority = priorities[taskId].suggestedPriority;
        }

        if (estimates[taskId]) {
          update.estimatedMinutes = estimates[taskId].suggestedMinutes;
        }

        if (schedule[taskId]) {
          update.dueDate = schedule[taskId].dueDate;
          update.startTime = schedule[taskId].startTime;
          update.endTime = schedule[taskId].endTime;
        }

        return update;
      });

      await onApplyPlan(updates);
      onNavigate('tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar planejamento');
    } finally {
      setIsApplying(false);
    }
  };

  const updatePriority = (taskId: string, priority: 'low' | 'medium' | 'high') => {
    setPriorities((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], suggestedPriority: priority },
    }));
  };

  const updateEstimate = (taskId: string, minutes: number) => {
    setEstimates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], suggestedMinutes: minutes },
    }));
  };

  const priorityColors = {
    low: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300',
    medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300',
    high: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-300',
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const totalMinutes = useMemo(() => {
    return Object.values(estimates).reduce((sum, e) => sum + e.suggestedMinutes, 0);
  }, [estimates]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  const canProceedToStep2 = selectedTaskIds.size > 0 && Object.keys(priorities).length > 0;
  const canProceedToStep3 = canProceedToStep2 && Object.keys(estimates).length > 0;
  const canApply = canProceedToStep3 && Object.keys(schedule).length > 0;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wand2 className="text-primary" size={32} />
            Planejador
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize suas tarefas da caixa de entrada em 3 passos
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <button
                onClick={() => {
                  if (s === 1) setStep(1);
                  else if (s === 2 && canProceedToStep2) setStep(2);
                  else if (s === 3 && canProceedToStep3) setStep(3);
                }}
                disabled={
                  (s === 2 && !canProceedToStep2) ||
                  (s === 3 && !canProceedToStep3)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : step > s
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                    : 'bg-muted text-muted-foreground'
                } ${
                  (s === 2 && !canProceedToStep2) || (s === 3 && !canProceedToStep3)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:brightness-105'
                }`}
              >
                {step > s ? <Check size={16} /> : <span>{s}</span>}
                <span className="hidden sm:inline">
                  {s === 1 ? 'Priorizar' : s === 2 ? 'Estimar' : 'Agendar'}
                </span>
              </button>
              {s < 3 && (
                <ChevronRight size={20} className="text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Step 1: Select & Prioritize */}
          {step === 1 && (
            <>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Selecione e Priorize</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Escolha as tarefas da caixa de entrada para planejar
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllTasks}
                      className="text-sm text-primary hover:underline"
                    >
                      Selecionar todas
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      onClick={deselectAllTasks}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                {inboxTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wand2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Sua caixa de entrada está vazia!</p>
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="mt-2 text-primary hover:underline"
                    >
                      Voltar para Minhas Tarefas
                    </button>
                  </div>
                ) : (
                  inboxTasks.map((task) => {
                    const isSelected = selectedTaskIds.has(task.id);
                    const priority = priorities[task.id];

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleTaskSelection(task.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="pt-0.5">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-muted-foreground'
                              }`}
                            >
                              {isSelected && <Check size={12} />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {task.description}
                              </p>
                            )}
                            {priority && (
                              <div className="mt-2 flex items-center gap-2">
                                <select
                                  value={priority.suggestedPriority}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updatePriority(
                                      task.id,
                                      e.target.value as 'low' | 'medium' | 'high'
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`text-xs font-semibold px-2 py-1 rounded border ${
                                    priorityColors[priority.suggestedPriority]
                                  }`}
                                >
                                  <option value="low">Baixa</option>
                                  <option value="medium">Média</option>
                                  <option value="high">Alta</option>
                                </select>
                                <span className="text-xs text-muted-foreground">
                                  {priority.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedTaskIds.size} tarefa(s) selecionada(s)
                </span>
                <div className="flex items-center gap-3">
                  {Object.keys(priorities).length === 0 && selectedTaskIds.size > 0 && (
                    <button
                      onClick={handleAnalyzePriorities}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      Analisar com IA
                    </button>
                  )}
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedToStep2}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Estimate Duration */}
          {step === 2 && (
            <>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Clock size={20} className="text-primary" />
                      Estimar Duração
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Defina quanto tempo cada tarefa vai levar
                    </p>
                  </div>
                  {Object.keys(estimates).length > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total estimado</p>
                      <p className="text-lg font-bold text-primary">
                        {formatDuration(totalMinutes)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                {selectedTasks.map((task) => {
                  const estimate = estimates[task.id];
                  const priority = priorities[task.id];

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{task.title}</p>
                            {priority && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  priorityColors[priority.suggestedPriority]
                                }`}
                              >
                                {priorityLabels[priority.suggestedPriority]}
                              </span>
                            )}
                          </div>
                          {estimate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {estimate.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {estimate ? (
                            <div className="flex items-center gap-1">
                              {[15, 30, 45, 60, 90, 120].map((mins) => (
                                <button
                                  key={mins}
                                  onClick={() => updateEstimate(task.id, mins)}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    estimate.suggestedMinutes === mins
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                >
                                  {formatDuration(mins)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Aguardando análise...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft size={16} />
                  Voltar
                </button>
                <div className="flex items-center gap-3">
                  {Object.keys(estimates).length === 0 && (
                    <button
                      onClick={handleEstimateDurations}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      Estimar com IA
                    </button>
                  )}
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceedToStep3}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <>
              <div className="p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    Agendar Tarefas
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Distribua as tarefas na sua agenda
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                {Object.keys(schedule).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Clique em "Agendar com IA" para distribuir as tarefas</p>
                  </div>
                ) : (
                  // Group by date
                  Object.entries(
                    Object.values(schedule).reduce((acc, item) => {
                      if (!acc[item.dueDate]) acc[item.dueDate] = [];
                      acc[item.dueDate].push(item);
                      return acc;
                    }, {} as Record<string, ScheduleSuggestion[]>)
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, items]) => (
                      <div key={date} className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(date)}
                        </h3>
                        {items
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((item) => {
                            const priority = priorities[item.taskId];
                            const estimate = estimates[item.taskId];

                            return (
                              <div
                                key={item.taskId}
                                className="p-3 rounded-lg border border-border bg-muted/30 ml-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-mono text-primary">
                                      {item.startTime} - {item.endTime}
                                    </span>
                                    <span className="font-medium">{item.title}</span>
                                    {priority && (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                          priorityColors[priority.suggestedPriority]
                                        }`}
                                      >
                                        {priorityLabels[priority.suggestedPriority]}
                                      </span>
                                    )}
                                  </div>
                                  {estimate && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatDuration(estimate.suggestedMinutes)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ))
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft size={16} />
                  Voltar
                </button>
                <div className="flex items-center gap-3">
                  {Object.keys(schedule).length === 0 && (
                    <button
                      onClick={handleScheduleTasks}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      Agendar com IA
                    </button>
                  )}
                  <button
                    onClick={handleApplyPlan}
                    disabled={!canApply || isApplying}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplying ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Aplicar Planejamento
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
