import React from 'react';
import { Menu, Moon, Sun, Bell, Plus } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  toggleTheme: () => void;
  isDark: boolean;
  onNewTask: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, toggleTheme, isDark, onNewTask }) => {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md px-6 lg:px-8 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center gap-4 text-muted-foreground">
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden p-1 hover:text-foreground transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="hidden lg:block h-4 w-px bg-border mx-2"></div>
        <h1 className="text-sm font-semibold text-foreground">Dashboard do dia</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors relative group">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive border-2 border-background rounded-full"></span>
        </button>

        <button
          onClick={onNewTask}
          className="bg-primary hover:brightness-105 text-primary-foreground px-3 sm:px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </button>
      </div>
    </header>
  );
};