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
} from '@mui/material';
import { Edit, Delete, Add, Info } from '@mui/icons-material';
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

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'CHECKED_OUT':
        return <Chip label={t('Checked Out')} color="success" size="small" />;
      case 'CHECKED_IN':
        return <Chip label={t('Checked In')} color="primary" size="small" />;
      case 'AUTO_CLOSED':
        return <Chip label={t('Auto-Closed')} color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

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
                    bgcolor: record.status === 'AUTO_CLOSED' ? 'warning.lighter' : 'inherit',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {record.employee_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.employee_username}
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
                  <TableCell>{getStatusChip(record.status)}</TableCell>
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
