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
  Alert,
  Autocomplete,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { adminService } from '@/services/adminService';
import { Employee } from '@/types/auth';
import { AttendanceStatus } from '@/types/attendance';

interface AddRecordDialogProps {
  open: boolean;
  employees: Employee[];
  defaultEmployee?: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

export const AddRecordDialog: React.FC<AddRecordDialogProps> = ({
  open,
  employees,
  defaultEmployee,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(defaultEmployee ?? null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(new Date());
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>('CHECKED_OUT');
  const [checkInNote, setCheckInNote] = useState('');
  const [checkOutNote, setCheckOutNote] = useState('');
  const [editReason, setEditReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedEmployee(defaultEmployee ?? null);
    }
  }, [open, defaultEmployee]);

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      setError(t('Please select an employee'));
      return;
    }

    if (!checkInTime) {
      setError(t('Check-in time is required'));
      return;
    }

    if (checkOutTime && checkInTime && checkOutTime <= checkInTime) {
      setError(t('Check-out time must be later than check-in time'));
      return;
    }

    if (!editReason.trim() || editReason.trim().length < 3) {
      setError(t('Reason is required (minimum 3 characters)'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await adminService.createAttendanceRecord({
        employee_id: selectedEmployee.id,
        check_in_time: checkInTime.toISOString(),
        check_out_time: checkOutTime?.toISOString(),
        status,
        check_in_note: checkInNote || undefined,
        check_out_note: checkOutNote || undefined,
        edit_reason: editReason,
      });

      onSaved();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('Failed to create record'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee(null);
    setCheckInTime(new Date());
    setCheckOutTime(null);
    setStatus('CHECKED_OUT');
    setCheckInNote('');
    setCheckOutNote('');
    setEditReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('Add Attendance Record')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                value={selectedEmployee}
                onChange={(_, newValue) => setSelectedEmployee(newValue)}
                options={employees}
                getOptionLabel={(option) => `${option.name} (${option.username})`}
                renderInput={(params) => (
                  <TextField {...params} label={t('Employee')} required />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label={t('Check-In Time')}
                value={checkInTime}
                onChange={(newValue) => setCheckInTime(newValue)}
                timeSteps={{ minutes: 15 }}
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
                minDateTime={checkInTime ?? undefined}
                onChange={(newValue) => setCheckOutTime(newValue)}
                timeSteps={{ minutes: 15 }}
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
                label={t('Reason for Adding Record')}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                multiline
                rows={2}
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
          {isSubmitting ? t('Creating...') : t('Create Record')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
