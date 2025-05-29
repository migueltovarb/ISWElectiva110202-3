// app/auth/verify/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../../lib/auth';
import AuthLayout from '../../components/auth/AuthLayout';
import Link from 'next/link';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const initialToken = searchParams.get('token');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentToken, setCurrentToken] = useState(initialToken || '');
  const [showToken, setShowToken] = useState(!!initialToken);
  const [copied, setCopied] = useState(false);
  const [tokenCountdown, setTokenCountdown] = useState(7);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

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
      const { success, error: resendError, token } = await authService.resendVerificationCode(email);
      
      if (!success) {
        throw new Error(resendError || 'Error al reenviar el código');
      }
      
      setCountdown(30);
      setCanResend(false);
      setCode(''); // Limpiar el código anterior
      
      // Actualizar el token mostrado y reiniciar temporizador
      if (token) {
        setCurrentToken(token);
        setShowToken(true);
        setTokenCountdown(7);
        setIsTokenExpired(false);
        setCopied(false);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reenviar el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para regenerar el token automáticamente
  const regenerateToken = async () => {
    if (!email) return;
    
    try {
      const { success, token } = await authService.resendVerificationCode(email);
      
      if (success && token) {
        setCurrentToken(token);
        setTokenCountdown(7);
        setIsTokenExpired(false);
        setCopied(false);
      }
    } catch (err) {
      console.error('Error al regenerar token:', err);
    }
  };

  // useEffect para el temporizador del token
  useEffect(() => {
    if (currentToken && showToken && tokenCountdown > 0) {
      const timer = setTimeout(() => setTokenCountdown(tokenCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentToken && showToken && tokenCountdown === 0) {
      setIsTokenExpired(true);
      // Regenerar automáticamente después de 1 segundo de mostrar que expiró
      setTimeout(() => {
        regenerateToken();
      }, 1000);
    }
  }, [tokenCountdown, currentToken, showToken, email]);

  // Reiniciar el temporizador cuando se muestra un nuevo token
  useEffect(() => {
    if (currentToken && showToken) {
      setTokenCountdown(7);
      setIsTokenExpired(false);
    }
  }, [currentToken, showToken]);

  return (
    <div className="relative">
      {/* Botón flotante para mostrar el token cuando está oculto */}
      {!showToken && currentToken && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowToken(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
            title="Mostrar código de verificación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Card del token en la parte superior derecha */}
      {showToken && currentToken && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isTokenExpired 
                    ? 'bg-red-500 animate-pulse' 
                    : tokenCountdown <= 3 
                      ? 'bg-yellow-500 animate-pulse' 
                      : 'bg-green-500 animate-pulse'
                }`}></div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isTokenExpired ? 'Generando nuevo código...' : 'Código de Verificación'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono px-2 py-1 rounded ${
                  isTokenExpired 
                    ? 'bg-red-100 text-red-700' 
                    : tokenCountdown <= 3 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-green-100 text-green-700'
                }`}>
                  {isTokenExpired ? 'Expirado' : `${tokenCountdown}s`}
                </span>
                <button
                  onClick={() => setShowToken(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`border rounded-lg p-4 transition-all ${
              isTokenExpired 
                ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' 
                : tokenCountdown <= 3 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            }`}>
              <div className="text-center">
                <div className={`text-xl font-mono font-bold tracking-widest mb-2 ${
                  isTokenExpired 
                    ? 'text-red-900 opacity-50' 
                    : tokenCountdown <= 3 
                      ? 'text-yellow-900' 
                      : 'text-blue-900'
                }`}>
                  {isTokenExpired ? '------' : currentToken}
                </div>
                <div className={`flex items-center justify-center text-xs ${
                  isTokenExpired 
                    ? 'text-red-600' 
                    : tokenCountdown <= 3 
                      ? 'text-yellow-600' 
                      : 'text-blue-600'
                }`}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isTokenExpired ? 'Código expirado - Generando nuevo...' : 'Código para desarrollo'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => {
                  if (!isTokenExpired) {
                    navigator.clipboard.writeText(currentToken);
                    setCopied(true);
                  }
                }}
                disabled={isTokenExpired}
                className={`text-xs flex items-center px-3 py-1 rounded-full transition-all ${
                  isTokenExpired
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : copied 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                {isTokenExpired ? (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Código expirado
                  </>
                ) : copied ? (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Código copiado
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar código
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <AuthLayout
        title="Verificar cuenta"
        subtitle="Cargando..."
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AuthLayout>
    }>
      <VerifyContent />
    </Suspense>
  );
}