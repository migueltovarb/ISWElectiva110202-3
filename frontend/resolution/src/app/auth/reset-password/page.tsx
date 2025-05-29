'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { authService } from '../../lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [step, setStep] = useState(1); // 1: verificar código, 2: cambiar contraseña
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
    // Solo mostrar el token en el componente visual, no auto-completar el campo
    if (tokenParam) {
      setShowToken(true);
      // NO auto-completar el campo token, mantenerlo vacío para que el usuario lo ingrese manualmente
      // setFormData(prev => ({ ...prev, token: tokenParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!formData.email || !formData.token) {
      setError('Por favor ingresa el email y el código de verificación');
      setLoading(false);
      return;
    }

    try {
      // Usar el nuevo método para solo verificar el token
      const response = await authService.verifyPasswordResetToken(formData.email, formData.token);
      
      if (response.success) {
        setIsTokenVerified(true);
        setStep(2);
        setMessage('Código verificado correctamente. Ahora puedes cambiar tu contraseña.');
      } else {
        throw new Error(response.error || 'Código de verificación inválido');
      }
      
    } catch (err) {
      console.error('Error en verificación:', err);
      setError(err instanceof Error ? err.message : 'Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validar que las contraseñas coincidan
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar longitud de la contraseña
    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword(
        formData.email,
        formData.token,
        formData.newPassword
      );
      
      setMessage(response.message || 'Contraseña cambiada exitosamente');
      
      // Redirigir al login después de un momento
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Botón flotante para mostrar el token cuando está oculto */}
      {!showToken && searchParams.get('token') && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowToken(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
            title="Mostrar código de recuperación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Card del token en la parte superior derecha */}
      {showToken && searchParams.get('token') && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-green-500 animate-pulse"></div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Código de Recuperación
                </h3>
              </div>
              <button
                onClick={() => setShowToken(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-center">
                <div className="text-xl font-mono font-bold tracking-widest mb-2 text-blue-900">
                  {searchParams.get('token')}
                </div>
                <div className="flex items-center justify-center text-xs text-blue-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Código para desarrollo
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(searchParams.get('token') || '');
                  setCopied(true);
                }}
                className={`text-xs flex items-center px-3 py-1 rounded-full transition-all ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                {copied ? (
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

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 1 ? 'Verificar Código' : 'Cambiar Contraseña'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1 
              ? 'Ingresa tu email y el código de verificación recibido'
              : 'Ingresa tu nueva contraseña'
            }
          </p>
        </div>
        
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyToken}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="tu-email@ejemplo.com"
                />
              </div>

              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                  Código de Verificación
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  value={formData.token}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ingresa el código recibido por email"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{message}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}

        {step === 2 && isTokenVerified && (
          <form className="mt-8 space-y-6" onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nueva Contraseña
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nueva contraseña"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirmar nueva contraseña"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{message}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 