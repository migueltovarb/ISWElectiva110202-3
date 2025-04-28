// __tests__/app/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../src/app/page';

// Mocks
jest.mock('../src/app/components/Navbar', () => ({
  __esModule: true,
  default: () => <div>Navbar</div>,
}));

jest.mock('../src/app/components/HeroSection', () => ({
  __esModule: true,
  default: () => <div>HeroSection</div>,
}));

jest.mock('../src/app/components/FeaturesSection', () => ({
  __esModule: true,
  default: () => <div>FeaturesSection</div>,
}));

jest.mock('../src/app/components/TestimonialsSection', () => ({
  __esModule: true,
  default: () => <div>TestimonialsSection</div>,
}));

jest.mock('../src/app/components/Footer', () => ({
  __esModule: true,
  default: () => <div>Footer</div>,
}));

describe('HomePage', () => {
  it('renderiza todos los componentes principales', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Navbar')).toBeInTheDocument();
    expect(screen.getByText('HeroSection')).toBeInTheDocument();
    expect(screen.getByText('FeaturesSection')).toBeInTheDocument();
    expect(screen.getByText('TestimonialsSection')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});