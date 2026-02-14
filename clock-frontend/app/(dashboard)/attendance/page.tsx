'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Paper, Box, CircularProgress, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AttendanceStatus } from '@/components/attendance/AttendanceStatus';
import { CheckInButton } from '@/components/attendance/CheckInButton';
import { CheckOutButton } from '@/components/attendance/CheckOutButton';
import { MonthSelector } from '@/components/attendance/MonthSelector';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { AddRequestDialog } from '@/components/attendance/AddRequestDialog';
import { attendanceService } from '@/services/attendanceService';
import { AttendanceRecord } from '@/types/attendance';
import { getCurrentMonth, calculateTotalDuration } from '@/utils/dateUtils';
import AddIcon from '@mui/icons-material/Add';

export default function AttendancePage() {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { year: currentYear, month: currentMonth } = getCurrentMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [addRequestOpen, setAddRequestOpen] = useState(false);

  const loadStatus = async () => {
    try {
      const status = await attendanceService.getCurrentStatus();
      setIsCheckedIn(status.is_checked_in);
      setCurrentRecord(status.current_record);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const loadRecords = async () => {
    setIsRefreshing(true);
    try {
      const response = await attendanceService.getRecords(selectedYear, selectedMonth);
      setRecords(response.records);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadStatus();
    await loadRecords();
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadStatus(), loadRecords()]);
      setIsLoading(false);
    };

    init();

    // Auto-refresh disabled
    // const interval = setInterval(loadStatus, 30000);
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [selectedYear, selectedMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Hide check-in/out UI for admins
  if (isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          {t('Attendance Tracking')}
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
          }}
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {t('Admin users are exempt from time tracking.')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {t('Visit the Admin Dashboard to manage employee attendance records.')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => router.push('/dashboard')}
            sx={{ mt: 3 }}
          >
            {t('Go to Admin Dashboard')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        {t('Attendance Tracking')}
      </Typography>

      {/* Current Status */}
      <AttendanceStatus isCheckedIn={isCheckedIn} currentRecord={currentRecord} />

      {/* Check-In/Check-Out Buttons */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {t('Actions')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 2,
            flexWrap: 'wrap',
            '& > button': {
              flex: { xs: '1 1 100%', sm: '0 0 auto' },
            },
          }}
        >
          <CheckInButton disabled={isCheckedIn} onSuccess={handleRefresh} />
          <CheckOutButton disabled={!isCheckedIn} onSuccess={handleRefresh} />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddRequestOpen(true)}
          >
            {t('Request Add Record')}
          </Button>
        </Box>
      </Paper>

      {/* Monthly Records */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 4 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          {t('Attendance Records')}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {t('Total:')} {calculateTotalDuration(records, i18n.language)}
        </Typography>
      </Box>

      <MonthSelector year={selectedYear} month={selectedMonth} onChange={handleMonthChange} />

      {isRefreshing ? (
        <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <AttendanceTable records={records} onEditRequestSubmitted={loadRecords} />
      )}

      <AddRequestDialog
        open={addRequestOpen}
        onClose={() => setAddRequestOpen(false)}
        onSubmitted={loadRecords}
      />
    </Container>
  );
}
