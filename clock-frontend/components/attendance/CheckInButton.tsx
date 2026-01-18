'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Login } from '@mui/icons-material';
import { attendanceService } from '@/services/attendanceService';

interface CheckInButtonProps {
  disabled: boolean;
  onSuccess: () => void;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({ disabled, onSuccess }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleCheckIn = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await attendanceService.checkIn();
      if (result.previous_record_auto_closed) {
        setSuccess(
          t('Auto-closed previous check-in message', {
            date: new Date(result.auto_closed_record!.check_in_time).toLocaleDateString(),
          })
        );
      } else {
        setSuccess(t('Checked in successfully!'));
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to check in'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="success"
        size="large"
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Login />}
        onClick={handleCheckIn}
        disabled={disabled || isLoading}
        sx={{ minWidth: { xs: 'auto', sm: 150 }, width: { xs: '100%', sm: 'auto' } }}
      >
        {isLoading ? t('Checking In...') : t('Check In')}
      </Button>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
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
