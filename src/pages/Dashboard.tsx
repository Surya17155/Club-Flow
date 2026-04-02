import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');
      setIsAdmin(data && data.length > 0);
    };
    check();
  }, [user?.id]);

  if (loading || (user && isAdmin === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // Check for pending redirect (e.g., QR attendance after OAuth login)
  const pendingRedirect = sessionStorage.getItem('pendingRedirect');
  if (pendingRedirect) {
    sessionStorage.removeItem('pendingRedirect');
    return <Navigate to={pendingRedirect} replace />;
  }

  // Admins go to Super Admin dashboard, everyone else to regular dashboard
  if (isAdmin) return <Navigate to="/super-admin" replace />;
  return <Navigate to="/admin" replace />;
};

export default Dashboard;
