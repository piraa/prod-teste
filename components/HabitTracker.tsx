import React from 'react';
import { History } from 'lucide-react';
import { Habit } from '../types';

interface HabitTrackerProps {
  habits: Habit[];
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits }) => {
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden h-fit">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="font-bold flex items-center gap-2">
          <History className="text-primary" size={20} />
          Rastreador de Hábitos
        </h3>
        <div className="flex gap-1 sm:gap-1.5 self-end sm:self-auto">
          {days.map((day, i) => (
            <span key={i} className="text-[10px] font-bold text-muted-foreground w-5 sm:w-6 text-center">{day}</span>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center justify-between">
            <div className="flex flex-col flex-1 min-w-0 mr-4">
              <span className="text-sm font-semibold truncate">{habit.title}</span>
              <span className="text-xs text-muted-foreground truncate">{habit.meta}</span>
            </div>
            <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
              {habit.history.map((done, index) => (
                <div 
                  key={index} 
                  className={`
                    w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-colors
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