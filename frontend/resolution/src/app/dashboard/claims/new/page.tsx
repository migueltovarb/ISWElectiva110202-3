// app/dashboard/claims/new/page.tsx
'use client';

import RequestForm from '../../../components/dashboard/RequestForm';
import { useAuth } from '../../../components/dashboard/AuthContext';

export default function NewClaimPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div className="text-center py-8">Redirigiendo al login...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <RequestForm type="claim" />
    </div>
  );
}