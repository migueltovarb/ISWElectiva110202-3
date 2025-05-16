'use client';

import { useEffect, useState } from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';

export default function LoginPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
    >
      <AuthForm type="login" />
    </AuthLayout>
  );
}