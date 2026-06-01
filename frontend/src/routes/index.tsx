import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import JiraSetup from '../pages/JiraSetup';
import Backlog from '../pages/Backlog';
import Agenda from '../pages/Agenda';
import TestUI from '../pages/TestUI';

const AppRoutes = () => {
  // Demo mode: bypass authentication for UI testing
  const isAuthenticated = true; // Set to true for demo

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/jira-setup" element={<JiraSetup />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/backlog"
          element={isAuthenticated ? <Backlog /> : <Navigate to="/login" />}
        />
        <Route
          path="/agenda"
          element={isAuthenticated ? <Agenda /> : <Navigate to="/login" />}
        />
        <Route
          path="/test"
          element={<TestUI />}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
