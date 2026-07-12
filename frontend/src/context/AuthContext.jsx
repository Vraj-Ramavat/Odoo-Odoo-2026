import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ecosphere_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = localStorage.getItem('ecosphere_tokens');
    if (tokens) {
      authAPI.getProfile()
        .then(res => {
          setUser(res.data);
          localStorage.setItem('ecosphere_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('ecosphere_tokens');
          localStorage.removeItem('ecosphere_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const tokenRes = await authAPI.login({ username, password });
    localStorage.setItem('ecosphere_tokens', JSON.stringify(tokenRes.data));
    const profileRes = await authAPI.getProfile();
    setUser(profileRes.data);
    localStorage.setItem('ecosphere_user', JSON.stringify(profileRes.data));
    return profileRes.data;
  };

  const register = async (data) => {
    await authAPI.register(data);
    return login(data.username, data.password);
  };

  const logout = () => {
    localStorage.removeItem('ecosphere_tokens');
    localStorage.removeItem('ecosphere_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isDeptHead = user?.role === 'dept_head';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      isAdmin, isDeptHead, isEmployee,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
