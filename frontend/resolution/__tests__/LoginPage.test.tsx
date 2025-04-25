import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/auth/login/page'; // Asegúrate de que la ruta sea correcta


jest.mock('./app/components/auth/AuthLayout', () => ({
  __esModule: true,
  default: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
    <div>
      <h1 data-testid="auth-layout-title">{title}</h1>
      <p data-testid="auth-layout-subtitle">{subtitle}</p>
      <div data-testid="auth-layout-children">{children}</div>
    </div>
  )
}));

// Mock de AuthForm
jest.mock('./app/components/auth/AuthForm', () => ({
  __esModule: true,
  default: ({ type }: { type: string }) => (
    <form data-testid="auth-form">
      <input type="hidden" value={type} data-testid="auth-form-type" />
    </form>
  )
}));

describe('LoginPage', () => {
  it('renderiza correctamente', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('auth-layout-title')).toBeInTheDocument();
  });

  it('muestra el título correcto', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('auth-layout-title')).toHaveTextContent('Iniciar Sesión');
  });

  it('muestra el subtítulo correcto', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('auth-layout-subtitle')).toHaveTextContent(
      'Ingresa tus credenciales para acceder a tu cuenta'
    );
  });

  it('pasa el tipo correcto al AuthForm', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('auth-form-type')).toHaveValue('login');
  });
});