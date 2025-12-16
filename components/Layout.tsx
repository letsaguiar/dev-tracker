import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTaskStore } from '../store/useTaskStore';
import { Bell, LayoutDashboard, Plus, AlertTriangle, AlertCircle, Clock, Calendar, ListTodo, BarChart2, Home, FileText, CheckSquare, Menu, X } from 'lucide-react';
import { Button, Badge, Card } from './ui/Common';
import { cn } from '../lib/utils';
import GlobalTimerHandler from './GlobalTimerHandler';
import TimerWidget from './TimerWidget';

const Layout: React.FC = () => {
  const location = useLocation();
  const tasks = useTaskStore(state => state.tasks);
  const { notifications, refreshNotifications } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    refreshNotifications(tasks);
  }, [tasks, refreshNotifications]);

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/metrics', label: 'Metrics', icon: BarChart2 },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans antialiased selection:bg-primary/20">
      {/* Global Timer Logic */}
      <GlobalTimerHandler />

      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 z-20",
        "fixed inset-y-0 left-0 md:relative"
      )}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tighter">
            DevTracker
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                location.pathname === path
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-colors",
                location.pathname === path ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {label}
              {location.pathname === path && (
                <div className="ml-auto w-1 h-1 rounded-full bg-current" />
              )}
            </Link>
          ))}
        </nav>

        {/* Notifications in Sidebar (Bottom) */}
        <div className="p-4 border-t border-border">
          <div className="relative">
            <Button
              variant="ghost"
              className="w-full justify-start relative px-3"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {notifications.length > 0 && (
                <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5">
                  {notifications.length}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute bottom-full left-0 w-64 mb-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <Card className="max-h-[400px] overflow-y-auto border-border shadow-xl">
                  <div className="p-3 border-b border-border font-semibold flex justify-between items-center bg-card sticky top-0">
                    <span>Notifications</span>
                    <Button size="sm" variant="ghost" onClick={() => setShowNotifications(false)} className="h-6 w-6 p-0">×</Button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">All caught up!</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map(n => {
                        const colorClass = n.severity === 'critical' ? 'text-red-500' : 'text-amber-500';
                        return (
                          <div key={n.id} className="p-3 hover:bg-accent/50 transition-colors">
                            <div className="flex items-start gap-3">
                              {n.type === 'Deadline' && <Clock className={cn("w-4 h-4 mt-1", colorClass)} />}
                              {n.type === 'RefinementDebt' && <AlertTriangle className={cn("w-4 h-4 mt-1", colorClass)} />}
                              {n.type === 'Staleness' && <AlertCircle className={cn("w-4 h-4 mt-1", colorClass)} />}

                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between">
                                  <Link to={`/task/${n.taskId}`} className="text-sm font-medium hover:underline" onClick={() => setShowNotifications(false)}>
                                    {n.taskCode}
                                  </Link>
                                  <span className={cn("text-[10px] uppercase font-bold", colorClass)}>{n.severity}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
          <Outlet />
        </div>

        {/* Floating Timer Widget */}
        <TimerWidget />

      </main>
    </div>
  );
};

export default Layout;