'use client';

import React, { useState } from 'react';
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
import { leaveService } from '@/services/leaveService';

interface AddLeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AddLeaveDialog: React.FC<AddLeaveDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();

  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
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
      await leaveService.createLeave({
        start_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate),
        note: note || undefined,
      });

      onSaved();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('Failed to create leave'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setNote('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Add Leave')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
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
                placeholder={t('Optional: Add a note about your leave')}
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
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? t('Creating...') : t('Create Leave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
