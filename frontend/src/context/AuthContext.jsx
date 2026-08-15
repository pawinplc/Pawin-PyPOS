import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'pypos_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          const currentUser = await authAPI.getCurrentUser();
          if (currentUser) {
            setUser({
              id: currentUser.id,
              email: currentUser.email,
              username: currentUser.username,
              role: currentUser.role,
              full_name: currentUser.full_name,
              avatar_url: currentUser.avatar_url || null
            });
          } else {
            localStorage.removeItem(TOKEN_KEY);
            setAuthToken(null);
          }
        } catch (error) {
          console.error('Auth init error:', error);
          localStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setAuthToken(data.access_token);
      localStorage.setItem(TOKEN_KEY, data.access_token);

      const currentUser = await authAPI.getCurrentUser();
      const userData = {
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        role: currentUser.role,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url || null
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
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updatePassword = async (currentPassword, newPassword) => {
    await authAPI.changePassword(currentPassword, newPassword);
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePassword, isAdmin, setUser }}>
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