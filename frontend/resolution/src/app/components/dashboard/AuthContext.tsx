'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchApi } from '../../lib/api';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type AuthContextType = {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  verifyToken: (token: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      // Esta función deberá implementarse cuando tengas un endpoint para verificar tokens
      // Por ahora, asumimos que el token es válido si existe
      return !!token;
    } catch (error) {
      console.error('Error verificando el token:', error);
      return false;
    }
  };

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (storedUser && token) {
        const isValidToken = await verifyToken(token);
        
        if (isValidToken) {
          setUser(JSON.parse(storedUser));
        } else {
          // Si el token no es válido, hacemos logout
          logout();
        }
      }
    };
    
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};