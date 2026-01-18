'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, CircularProgress, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { MonthSelector } from '@/components/attendance/MonthSelector';
import { LeaveTable } from '@/components/leave/LeaveTable';
import { AddLeaveDialog } from '@/components/leave/AddLeaveDialog';
import { leaveService } from '@/services/leaveService';
import { Leave } from '@/types/leave';
import { getCurrentMonth } from '@/utils/dateUtils';

export default function LeavePage() {
  const { t } = useTranslation();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { year: currentYear, month: currentMonth } = getCurrentMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const loadLeaves = async () => {
    setIsRefreshing(true);
    try {
      const response = await leaveService.getLeaves(selectedYear, selectedMonth);
      setLeaves(response.leaves);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadLeaves();
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadLeaves();
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t('Leave')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          {t('Add Leave')}
        </Button>
      </Box>

      <MonthSelector year={selectedYear} month={selectedMonth} onChange={handleMonthChange} />

      {isRefreshing ? (
        <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <LeaveTable leaves={leaves} />
      )}

      <AddLeaveDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSaved={loadLeaves}
      />
    </Container>
  );
}
