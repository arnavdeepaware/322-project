import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function SuperUserRoute({ children }) {
  const [isSuperUser, setIsSuperUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSuperUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsSuperUser(user?.email === 'hseam14@gmail.com');
      } catch (error) {
        console.error('Error checking superuser status:', error);
        setIsSuperUser(false);
      } finally {
        setLoading(false);
      }
    }

    checkSuperUser();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isSuperUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default SuperUserRoute; 