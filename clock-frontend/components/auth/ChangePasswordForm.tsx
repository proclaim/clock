'use client';

import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';

export const ChangePasswordForm: React.FC = () => {
  const { changePassword } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = yup.object({
    currentPassword: yup.string().required(t('Current password is required')),
    newPassword: yup
      .string()
      .min(6, t('Password must be at least 6 characters'))
      .required(t('New password is required')),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('newPassword')], t('Passwords must match'))
      .required(t('Please confirm your new password')),
  });

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setError('');
      setSuccess('');
      setIsLoading(true);

      try {
        await changePassword(values.currentPassword, values.newPassword);
        setSuccess(t('Password changed successfully!'));
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('Failed to change password'));
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        {t('Change Password')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="currentPassword"
          name="currentPassword"
          label={t('Current Password')}
          type="password"
          value={formik.values.currentPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
          helperText={formik.touched.currentPassword && formik.errors.currentPassword}
          margin="normal"
          autoComplete="current-password"
        />

        <TextField
          fullWidth
          id="newPassword"
          name="newPassword"
          label={t('New Password')}
          type="password"
          value={formik.values.newPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
          helperText={formik.touched.newPassword && formik.errors.newPassword}
          margin="normal"
          autoComplete="new-password"
        />

        <TextField
          fullWidth
          id="confirmPassword"
          name="confirmPassword"
          label={t('Confirm New Password')}
          type="password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
          helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
          margin="normal"
          autoComplete="new-password"
        />

        <Button
          color="primary"
          variant="contained"
          fullWidth
          type="submit"
          disabled={isLoading}
          sx={{ mt: 3 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : t('Change Password')}
        </Button>
      </form>
    </Paper>
  );
};
