// เช็ค login logout 
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { username: string; emp_id?: string; role?: string; name?: string; image?: string | null } | null;
  login: (userData: { username: string; emp_id?: string; role?: string; name?: string; image?: string | null }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; emp_id?: string; role?: string; name?: string; image?: string | null } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('hrm_user');
    if (stored) {
      setUser(JSON.parse(stored));
      setIsLoggedIn(true);
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

  const login = (userData: { username: string; emp_id?: string; role?: string; name?: string; image?: string | null }) => {
    localStorage.setItem('hrm_user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
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
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
