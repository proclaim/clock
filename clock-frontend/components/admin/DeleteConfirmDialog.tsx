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
import { AttendanceRecordWithEmployee } from '@/types/admin';
import { formatDate, formatTime } from '@/utils/dateUtils';

interface DeleteConfirmDialogProps {
  open: boolean;
  record: AttendanceRecordWithEmployee | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  record,
  onClose,
  onDeleted,
}) => {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!record) return;

    setIsDeleting(true);
    setError('');

    try {
      await adminService.deleteAttendanceRecord(record.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Failed to delete record'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Delete Attendance Record')}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {t('Are you sure you want to delete this attendance record?')}
        </Typography>

        {record && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>{t('Employee')}:</strong> {record.employee_name}
            </Typography>
            <Typography variant="body2">
              <strong>{t('Date')}:</strong> {formatDate(record.check_in_time, i18n.language)}
            </Typography>
            <Typography variant="body2">
              <strong>{t('Check-In')}:</strong> {formatTime(record.check_in_time, i18n.language)}
            </Typography>
            {record.check_out_time && (
              <Typography variant="body2">
                <strong>{t('Check-Out')}:</strong> {formatTime(record.check_out_time as any, i18n.language)}
              </Typography>
            )}
          </Box>
        )}

        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('This action cannot be undone. The record will be soft-deleted.')}
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
