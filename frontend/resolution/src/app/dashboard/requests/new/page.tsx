'use client';

import RequestForm from '../../../components/dashboard/RequestForm';

export default function NewRequestPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <RequestForm type="request" />
    </div>
  );
}