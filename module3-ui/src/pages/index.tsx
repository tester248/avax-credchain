import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>Redirecting to Dashboard...</h1>
      </div>
    </div>
  );
}
