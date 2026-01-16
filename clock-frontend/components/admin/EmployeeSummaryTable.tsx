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
  Chip,
} from '@mui/material';
import { EmployeeAttendanceSummary } from '@/types/admin';

interface EmployeeSummaryTableProps {
  summaries: EmployeeAttendanceSummary[];
  onEmployeeClick?: (employeeId: number) => void;
}

export const EmployeeSummaryTable: React.FC<EmployeeSummaryTableProps> = ({
  summaries,
  onEmployeeClick,
}) => {
  const { t } = useTranslation();

  if (summaries.length === 0) {
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
          {t('No employee data found for the selected period.')}
        </Typography>
      </Paper>
    );
  }

  const totalHours = summaries.reduce((sum, s) => sum + s.total_hours + s.total_minutes / 60, 0);

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
            <TableCell sx={{ fontWeight: 600 }}>{t('Username')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              {t('Total Records')}
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              {t('Total Hours')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow
              key={summary.employee_id}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { bgcolor: 'action.hover', cursor: onEmployeeClick ? 'pointer' : 'default' },
              }}
              onClick={() => onEmployeeClick && onEmployeeClick(summary.employee_id)}
            >
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {summary.employee_name}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={summary.username} size="small" color="primary" variant="outlined" />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">{summary.total_records}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {summary.total_hours}h {summary.total_minutes}m
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {/* Total Row */}
          <TableRow sx={{ bgcolor: 'success.lighter' }}>
            <TableCell colSpan={3}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {t('Grand Total')}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {Math.floor(totalHours)}h {Math.round((totalHours % 1) * 60)}m
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
