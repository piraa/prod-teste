import React from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  Activity,
  Flag,
  StickyNote,
  BarChart2,
  Zap,
  LogOut
} from 'lucide-react';

export type PageType = 'dashboard' | 'tasks' | 'habits' | 'goals' | 'notes' | 'analytics' | 'planner';

interface SidebarProps {
  userAvatar: string;
  userName: string;
  userEmail: string;
  isOpen: boolean;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userAvatar,
  userName,
  userEmail,
  isOpen,
  currentPage,
  onNavigate,
  onSignOut
}) => {
  const containerClasses = `
    fixed lg:static inset-y-0 left-0 z-30
    w-64 bg-sidebar text-sidebar-foreground
    border-r border-sidebar-border
    flex flex-col transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  const navItems: { page: PageType; icon: React.ElementType; label: string }[] = [
    { page: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { page: 'tasks', icon: CheckCircle2, label: 'Minhas Tarefas' },
    { page: 'habits', icon: Activity, label: 'Hábitos' },
    { page: 'goals', icon: Flag, label: 'Objetivos' },
    { page: 'notes', icon: StickyNote, label: 'Anotações' },
    { page: 'analytics', icon: BarChart2, label: 'Análises' },
  ];

  return (
    <aside className={containerClasses}>
      <div className="p-6">
        <div
          className="flex items-center gap-3 mb-8 cursor-pointer"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">Produtivo.AI</span>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ page, icon: Icon, label }) => (
            <NavItem
              key={page}
              icon={Icon}
              label={label}
              active={currentPage === page}
              onClick={() => onNavigate(page)}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        {/* Pro Plan Card */}
        <div className="p-4 bg-sidebar-accent/50 rounded-xl border border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" fill="currentColor" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plano Pro</p>
          </div>
          <p className="text-sm mb-3 text-sidebar-foreground/80 leading-relaxed">Acesse todas as métricas avançadas.</p>
          <button className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:brightness-90 transition-all shadow-sm">
            Upgrade
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pt-4 border-t border-sidebar-border">
          <img
            src={userAvatar}
            alt={userName}
            className="w-10 h-10 rounded-full border-2 border-sidebar-border object-cover"
          />
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick }) => {
  const className = `
    flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer
    ${active
      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
    }
  `;

  return (
    <button onClick={onClick} className={`w-full text-left ${className}`}>
      <Icon size={20} strokeWidth={2} />
      {label}
    </button>
  );
};
