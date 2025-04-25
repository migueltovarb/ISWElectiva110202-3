// app/auth/login/page.tsx
'use client';

import AuthLayout from '../../components/auth/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
    >
      <AuthForm type="login" />
    </AuthLayout>
  );
}