'use client';

import React, { useState } from 'react';
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
  Stack,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import { CheckCircle, Warning, Edit, ErrorOutline } from '@mui/icons-material';
import { AttendanceRecord } from '@/types/attendance';
import { formatDate, formatTime, calculateDuration } from '@/utils/dateUtils';
import { EditRequestDialog } from './EditRequestDialog';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onEditRequestSubmitted?: () => void;
}

// Check if a record is a missing check-out (checked in on a previous day, no check-out)
const isMissingCheckOut = (record: AttendanceRecord): boolean => {
  if (record.status !== 'CHECKED_IN' || record.check_out_time) return false;
  const checkInDate = new Date(record.check_in_time);
  const today = new Date();
  return checkInDate.toDateString() !== today.toDateString();
};

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, onEditRequestSubmitted }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const handleEditClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const getRowBgColor = (record: AttendanceRecord): string => {
    if (isMissingCheckOut(record)) return alpha(theme.palette.error.main, 0.08);
    if (record.status === 'AUTO_CLOSED') return alpha(theme.palette.warning.main, 0.08);
    return 'inherit';
  };

  const getMobileBgColor = (record: AttendanceRecord): string => {
    if (isMissingCheckOut(record)) return alpha(theme.palette.error.main, 0.08);
    if (record.status === 'AUTO_CLOSED') return alpha(theme.palette.warning.main, 0.08);
    return theme.palette.background.paper;
  };

  const getStatusChip = (record: AttendanceRecord) => {
    if (isMissingCheckOut(record)) {
      return <Chip icon={<ErrorOutline />} label={t('Missing Check-Out')} color="error" size="small" />;
    }
    switch (record.status) {
      case 'CHECKED_OUT':
        return <Chip icon={<CheckCircle />} label={t('Checked Out')} color="success" size="small" />;
      case 'CHECKED_IN':
        return <Chip icon={<CheckCircle />} label={t('Checked In')} color="primary" size="small" />;
      case 'AUTO_CLOSED':
        return <Chip icon={<Warning />} label={t('Auto-Closed')} color="warning" size="small" />;
      default:
        return <Chip label={record.status} size="small" />;
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

  // Mobile compact list item
  const MobileListItem = ({ record }: { record: AttendanceRecord }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
        bgcolor: getMobileBgColor(record),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {formatDate(record.check_in_time, i18n.language)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatTime(record.check_in_time, i18n.language)} → {record.check_out_time ? formatTime(record.check_out_time, i18n.language) : '-'}
            <Typography component="span" sx={{ mx: 1.5, color: 'text.disabled' }}>|</Typography>
            {calculateDuration(record.check_in_time, record.check_out_time, i18n.language)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={t('Request Edit')}>
            <IconButton size="small" onClick={() => handleEditClick(record)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {getStatusChip(record)}
        </Box>
      </Box>
    </Paper>
  );

  // Mobile view - compact list
  if (isMobile) {
    return (
      <>
        <Stack spacing={1.5}>
          {records.map((record) => (
            <MobileListItem key={record.id} record={record} />
          ))}
        </Stack>

        <EditRequestDialog
          open={editDialogOpen}
          record={selectedRecord}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedRecord(null);
          }}
          onSubmitted={() => {
            if (onEditRequestSubmitted) onEditRequestSubmitted();
          }}
        />
      </>
    );
  }

  // Desktop view - table
  return (
    <>
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
              <TableCell sx={{ fontWeight: 600 }} align="right">{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
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
                <TableCell>{getStatusChip(record)}</TableCell>
                <TableCell align="right">
                  <Tooltip title={t('Request Edit')}>
                    <IconButton size="small" onClick={() => handleEditClick(record)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EditRequestDialog
        open={editDialogOpen}
        record={selectedRecord}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedRecord(null);
        }}
        onSubmitted={() => {
          if (onEditRequestSubmitted) onEditRequestSubmitted();
        }}
      />
    </>
  );
};
