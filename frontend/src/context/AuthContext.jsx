import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.email?.split('@')[0],
            role: 'admin',
            full_name: session.user.user_metadata?.full_name || session.user.email
          });
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.email?.split('@')[0],
            role: 'admin',
            full_name: session.user.user_metadata?.full_name || session.user.email
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => subscription?.unsubscribe();
    } catch (error) {
      console.error('Auth subscription error:', error);
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      if (error) throw error;
      
      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.email?.split('@')[0],
        role: 'admin',
        full_name: data.user.user_metadata?.full_name || data.user.email
      };
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
