'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Paper,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { differenceInMinutes, parseISO, startOfMinute } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/adminService';
import { Employee } from '@/types/auth';
import { AttendanceRecordWithEmployee } from '@/types/admin';
import { MonthSelector } from '@/components/attendance/MonthSelector';
import { PayrollTable } from '@/components/admin/PayrollTable';
import { formatDurationMinutes } from '@/utils/dateUtils';

const getPreviousMonth = (): { year: number; month: number } => {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 };
};

const buildDateRange = (year: number, month: number): { startDate: string; endDate: string } => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // month is 1-based; Date(year, month, 1) gives first day of next month (handles Dec→Jan)
  const next = new Date(year, month, 1);
  const endDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
  return { startDate, endDate };
};

const calculateTotalMinutes = (records: AttendanceRecordWithEmployee[]): number => {
  let total = 0;
  for (const record of records) {
    if (record.check_out_time) {
      try {
        const checkIn = startOfMinute(parseISO(record.check_in_time));
        const checkOut = startOfMinute(parseISO(record.check_out_time as any));
        total += differenceInMinutes(checkOut, checkIn);
      } catch {
        // ignore invalid dates
      }
    }
  }
  return total;
};

export default function PayrollPage() {
  const { t, i18n } = useTranslation();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedYear, setSelectedYear] = useState(() => getPreviousMonth().year);
  const [selectedMonth, setSelectedMonth] = useState(() => getPreviousMonth().month);
  const [records, setRecords] = useState<AttendanceRecordWithEmployee[]>([]);
  const [hourlyRates, setHourlyRates] = useState<Record<number, string>>({});
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const totalMinutes = useMemo(() => calculateTotalMinutes(records), [records]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/attendance');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const all = await adminService.getAllEmployees();
        const active = all
          .filter((e) => e.is_active)
          .sort((a, b) => a.name.localeCompare(b.name));
        setEmployees(active);
      } catch (error) {
        console.error('Failed to load employees:', error);
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    loadEmployees();
  }, []);

  const loadRecords = useCallback(async () => {
    if (employees.length === 0) return;
    const employee = employees[selectedTabIndex];
    if (!employee) return;
    setIsLoadingRecords(true);
    try {
      const { startDate, endDate } = buildDateRange(selectedYear, selectedMonth);
      const response = await adminService.getAttendanceRecords(
        1,
        200,
        startDate,
        endDate,
        employee.id
      );
      setRecords(response.records);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [employees, selectedTabIndex, selectedYear, selectedMonth]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  if (authLoading || isLoadingEmployees) {
    return (
      <Box display="flex" justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentEmployee = employees[selectedTabIndex];
  const currentRate = currentEmployee ? (hourlyRates[currentEmployee.id] ?? '') : '';
  const salary =
    currentRate && parseFloat(currentRate) > 0
      ? ((totalMinutes / 60) * parseFloat(currentRate)).toFixed(2)
      : null;

  const totalDisplay = formatDurationMinutes(totalMinutes, i18n.language);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t('Payroll')}
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/dashboard')}>
          {t('Back to Dashboard')}
        </Button>
      </Box>

      <MonthSelector
        year={selectedYear}
        month={selectedMonth}
        onChange={(year, month) => {
          setSelectedYear(year);
          setSelectedMonth(month);
        }}
      />

      {employees.length === 0 ? (
        <Typography color="text.secondary">{t('No active employees found.')}</Typography>
      ) : (
        <>
          <Tabs
            value={selectedTabIndex}
            onChange={(_, newValue) => setSelectedTabIndex(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3 }}
          >
            {employees.map((employee) => (
              <Tab key={employee.id} label={employee.name} />
            ))}
          </Tabs>

          {isLoadingRecords ? (
            <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <PayrollTable records={records} totalMinutes={totalMinutes} />
          )}

          {currentEmployee && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mt: 3,
                borderRadius: 2,
                boxShadow:
                  'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {t('Salary Calculator')}
              </Typography>
              <TextField
                label={t('Hourly Rate')}
                type="number"
                size="small"
                value={currentRate}
                onChange={(e) =>
                  setHourlyRates((prev) => ({ ...prev, [currentEmployee.id]: e.target.value }))
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ width: 180 }}
              />
              {salary !== null && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {totalDisplay} × ${parseFloat(currentRate).toFixed(2)}/hr ={' '}
                  <strong>${salary}</strong>
                </Typography>
              )}
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}
