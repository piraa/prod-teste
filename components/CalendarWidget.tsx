import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

export const CalendarWidget: React.FC = () => {
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const days = [
    { num: 28, isPrev: true }, { num: 29, isPrev: true }, { num: 30, isPrev: true }, 
    { num: 1 }, { num: 2 }, { num: 3 }, { num: 4 },
    { num: 5 }, { num: 6 }, { num: 7 }, { num: 8 }, { num: 9 }, { num: 10 }, { num: 11 },
    { num: 12 }, { num: 13 }, { num: 14 }, { num: 15, isToday: true }, { num: 16 }, { num: 17 }, { num: 18 },
    { num: 19 }, { num: 20 }, { num: 21 }, { num: 22 }, { num: 23 }, { num: 24 }, { num: 25 }
  ];

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold">Maio 2024</h3>
        <div className="flex gap-2">
          <button className="p-1 rounded hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-1 rounded hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 text-center text-xs mb-6">
        {weekDays.map((d) => (
          <span key={d} className="font-bold text-muted-foreground uppercase">{d}</span>
        ))}
        {days.map((day, i) => (
          <span 
            key={i} 
            className={`
              py-1 flex items-center justify-center font-medium rounded-full
              ${day.isPrev ? 'text-muted-foreground/50' : 'text-foreground'}
              ${day.isToday ? 'bg-primary text-primary-foreground font-bold shadow-sm' : ''}
            `}
          >
            {day.num}
          </span>
        ))}
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group">
          <div className="w-1.5 h-10 bg-primary rounded-full shadow-sm"></div>
          <div>
            <p className="text-sm font-semibold">Sprint Planning</p>
            <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">14:00 - 15:30</p>
          </div>
          <MoreVertical size={16} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group">
          <div className="w-1.5 h-10 bg-blue-400 rounded-full shadow-sm"></div>
          <div>
            <p className="text-sm font-semibold">Café com Beatriz</p>
            <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">16:30 - 17:00</p>
          </div>
          <MoreVertical size={16} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
};