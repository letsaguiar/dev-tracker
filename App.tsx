import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import TasksView from './components/TasksView';
import TaskDetail from './components/TaskDetail';
import CalendarView from './components/CalendarView';
import MetricsView from './components/MetricsView';
import ReportsPage from './components/ReportsPage';
import DayTransitionModal from './components/DayTransitionModal';
import { useDailyStore } from './store/useDailyStore';

const App: React.FC = () => {
  const { currentDate, startDay } = useDailyStore();

  useEffect(() => {
    // Check if we need to start a new day
    if (currentDate) {
      const today = new Date().toISOString().split('T')[0];
      if (currentDate !== today) {
        // Instead of auto-starting, trigger review mode directly directly
        // However, we verify if it is already needed to avoid loops if useEffect re-runs
        // But since we drive UI with it, we just set it.
        // We only set it if not already in that state? - No, idempotency is fine.
        // But wait, if we reload, isDayReviewNeeded is persistent?
        // If it is persistent, good. If not, this useEffect will trigger it.
        // Logic: If date changed, we MUST review.
        useDailyStore.getState().setDayReviewNeeded(true);
      }
    }
  }, [currentDate]);

  return (
    <HashRouter>
      <DayTransitionModal />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tasks" element={<TasksView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="metrics" element={<MetricsView />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="task/:id" element={<TaskDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;