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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!email) {
        throw new Error('No se encontró el correo electrónico');
      }

      const { success, error: verificationError } = await authService.verifyUser(email, code);
      
      if (!success) {
        throw new Error(verificationError || 'Código de verificación incorrecto');
      }

      setIsSuccess(true);
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error durante la verificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      if (!email || !canResend) return;
      
      const { success, error: resendError } = await authService.resendVerificationCode(email);
      
      if (!success) {
        throw new Error(resendError || 'Error al reenviar el código');
      }
      
      setCountdown(30);
      setCanResend(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error al contactar al servidor');
    }
  };

  return (
    <AuthLayout
      title="Verificación de identidad"
      subtitle={`Ingresa el código de 6 dígitos enviado a ${email || 'tu correo'}`}
    >
      {isSuccess ? (
        <div className="mb-4 p-3 bg-green-50 rounded-md text-center">
          <p className="text-sm text-green-800">
            ¡Verificación exitosa! Redirigiendo al login...
          </p>
        </div>
      ) : (
        <>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Código de verificación
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Nota: El código se envía a un correo predefinido en el sistema.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend}
              className={`font-medium ${canResend ? 'text-blue-600 hover:text-blue-500' : 'text-gray-400'}`}
            >
              {canResend ? 'Reenviar código' : `Reenviar código en ${countdown} segundos`}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="font-medium text-gray-600 hover:text-gray-500"
            >
              Cancelar
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}