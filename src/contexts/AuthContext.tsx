import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/lib/auth';
import { clearSession, getSession, saveSession } from '@/lib/session';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  const login = (user: User) => {
    setUser(user);
    saveSession(user);
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
