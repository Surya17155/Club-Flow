import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Placeholder dashboard router that will redirect based on user role.
 * For now, redirects to admin dashboard.
 */
const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // TODO: Check user role from database and redirect accordingly
  // For now, default to admin dashboard
  return <Navigate to="/admin" replace />;
};

export default Dashboard;
