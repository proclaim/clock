'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Paper } from '@mui/material';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('Settings')}
      </Typography>

      {/* User Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('Account Information')}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('Username')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {user?.username}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('Name')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {user?.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('Email')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {user?.email || '—'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('Role')}
          </Typography>
          <Typography variant="body1">
            {user?.role}
          </Typography>
        </Box>
      </Paper>

      {/* Change Password */}
      <ChangePasswordForm />
    </Container>
  );
}
