'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import { LockReset, Group } from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { EmployeeAttendanceSummary } from '@/types/admin';
import { Employee } from '@/types/auth';
import { EmployeeSummaryTable } from '@/components/admin/EmployeeSummaryTable';
import { AttendanceRecordsTable } from '@/components/admin/AttendanceRecordsTable';
import { PendingApprovalsTable } from '@/components/admin/PendingApprovalsTable';
import { ResetPasswordDialog } from '@/components/admin/ResetPasswordDialog';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [summaries, setSummaries] = useState<EmployeeAttendanceSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters - default to last 7 days
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 6), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/attendance');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedEmployeeId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, employeeData] = await Promise.all([
        adminService.getAttendanceSummary(startDate, endDate, selectedEmployeeId),
        adminService.getAllEmployees(),
      ]);

      setSummaries(summaryData.summaries);
      setEmployees(employeeData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedEmployeeId(undefined);
  };

  if (authLoading || !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t('Admin Dashboard')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Group />}
          onClick={() => router.push('/admin/users')}
        >
          {t('Manage Users')}
        </Button>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          {t('Filters')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('Start Date')}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('End Date')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={selectedEmployeeId ? 2 : 4}>
            <TextField
              fullWidth
              select
              label={t('Employee')}
              value={selectedEmployeeId || ''}
              onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <MenuItem value="">{t('All Employees')}</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.username})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={selectedEmployeeId ? 4 : 2}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ height: '56px' }}
              >
                {t('Clear Filters')}
              </Button>
              {selectedEmployeeId && (
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  startIcon={<LockReset />}
                  onClick={() => setResetPasswordOpen(true)}
                  sx={{ height: '56px' }}
                >
                  {t('Reset Pass')}
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Pending Edit Requests */}
      <PendingApprovalsTable onApprovalAction={loadData} />

      {/* Attendance Records Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3 }}>
          {t('Attendance Records')}
        </Typography>
        <AttendanceRecordsTable
          startDate={startDate}
          endDate={endDate}
          employeeId={selectedEmployeeId}
          employees={employees}
          onRecordUpdated={loadData}
        />
      </Box>

      {/* Employee Summary Table */}
      <Box>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3 }}>
          {t('Employee Time Summary')}
        </Typography>
        {isLoading ? (
          <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <EmployeeSummaryTable
            summaries={summaries}
            onEmployeeClick={(empId) => setSelectedEmployeeId(empId)}
          />
        )}
      </Box>

      <ResetPasswordDialog
        open={resetPasswordOpen}
        employee={employees.find((e) => e.id === selectedEmployeeId) || null}
        onClose={() => setResetPasswordOpen(false)}
        onSuccess={() => {
          // Optional: show snackbar
        }}
      />
    </Container>
  );
}
