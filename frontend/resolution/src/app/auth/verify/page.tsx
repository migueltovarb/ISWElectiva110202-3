// app/auth/verify/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../../lib/auth';
import AuthLayout from '../../components/auth/AuthLayout';
import Link from 'next/link';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/auth/login');
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números y limitar a 6 dígitos
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!email) {
        throw new Error('No se encontró el correo electrónico');
      }

      // Validar que el código tenga 6 dígitos
      if (code.length !== 6) {
        throw new Error('El código debe tener 6 dígitos');
      }

      console.log('Enviando código:', code); // Para depuración

      const { success, error: verificationError } = await authService.verifyUser(email, code);
      
      if (!success) {
        throw new Error(verificationError || 'Código de verificación incorrecto');
      }

      setIsSuccess(true);
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (err) {
      console.error('Error en verificación:', err); // Para depuración
      setError(err instanceof Error ? err.message : 'Ocurrió un error durante la verificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const { success, error: resendError } = await authService.resendVerificationCode(email);
      
      if (!success) {
        throw new Error(resendError || 'Error al reenviar el código');
      }
      
      setCountdown(30);
      setCanResend(false);
      setCode(''); // Limpiar el código anterior
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reenviar el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Verificar cuenta"
      subtitle="Ingresa el código de verificación enviado a tu correo electrónico"
    >
      {isSuccess ? (
        <div className="text-center">
          <div className="mb-4 text-green-600">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">¡Cuenta verificada!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Tu cuenta ha sido verificada exitosamente. Serás redirigido al inicio de sesión...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Código de verificación
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={code}
              onChange={handleCodeChange}
              placeholder="Ingresa el código de 6 dígitos"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Verificar cuenta'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || isSubmitting}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canResend ? (
                'Reenviar código'
              ) : (
                `Reenviar código en ${countdown}s`
              )}
            </button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-500">
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}