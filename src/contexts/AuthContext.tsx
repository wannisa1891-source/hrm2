// เช็ค login logout 
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  user: { username: string; emp_id?: string; role?: string } | null;
  login: (userData: { username: string; emp_id?: string; role?: string }) => void;
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
  const [user, setUser] = useState<{ username: string; emp_id?: string; role?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('hrm_user');
    if (stored) {
      setUser(JSON.parse(stored));
      setIsLoggedIn(true);
    }
  }, []);

  const login = (userData: { username: string; emp_id?: string; role?: string }) => {
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
