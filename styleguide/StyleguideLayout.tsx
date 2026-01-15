import React from 'react';
import { cn } from '../lib/utils';
import { navigation } from './navigation';
import { Sun, Moon, X } from 'lucide-react';

interface StyleguideLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (id: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
}

export const StyleguideLayout: React.FC<StyleguideLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  isDark,
  onToggleTheme,
  onClose,
}) => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Fixed */}
      <aside className="w-64 border-r border-border bg-card p-6 flex flex-col gap-6 fixed top-0 left-0 h-screen overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Design System</h1>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
              !isDark ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun size={16} />
            Light
          </button>
          <button
            onClick={onToggleTheme}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
              isDark ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Moon size={16} />
            Dark
          </button>
        </div>

        <nav className="flex flex-col gap-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content - offset by sidebar width */}
      <main className="flex-1 ml-64 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
};
