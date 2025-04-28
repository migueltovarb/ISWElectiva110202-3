// __tests__/app/dashboard/requests/new/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import NewRequestPage from '../src/app/dashboard/requests/new/page';

jest.mock('../src/app/components/dashboard/RequestForm', () => ({
  __esModule: true,
  default: ({ type }: { type: string }) => <div>RequestForm type: {type}</div>,
}));

describe('NewRequestPage', () => {
  it('renderiza el formulario de solicitud', () => {
    render(<NewRequestPage />);
    expect(screen.getByText('RequestForm type: request')).toBeInTheDocument();
  });
});