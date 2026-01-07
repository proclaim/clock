'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { attendanceService } from '@/services/attendanceService';

interface CheckOutButtonProps {
  disabled: boolean;
  onSuccess: () => void;
}

export const CheckOutButton: React.FC<CheckOutButtonProps> = ({ disabled, onSuccess }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleCheckOut = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await attendanceService.checkOut();
      setSuccess(t('Checked out successfully!'));
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to check out'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="error"
        size="large"
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Logout />}
        onClick={handleCheckOut}
        disabled={disabled || isLoading}
        sx={{ minWidth: 150 }}
      >
        {isLoading ? t('Checking Out...') : t('Check Out')}
      </Button>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};
