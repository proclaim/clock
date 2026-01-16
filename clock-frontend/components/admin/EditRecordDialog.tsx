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
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parseISO } from 'date-fns';
import { adminService } from '@/services/adminService';
import { AttendanceRecordWithEmployee } from '@/types/admin';
import { AttendanceStatus } from '@/types/attendance';

interface EditRecordDialogProps {
  open: boolean;
  record: AttendanceRecordWithEmployee | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EditRecordDialog: React.FC<EditRecordDialogProps> = ({
  open,
  record,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();

  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>('CHECKED_IN');
  const [checkInNote, setCheckInNote] = useState('');
  const [checkOutNote, setCheckOutNote] = useState('');
  const [editReason, setEditReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setCheckInTime(parseISO(record.check_in_time));
      setCheckOutTime(record.check_out_time ? parseISO(record.check_out_time as any) : null);
      setStatus(record.status);
      setCheckInNote(record.check_in_note || '');
      setCheckOutNote(record.check_out_note || '');
      setEditReason('');
      setError('');
    }
  }, [record]);

  const handleSubmit = async () => {
    if (!record) return;

    if (!editReason.trim() || editReason.trim().length < 3) {
      setError(t('Edit reason is required (minimum 3 characters)'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await adminService.updateAttendanceRecord(record.id, {
        check_in_time: checkInTime?.toISOString(),
        check_out_time: checkOutTime?.toISOString() || undefined,
        status,
        check_in_note: checkInNote || undefined,
        check_out_note: checkOutNote || undefined,
        edit_reason: editReason,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t('Failed to update record'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('Edit Attendance Record')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <strong>{t('Employee')}:</strong> {record?.employee_name} ({record?.employee_username})
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
                select
                label={t('Status')}
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              >
                <MenuItem value="CHECKED_IN">{t('Checked In')}</MenuItem>
                <MenuItem value="CHECKED_OUT">{t('Checked Out')}</MenuItem>
                <MenuItem value="AUTO_CLOSED">{t('Auto-Closed')}</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('Check-In Note')}
                value={checkInNote}
                onChange={(e) => setCheckInNote(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('Check-Out Note')}
                value={checkOutNote}
                onChange={(e) => setCheckOutNote(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('Edit Reason')}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                multiline
                rows={2}
                helperText={t('Please provide a reason for editing this record (minimum 3 characters)')}
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
