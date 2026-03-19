// เช็ค login logout 
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { username: string } | null;
  login: (username: string) => void;
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
  const [user, setUser] = useState<{ username: string } | null>(null);
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
          if (u?.username) {
            config = config || {};
            const headers = new Headers(config.headers || {});
            headers.append('x-user-id', u.username);
            config.headers = headers;
          }
        } catch(e) {}
      }
      return originalFetch(resource, config);
    };

  }, []);

  const login = (username: string) => {
    const userData = { username };
    localStorage.setItem('hrm_user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('hrm_user');
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
