'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  verified: number;
  is_admin: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
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

  const refreshUser = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser && storedUser.id) {
        // Obtener datos actualizados del usuario desde el backend
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/${storedUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const updatedUser = await response.json();
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setIsAuthenticated(updatedUser.verified === 1);
        }
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

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
    <AuthContext.Provider value={{ user, isAuthenticated, loading, error, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
