import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import Dashboard from './pages/Dashboard';
import RepoDetail from './pages/RepoDetail';
import AddRepo from './pages/AddRepo';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gh-bg flex items-center justify-center text-gh-accent">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="add" element={<AddRepo />} />
        <Route path="repo/:owner/:repo" element={<RepoDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
