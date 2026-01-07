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
  Chip,
  Typography,
  Box,
} from '@mui/material';
import { CheckCircle, Cancel, Warning } from '@mui/icons-material';
import { AttendanceRecord } from '@/types/attendance';
import { formatDate, formatTime, calculateDuration } from '@/utils/dateUtils';

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ records }) => {
  const { t, i18n } = useTranslation();

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'CHECKED_OUT':
        return <Chip icon={<CheckCircle />} label={t('Checked Out')} color="success" size="small" />;
      case 'CHECKED_IN':
        return <Chip icon={<CheckCircle />} label={t('Checked In')} color="primary" size="small" />;
      case 'AUTO_CLOSED':
        return <Chip icon={<Warning />} label={t('Auto-Closed')} color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (records.length === 0) {
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
          {t('No attendance records found for this month.')}
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
            <TableCell sx={{ fontWeight: 600 }}>{t('Date')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Check-In Time')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Check-Out Time')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Duration')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Status')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
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
                  {formatDate(record.check_in_time, i18n.language)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{formatTime(record.check_in_time, i18n.language)}</Typography>
              </TableCell>
              <TableCell>
                {record.check_out_time ? (
                  <Typography variant="body2">{formatTime(record.check_out_time, i18n.language)}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {calculateDuration(record.check_in_time, record.check_out_time, i18n.language)}
                </Typography>
              </TableCell>
              <TableCell>{getStatusChip(record.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
