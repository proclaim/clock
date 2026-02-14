'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Box,
  CircularProgress,
  TablePagination,
  Button,
  Tooltip,
  Stack,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import { Edit, Delete, Add, Info, ErrorOutline } from '@mui/icons-material';
import { adminService } from '@/services/adminService';
import { AttendanceRecordWithEmployee } from '@/types/admin';
import { Employee } from '@/types/auth';
import { formatDate, formatTime, calculateDuration } from '@/utils/dateUtils';
import { EditRecordDialog } from './EditRecordDialog';
import { AddRecordDialog } from './AddRecordDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { AuditInfoDialog } from './AuditInfoDialog';

interface AttendanceRecordsTableProps {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  employees: Employee[];
  onRecordUpdated?: () => void;
}

export const AttendanceRecordsTable: React.FC<AttendanceRecordsTableProps> = ({
  startDate,
  endDate,
  employeeId,
  employees,
  onRecordUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecordWithEmployee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordWithEmployee | null>(null);

  useEffect(() => {
    loadRecords();
  }, [startDate, endDate, employeeId, page, rowsPerPage]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getAttendanceRecords(
        page + 1,
        rowsPerPage,
        startDate,
        endDate,
        employeeId
      );

      setRecords(response.records);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: AttendanceRecordWithEmployee) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleDelete = (record: AttendanceRecordWithEmployee) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleShowAudit = (record: AttendanceRecordWithEmployee) => {
    setSelectedRecord(record);
    setAuditDialogOpen(true);
  };

  const handleRecordSaved = () => {
    loadRecords();
    if (onRecordUpdated) onRecordUpdated();
  };

  const isMissingCheckOut = (record: AttendanceRecordWithEmployee): boolean => {
    if (record.status !== 'CHECKED_IN' || record.check_out_time) return false;
    const checkInDate = new Date(record.check_in_time);
    const today = new Date();
    return checkInDate.toDateString() !== today.toDateString();
  };

  const getRowBgColor = (record: AttendanceRecordWithEmployee): string => {
    if (isMissingCheckOut(record)) return alpha(theme.palette.error.main, 0.08);
    if (record.status === 'AUTO_CLOSED') return 'warning.lighter';
    return 'inherit';
  };

  const getMobileBgColor = (record: AttendanceRecordWithEmployee): string => {
    if (isMissingCheckOut(record)) return alpha(theme.palette.error.main, 0.08);
    if (record.status === 'AUTO_CLOSED') return 'warning.lighter';
    return 'background.paper';
  };

  const getStatusChip = (record: AttendanceRecordWithEmployee) => {
    if (isMissingCheckOut(record)) {
      return <Chip icon={<ErrorOutline />} label={t('Missing Check-Out')} color="error" size="small" />;
    }
    switch (record.status) {
      case 'CHECKED_OUT':
        return <Chip label={t('Checked Out')} color="success" size="small" />;
      case 'CHECKED_IN':
        return <Chip label={t('Checked In')} color="primary" size="small" />;
      case 'AUTO_CLOSED':
        return <Chip label={t('Auto-Closed')} color="warning" size="small" />;
      default:
        return <Chip label={record.status} size="small" />;
    }
  };

  // Mobile list item component
  const MobileListItem = ({ record }: { record: AttendanceRecordWithEmployee }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
        bgcolor: getMobileBgColor(record),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {record.employee_name}
          </Typography>
        </Box>
        {getStatusChip(record)}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {formatDate(record.check_in_time, i18n.language)}
        <Typography component="span" sx={{ mx: 1, color: 'text.disabled' }}>•</Typography>
        {formatTime(record.check_in_time, i18n.language)} → {record.check_out_time ? formatTime(record.check_out_time as any, i18n.language) : '-'}
        <Typography component="span" sx={{ mx: 1, color: 'text.disabled' }}>•</Typography>
        {calculateDuration(record.check_in_time, record.check_out_time as any, i18n.language)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {record.edited_at && (
          <Tooltip title={t('View Audit Info')}>
            <IconButton size="small" onClick={() => handleShowAudit(record)}>
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={t('Edit')}>
          <IconButton size="small" onClick={() => handleEdit(record)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Delete')}>
          <IconButton size="small" onClick={() => handleDelete(record)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          {t('Add Record')}
        </Button>
      </Box>

      {/* Mobile view */}
      {isMobile ? (
        <Box>
          {records.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {t('No attendance records found.')}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {records.map((record) => (
                <MobileListItem key={record.id} record={record} />
              ))}
            </Stack>
          )}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </Box>
      ) : (
        /* Desktop view */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>{t('Employee')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('Date')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('Check-In Time')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('Check-Out Time')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('Duration')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('Status')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  {t('Actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                      {t('No attendance records found.')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow
                    key={record.id}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      bgcolor: getRowBgColor(record),
                      '&:hover': { bgcolor: 'grey.50' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {record.employee_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(record.check_in_time, i18n.language)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTime(record.check_in_time, i18n.language)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.check_out_time ? (
                        <Typography variant="body2">
                          {formatTime(record.check_out_time as any, i18n.language)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {calculateDuration(record.check_in_time, record.check_out_time as any, i18n.language)}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(record)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {record.edited_at && (
                          <Tooltip title={t('View Audit Info')}>
                            <IconButton size="small" onClick={() => handleShowAudit(record)}>
                              <Info fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('Edit')}>
                          <IconButton size="small" onClick={() => handleEdit(record)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Delete')}>
                          <IconButton size="small" onClick={() => handleDelete(record)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </TableContainer>
      )}

      {/* Dialogs */}
      <EditRecordDialog
        open={editDialogOpen}
        record={selectedRecord}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedRecord(null);
        }}
        onSaved={handleRecordSaved}
      />

      <AddRecordDialog
        open={addDialogOpen}
        employees={employees}
        onClose={() => setAddDialogOpen(false)}
        onSaved={handleRecordSaved}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        record={selectedRecord}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedRecord(null);
        }}
        onDeleted={handleRecordSaved}
      />

      <AuditInfoDialog
        open={auditDialogOpen}
        record={selectedRecord}
        onClose={() => {
          setAuditDialogOpen(false);
          setSelectedRecord(null);
        }}
      />
    </>
  );
};
