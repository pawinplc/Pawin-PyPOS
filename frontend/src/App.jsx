import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Landing from './pages/Landing';
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

  // Determine default dashboard based on role
  const DefaultDashboard = isAdmin() ? AdminDashboard : Dashboard;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <Login />} />

      {/* All protected routes at top level to match Sidebar links */}
      <Route element={
        loading ? (
          <div className="page-loading">Loading...</div>
        ) : (
          <ProtectedRoute><Layout /></ProtectedRoute>
        )
      }>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports isAdmin={isAdmin()} />} />
        <Route path="/services" element={<Services isAdmin={isAdmin()} />} />
        <Route path="/items" element={<Items isAdmin={isAdmin()} />} />
        <Route path="/categories" element={<Categories isAdmin={isAdmin()} />} />
        <Route path="/stock" element={<Stock isAdmin={isAdmin()} />} />
        <Route path="/users" element={<Users />} />
        <Route path="/account" element={<Account />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/sales/:period" element={<SalesDetail />} />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
