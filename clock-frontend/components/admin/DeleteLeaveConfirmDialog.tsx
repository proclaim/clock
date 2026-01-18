'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { adminService } from '@/services/adminService';
import { LeaveWithEmployee } from '@/types/leave';

interface DeleteLeaveConfirmDialogProps {
  open: boolean;
  leave: LeaveWithEmployee | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteLeaveConfirmDialog: React.FC<DeleteLeaveConfirmDialogProps> = ({
  open,
  leave,
  onClose,
  onDeleted,
}) => {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!leave) return;

    setIsDeleting(true);
    setError('');

    try {
      await adminService.deleteLeave(leave.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Failed to delete leave'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Delete Leave')}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {t('Are you sure you want to delete this leave record?')}
        </Typography>

        {leave && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>{t('Employee')}:</strong> {leave.employee_name}
            </Typography>
            <Typography variant="body2">
              <strong>{t('Start Date')}:</strong> {formatDate(leave.start_date)}
            </Typography>
            <Typography variant="body2">
              <strong>{t('End Date')}:</strong> {formatDate(leave.end_date)}
            </Typography>
            <Typography variant="body2">
              <strong>{t('Days')}:</strong> {leave.days}
            </Typography>
          </Box>
        )}

        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('This action cannot be undone.')}
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
          {isDeleting ? t('Deleting...') : t('Delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
