import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import TasksView from './components/TasksView';
import TaskDetail from './components/TaskDetail';
import CalendarView from './components/CalendarView';
import MetricsView from './components/MetricsView';
import ReportsPage from './components/ReportsPage';

const App: React.FC = () => {
  return (
    <HashRouter>
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