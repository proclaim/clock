'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button,
  Grid,
  TextField,
  Autocomplete,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FilterAlt, Clear } from '@mui/icons-material';
import { AdminLeaveTable } from '@/components/admin/AdminLeaveTable';
import { EditLeaveDialog } from '@/components/admin/EditLeaveDialog';
import { DeleteLeaveConfirmDialog } from '@/components/admin/DeleteLeaveConfirmDialog';
import { adminService } from '@/services/adminService';
import { LeaveWithEmployee } from '@/types/leave';
import { Employee } from '@/types/auth';

export default function AdminLeavesPage() {
  const { t } = useTranslation();
  const [leaves, setLeaves] = useState<LeaveWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveWithEmployee | null>(null);

  const formatDateForApi = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadLeaves = async () => {
    setIsRefreshing(true);
    try {
      const response = await adminService.getLeaves(
        page,
        perPage,
        formatDateForApi(startDate),
        formatDateForApi(endDate),
        selectedEmployee?.id
      );
      setLeaves(response.leaves);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const employees = await adminService.getAllEmployees();
      setEmployees(employees);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadLeaves(), loadEmployees()]);
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [page, perPage, startDate, endDate, selectedEmployee]);

  const handleEdit = (leave: LeaveWithEmployee) => {
    setSelectedLeave(leave);
    setEditDialogOpen(true);
  };

  const handleDelete = (leave: LeaveWithEmployee) => {
    setSelectedLeave(leave);
    setDeleteDialogOpen(true);
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedEmployee(null);
    setPage(1);
  };

  const hasFilters = startDate || endDate || selectedEmployee;

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
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        {t('Leave Management')}
      </Typography>

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterAlt sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('Filters')}
          </Typography>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <DatePicker
                label={t('Start Date')}
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                  setPage(1);
                }}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label={t('End Date')}
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                  setPage(1);
                }}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                value={selectedEmployee}
                onChange={(_, newValue) => {
                  setSelectedEmployee(newValue);
                  setPage(1);
                }}
                options={employees}
                getOptionLabel={(option) => `${option.name} (${option.username})`}
                renderInput={(params) => (
                  <TextField {...params} label={t('Employee')} size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                disabled={!hasFilters}
                sx={{ height: '40px' }}
              >
                {t('Clear')}
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {/* Leave Records Table */}
      {isRefreshing ? (
        <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <AdminLeaveTable
          leaves={leaves}
          total={total}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Edit Dialog */}
      <EditLeaveDialog
        open={editDialogOpen}
        leave={selectedLeave}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedLeave(null);
        }}
        onSaved={loadLeaves}
      />

      {/* Delete Dialog */}
      <DeleteLeaveConfirmDialog
        open={deleteDialogOpen}
        leave={selectedLeave}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedLeave(null);
        }}
        onDeleted={loadLeaves}
      />
    </Container>
  );
}
