'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';

export default function ModLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authApi.verifyToken();
      } catch (error) {
        router.push('/mod/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}