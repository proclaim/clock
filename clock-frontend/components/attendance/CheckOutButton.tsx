'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { attendanceService } from '@/services/attendanceService';
import { ClockActionDialog } from './ClockActionDialog';

interface CheckOutButtonProps {
  disabled: boolean;
  onSuccess: () => void;
}

export const CheckOutButton: React.FC<CheckOutButtonProps> = ({ disabled, onSuccess }) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleCheckOut = async (chosenTime: Date | null) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await attendanceService.checkOut(undefined, chosenTime?.toISOString());
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
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled || isLoading}
        sx={{ minWidth: { xs: 'auto', sm: 150 }, width: { xs: '100%', sm: 'auto' } }}
      >
        {isLoading ? t('Checking Out...') : t('Check Out')}
      </Button>

      <ClockActionDialog
        open={isDialogOpen}
        action="check_out"
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleCheckOut}
      />

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
