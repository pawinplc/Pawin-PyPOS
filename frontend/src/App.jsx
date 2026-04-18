import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import POS from './pages/POS';
import Services from './pages/Services';
import Items from './pages/Items';
import Categories from './pages/Categories';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Account from './pages/Account';
import SalesDetail from './pages/SalesDetail';
import Analytics from './pages/Analytics';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  // Determine default dashboard based on role
  const DefaultDashboard = isAdmin() ? AdminDashboard : Dashboard;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<DefaultDashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="sales" element={<Sales />} />
        <Route path="reports" element={<Reports isAdmin={isAdmin()} />} />
        <Route path="admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />
        <Route path="services" element={
          <AdminRoute><Services isAdmin={isAdmin()} /></AdminRoute>
        } />
        <Route path="items" element={
          <AdminRoute><Items isAdmin={isAdmin()} /></AdminRoute>
        } />
        <Route path="categories" element={
          <AdminRoute><Categories isAdmin={isAdmin()} /></AdminRoute>
        } />
        <Route path="stock" element={
          <AdminRoute><Stock isAdmin={isAdmin()} /></AdminRoute>
        } />
        <Route path="users" element={
          <AdminRoute><Users /></AdminRoute>
        } />
        <Route path="account" element={<Account />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="sales/:period" element={<SalesDetail />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
