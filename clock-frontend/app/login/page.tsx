'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Box, CircularProgress } from '@mui/material';

export default function LoginPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isAdmin) {
        router.push('/dashboard');
      } else {
        router.push('/attendance');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return <LoginForm />;
}
