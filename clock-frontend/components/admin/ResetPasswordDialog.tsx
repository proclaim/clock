'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Typography,
} from '@mui/material';
import { adminService } from '@/services/adminService';
import { Employee } from '@/types/auth';

interface ResetPasswordDialogProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  employee,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!employee) return;

    if (!newPassword) {
      setError(t('New password is required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('Passwords must match'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await adminService.resetPassword(employee.id, newPassword);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('Failed to reset password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Reset Password')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('Resetting password for')}: <strong>{employee.name}</strong> ({employee.username})
        </Typography>

        <TextField
          fullWidth
          margin="normal"
          label={t('New Password')}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <TextField
          fullWidth
          margin="normal"
          label={t('Confirm New Password')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="warning" disabled={isSubmitting}>
          {isSubmitting ? t('Resetting...') : t('Reset Password')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
