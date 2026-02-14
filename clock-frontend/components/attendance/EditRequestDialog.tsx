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
  Box,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parseISO } from 'date-fns';
import { attendanceService } from '@/services/attendanceService';
import { AttendanceRecord } from '@/types/attendance';

interface EditRequestDialogProps {
  open: boolean;
  record: AttendanceRecord | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export const EditRequestDialog: React.FC<EditRequestDialogProps> = ({
  open,
  record,
  onClose,
  onSubmitted,
}) => {
  const { t } = useTranslation();

  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setCheckInTime(parseISO(record.check_in_time));
      setCheckOutTime(record.check_out_time ? parseISO(record.check_out_time) : null);
      setNote('');
      setError('');
    }
  }, [record]);

  const handleSubmit = async () => {
    if (!record) return;

    setIsSubmitting(true);
    setError('');

    try {
      await attendanceService.submitEditRequest({
        attendance_record_id: record.id,
        check_in_time: checkInTime?.toISOString(),
        check_out_time: checkOutTime?.toISOString(),
        note,
      });

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Failed to submit edit request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('Request Edit')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('Your edit request will be reviewed by an admin before being applied.')}
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
                label={t('Reason for Edit')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                rows={3}
                helperText={t('Please explain why this record needs to be changed')}
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
          {isSubmitting ? t('Submitting...') : t('Submit Request')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
