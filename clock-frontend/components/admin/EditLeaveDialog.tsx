'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { adminService } from '@/services/adminService';
import { LeaveWithEmployee } from '@/types/leave';

interface EditLeaveDialogProps {
  open: boolean;
  leave: LeaveWithEmployee | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EditLeaveDialog: React.FC<EditLeaveDialogProps> = ({
  open,
  leave,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (leave) {
      setStartDate(new Date(leave.start_date + 'T00:00:00'));
      setEndDate(new Date(leave.end_date + 'T00:00:00'));
      setNote(leave.note || '');
    }
  }, [leave]);

  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!leave) return;

    if (!startDate || !endDate) {
      setError(t('Please select both start and end dates'));
      return;
    }

    if (endDate < startDate) {
      setError(t('End date must be on or after start date'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await adminService.updateLeave(leave.id, {
        start_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate),
        note: note || undefined,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Failed to update leave'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Edit Leave')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {leave && (
              <Grid item xs={12}>
                <Alert severity="info">
                  {t('Employee')}: {leave.employee_name} (@{leave.employee_username})
                </Alert>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <DatePicker
                label={t('Start Date')}
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label={t('End Date')}
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('Note')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? t('Saving...') : t('Save Changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
