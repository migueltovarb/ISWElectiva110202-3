// __tests__/app/auth/register/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import RegisterPage from '@/app/auth/register/page';

// Mock de AuthLayout
jest.mock('@/components/auth/AuthLayout', () => ({
  __esModule: true,
  default: ({ children, title, subtitle }: { 
    children: React.ReactNode; 
    title: string; 
    subtitle: string 
  }) => (
    <div>
      <h1 data-testid="auth-layout-title">{title}</h1>
      <p data-testid="auth-layout-subtitle">{subtitle}</p>
      <div data-testid="auth-layout-children">{children}</div>
    </div>
  )
}));

// Mock de AuthForm
jest.mock('@/components/auth/AuthForm', () => ({
  __esModule: true,
  default: ({ type }: { type: string }) => (
    <form data-testid="auth-form">
      <input type="hidden" value={type} data-testid="auth-form-type" />
      <button type="submit" data-testid="submit-button">Enviar</button>
    </form>
  )
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza correctamente sin errores', () => {
    expect(() => render(<RegisterPage />)).not.toThrow();
  });

  it('muestra el título correcto para registro', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('auth-layout-title')).toHaveTextContent('Crear una cuenta');
  });

  it('muestra el subtítulo correcto para registro', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('auth-layout-subtitle')).toHaveTextContent(
      'Complete el formulario para registrarse en nuestra plataforma'
    );
  });

  it('pasa el tipo "register" al AuthForm', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('auth-form-type')).toHaveValue('register');
  });

  it('renderiza el formulario dentro del AuthLayout', () => {
    render(<RegisterPage />);
    const authLayoutChildren = screen.getByTestId('auth-layout-children');
    const authForm = screen.getByTestId('auth-form');
    expect(authLayoutChildren).toContainElement(authForm);
  });

  it('el formulario tiene un botón de envío', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });
});