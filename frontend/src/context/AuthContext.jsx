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
            full_name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url || null
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
            full_name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url || null
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
      // Use direct fetch to avoid SDK issues
      const supabaseUrl = 'https://dbocluzncuhhlrkeggez.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib2NsdXpuY3VoaGxya2VnZ2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Njg2MTQsImV4cCI6MjA5MDU0NDYxNH0.U7GgLVA4BzFh9DVyKoszK_07WQFvF_aot49JcwhtsAU';
      
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ email: username, password })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error_description || err.msg || 'Login failed');
      }
      
      const data = await response.json();
      
      // Set session in Supabase client
      supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user
      });
      
      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.email?.split('@')[0],
        role: 'admin',
        full_name: data.user.user_metadata?.full_name || data.user.email,
        avatar_url: data.user.user_metadata?.avatar_url || null
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
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, setUser }}>
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
