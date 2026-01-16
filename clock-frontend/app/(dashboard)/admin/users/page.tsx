'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Button, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import { adminService } from '@/services/adminService';
import { Employee } from '@/types/auth';
import { UserListTable } from '@/components/admin/UserListTable';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { ResetPasswordDialog } from '@/components/admin/ResetPasswordDialog';
import { useRouter } from 'next/navigation';

export default function UserManagementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passwordResetEmployee, setPasswordResetEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {t('User Management')}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            {t('Back to Dashboard')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateOpen(true)}
          >
            {t('Create User')}
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <UserListTable 
          employees={employees} 
          onRefresh={loadData}
          onResetPassword={setPasswordResetEmployee}
        />
      )}

      <CreateUserDialog 
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />

      <ResetPasswordDialog
        open={!!passwordResetEmployee}
        employee={passwordResetEmployee}
        onClose={() => setPasswordResetEmployee(null)}
        onSuccess={() => {}}
      />
    </Container>
  );
}
