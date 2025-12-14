import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTaskStore } from '../store/useTaskStore';
import { Bell, LayoutDashboard, Plus, AlertTriangle, AlertCircle, Clock, Calendar, ListTodo, BarChart2, Home, FileText } from 'lucide-react';
import { Button, Badge, Card } from './ui/Common';
import { cn } from '../lib/utils';

const Layout: React.FC = () => {
  const location = useLocation();
  const tasks = useTaskStore(state => state.tasks);
  const { notifications, refreshNotifications, clearNotification } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    refreshNotifications(tasks);
  }, [tasks, refreshNotifications]);

  const criticalCount = notifications.filter(n => n.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar / Navigation */}
      <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card p-4 flex flex-col sticky top-0 md:h-screen z-10">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">DevTracker</h1>
        </div>

        <div className="space-y-2 flex-1">
          <Link to="/">
            <Button variant={location.pathname === '/' ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link to="/tasks">
            <Button variant={location.pathname === '/tasks' ? 'secondary' : 'ghost'} className="w-full justify-start">
              <ListTodo className="mr-2 h-4 w-4" />
              Tasks
            </Button>
          </Link>
          <Link to="/calendar">
            <Button variant={location.pathname === '/calendar' ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
          </Link>
          <Link to="/metrics">
            <Button variant={location.pathname === '/metrics' ? 'secondary' : 'ghost'} className="w-full justify-start">
              <BarChart2 className="mr-2 h-4 w-4" />
              Metrics
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant={location.pathname === '/reports' ? 'secondary' : 'ghost'} className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </Link>
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <div className="relative">
            <Button
              variant="ghost"
              className="w-full justify-start relative"
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
              <div className="absolute bottom-full left-0 w-80 mb-2 z-50 animate-in fade-in zoom-in-95 duration-200">
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
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;