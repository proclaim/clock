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
  Box,
  Stack,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import { AttendanceRecordWithEmployee } from '@/types/admin';
import { formatDate, formatTime, calculateDuration, formatDurationMinutes } from '@/utils/dateUtils';

interface PayrollTableProps {
  records: AttendanceRecordWithEmployee[];
  totalMinutes: number;
}

const BOX_SHADOW = 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px';

const isMissingCheckOut = (record: AttendanceRecordWithEmployee): boolean => {
  if (record.check_out_time) return false;
  const checkInDate = new Date(record.check_in_time);
  return checkInDate.toDateString() !== new Date().toDateString();
};

export const PayrollTable: React.FC<PayrollTableProps> = ({ records, totalMinutes }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const totalDisplay = formatDurationMinutes(totalMinutes, i18n.language);

  if (records.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: BOX_SHADOW }}
      >
        <Typography variant="body1" color="text.secondary">
          {t('No attendance records found.')}
        </Typography>
      </Paper>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {records.map((record) => {
          const missing = isMissingCheckOut(record);
          return (
            <Paper
              key={record.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: BOX_SHADOW,
                bgcolor: missing ? alpha(theme.palette.error.main, 0.08) : 'background.paper',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {formatDate(record.check_in_time, i18n.language)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {formatTime(record.check_in_time, i18n.language)}
                {' → '}
                {record.check_out_time ? (
                  formatTime(record.check_out_time as any, i18n.language)
                ) : (
                  <Box component="span" sx={{ color: 'error.main' }}>—</Box>
                )}
                {' • '}
                {calculateDuration(record.check_in_time, record.check_out_time as any, i18n.language)}
              </Typography>
            </Paper>
          );
        })}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            boxShadow: BOX_SHADOW,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('Total')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
            {totalDisplay}
          </Typography>
        </Paper>
      </Stack>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ borderRadius: 2, boxShadow: BOX_SHADOW }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>{t('Date')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Check-In Time')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Check-Out Time')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Duration')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => {
            const missing = isMissingCheckOut(record);
            return (
              <TableRow
                key={record.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: missing ? alpha(theme.palette.error.main, 0.08) : 'inherit',
                  '&:hover': {
                    bgcolor: missing
                      ? alpha(theme.palette.error.main, 0.12)
                      : 'grey.50',
                  },
                }}
              >
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
                    <Typography variant="body2" color="error.main">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {calculateDuration(
                      record.check_in_time,
                      record.check_out_time as any,
                      i18n.language
                    )}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
            <TableCell colSpan={3}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t('Total')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalDisplay}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
