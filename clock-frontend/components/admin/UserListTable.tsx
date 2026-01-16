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
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LockReset, Block, CheckCircle } from '@mui/icons-material';
import { Employee } from '@/types/auth';
import { adminService } from '@/services/adminService';

interface UserListTableProps {
  employees: Employee[];
  onRefresh: () => void;
  onResetPassword: (employee: Employee) => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  employees,
  onRefresh,
  onResetPassword,
}) => {
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleToggleStatus = async (employee: Employee) => {
    if (!confirm(t("Are you sure you want to change this user's status?"))) return;
    
    setLoadingId(employee.id);
    try {
      await adminService.updateEmployeeStatus(employee.id, !employee.is_active);
      onRefresh();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(t('Failed to update status'));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>{t('Name')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Username')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Role')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{t('Status')}</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">{t('Actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} hover>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.username}</TableCell>
              <TableCell>
                <Chip 
                  label={employee.role} 
                  size="small" 
                  color={employee.role === 'ADMIN' ? 'primary' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={employee.is_active ? t('Active') : t('Inactive')}
                  size="small"
                  color={employee.is_active ? 'success' : 'error'}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title={t('Reset Password')}>
                  <IconButton 
                    color="warning" 
                    onClick={() => onResetPassword(employee)}
                    size="small"
                  >
                    <LockReset />
                  </IconButton>
                </Tooltip>
                <Tooltip title={employee.is_active ? t('Deactivate') : t('Activate')}>
                  <IconButton
                    color={employee.is_active ? 'error' : 'success'}
                    onClick={() => handleToggleStatus(employee)}
                    disabled={loadingId === employee.id}
                    size="small"
                  >
                    {employee.is_active ? <Block /> : <CheckCircle />}
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                {t('No users found')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
