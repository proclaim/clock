'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function Home() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (isAdmin) {
          router.push('/dashboard');
        } else {
          router.push('/attendance');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

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
