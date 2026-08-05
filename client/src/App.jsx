import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore.js';
import { useUIStore, applyTheme } from './stores/uiStore.js';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BoardList from './pages/BoardList.jsx';
import BoardEditor from './pages/BoardEditor.jsx';
import TeamPage from './pages/TeamPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import Settings from './pages/Settings.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(theme, mq.matches);
    const handler = () => applyTheme(theme, mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/oauth/callback" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/boards" element={<ProtectedRoute><BoardList /></ProtectedRoute>} />
      <Route path="/board/:id" element={<ProtectedRoute><BoardEditor /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
      <Route path="/team/:id" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
      <Route path="/project/:id" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
