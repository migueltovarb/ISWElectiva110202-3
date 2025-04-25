// app/auth/register/page.tsx
'use client';

import AuthLayout from '../../components/auth/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Crear una cuenta"
      subtitle="Complete el formulario para registrarse en nuestra plataforma"
    >
      <AuthForm type="register" />
    </AuthLayout>
  );
}