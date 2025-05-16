'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  verified: number;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      
      // Verificar si hay un usuario almacenado y si está verificado
      if (storedUser && storedUser.verified === 1) {
        setUser(storedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (_) {
      setError('Error al cargar los datos del usuario');
    }
    
    setLoading(false);
  }, []);

  // Manejo de errores para el componente de carga
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
