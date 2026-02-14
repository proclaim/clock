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
  Box,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { attendanceService } from '@/services/attendanceService';

interface AddRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const AddRequestDialog: React.FC<AddRequestDialogProps> = ({
  open,
  onClose,
  onSubmitted,
}) => {
  const { t } = useTranslation();

  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setCheckInTime(null);
    setCheckOutTime(null);
    setNote('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!checkInTime) {
      setError(t('Check-in time is required'));
      return;
    }

    if (note.length < 3) {
      setError(t('Reason is required (minimum 3 characters)'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await attendanceService.submitAddRequest({
        check_in_time: checkInTime.toISOString(),
        check_out_time: checkOutTime?.toISOString(),
        note,
      });

      onSubmitted();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('Failed to submit add request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('Request Add Record')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('Your add request will be reviewed by an admin before a new record is created.')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label={t('Check-In Time')}
                value={checkInTime}
                onChange={(newValue) => setCheckInTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label={t('Check-Out Time')}
                value={checkOutTime}
                onChange={(newValue) => setCheckOutTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('Reason for Adding Record')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                rows={3}
                helperText={t('Please provide a reason for adding this record (minimum 3 characters)')}
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
          {isSubmitting ? t('Submitting...') : t('Submit Request')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
