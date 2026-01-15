import React from 'react';
import { Flag } from 'lucide-react';
import { Goal } from '../types';

interface GoalsWidgetProps {
  goals: Goal[];
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals }) => {
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between">
      <div>
        <h3 className="font-bold flex items-center gap-2 mb-6">
          <Flag className="text-primary" size={20} />
          Objetivos Trimestrais
        </h3>

        <div className="space-y-6">
          {goals.map((goal) => {
             const percentage = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
             const displayValue = goal.unit === '%' ? `${goal.current}%` : `${goal.current}/${goal.target}`;
             
             return (
              <div key={goal.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-muted-foreground font-medium">{displayValue}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="w-full mt-6 py-2.5 border border-border text-sm font-bold text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
        Ver Todos Objetivos
      </button>
    </div>
  );
};