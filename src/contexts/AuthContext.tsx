// เช็ค login logout 
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  isFirstLogin: boolean;
  user: { username: string; emp_id?: string; dept_id?: string; role?: string; name?: string; image?: string | null; emp_type?: string } | null;
  login: (userData: { username: string; emp_id?: string; dept_id?: string; role?: string; name?: string; image?: string | null; emp_type?: string }, firstLogin?: boolean) => void;
  logout: () => void;
  setFirstLogin: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isFirstLogin: false,
  user: null,
  login: () => { },
  logout: () => { },
  setFirstLogin: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [user, setUser] = useState<{ username: string; emp_id?: string; dept_id?: string; role?: string; name?: string; image?: string | null; emp_type?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('hrm_user');
    if (stored) {
      setUser(JSON.parse(stored));
      setIsLoggedIn(true);
      setIsFirstLogin(localStorage.getItem('is_first_login') === 'true');
    }
    
    // Global fetch interceptor for Audit Logs
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      const currentUserStr = localStorage.getItem('hrm_user');
      if (currentUserStr && typeof resource === 'string' && resource.startsWith('/api/')) {
        try {
          const u = JSON.parse(currentUserStr);
          const userName = u?.username || u?.name;
          if (userName) {
            config = config || {};
            const headers = new Headers(config.headers || {});
            headers.append('x-user-id', encodeURIComponent(userName));
            config.headers = headers;
          }
        } catch(e) {}
      }
      return originalFetch(resource, config);
    };

  }, []);

  const login = (userData: { username: string; emp_id?: string; role?: string; name?: string; image?: string | null; emp_type?: string }, firstLogin = false) => {
    localStorage.setItem('hrm_user', JSON.stringify(userData));
    localStorage.setItem('is_first_login', String(firstLogin));
    setUser(userData);
    setIsLoggedIn(true);
    setIsFirstLogin(firstLogin);
  };

  const setFirstLogin = (val: boolean) => {
    localStorage.setItem('is_first_login', String(val));
    setIsFirstLogin(val);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('hrm_user');
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isFirstLogin, user, login, logout, setFirstLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
