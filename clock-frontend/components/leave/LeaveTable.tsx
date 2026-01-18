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
} from '@mui/material';
import { Leave } from '@/types/leave';

interface LeaveTableProps {
  leaves: Leave[];
}

export const LeaveTable: React.FC<LeaveTableProps> = ({ leaves }) => {
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
          {t('No leave records found for this month.')}
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
            <TableCell sx={{ fontWeight: 600 }}>{t('Start Date')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('End Date')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Days')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Note')}</TableCell>
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
                  {formatDate(leave.start_date)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
