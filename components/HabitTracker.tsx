import React from 'react';
import { History } from 'lucide-react';
import { Habit } from '../types';

interface HabitTrackerProps {
  habits: Habit[];
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits }) => {
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <History className="text-primary" size={20} />
          Rastreador de Hábitos
        </h3>
        <div className="flex gap-1.5">
          {days.map((day, i) => (
            <span key={i} className="text-[10px] font-bold text-muted-foreground w-6 text-center">{day}</span>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{habit.title}</span>
              <span className="text-xs text-muted-foreground">{habit.meta}</span>
            </div>
            <div className="flex gap-1.5">
              {habit.history.map((done, index) => (
                <div 
                  key={index} 
                  className={`
                    w-6 h-6 rounded-md transition-colors
                    ${done 
                      ? 'bg-primary' 
                      : 'bg-muted'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};