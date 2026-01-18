'use client';

import React from 'react';
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
  IconButton,
  Tooltip,
  TablePagination,
  Box,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { LeaveWithEmployee } from '@/types/leave';

interface AdminLeaveTableProps {
  leaves: LeaveWithEmployee[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (leave: LeaveWithEmployee) => void;
  onDelete: (leave: LeaveWithEmployee) => void;
}

export const AdminLeaveTable: React.FC<AdminLeaveTableProps> = ({
  leaves,
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  onEdit,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (leaves.length === 0) {
    return (
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
          {t('No leave records found.')}
        </Typography>
      </Paper>
    );
  }

  return (
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
            <TableCell sx={{ fontWeight: 600 }}>{t('Start Date')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('End Date')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Days')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Note')}</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 100 }}>{t('Actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow
              key={leave.id}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { bgcolor: 'grey.50' },
              }}
            >
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {leave.employee_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{leave.employee_username}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(leave.start_date)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(leave.end_date)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {leave.days} {leave.days === 1 ? t('day') : t('days')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color={leave.note ? 'text.primary' : 'text.secondary'}>
                  {leave.note || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title={t('Edit')}>
                    <IconButton size="small" onClick={() => onEdit(leave)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('Delete')}>
                    <IconButton size="small" color="error" onClick={() => onDelete(leave)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={perPage}
        onRowsPerPageChange={(e) => onPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[25, 50, 100]}
        labelRowsPerPage={t('Rows per page:')}
      />
    </TableContainer>
  );
};
