'use client';

import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';

const CustomFormLabel = styled((props: any) => (
  <Typography
    variant="subtitle1"
    fontWeight={600}
    {...props}
    component="label"
    htmlFor={props.htmlFor}
  />
))(() => ({
  marginBottom: '5px',
  marginTop: '25px',
  display: 'block',
}));

const CustomTextField = styled((props: any) => <TextField {...props} />)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    padding: '14px 14px',
    lineHeight: '1.6',
  },
  '& .MuiOutlinedInput-input::-webkit-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '0.8',
  },
  '& .MuiOutlinedInput-input.Mui-disabled::-webkit-input-placeholder': {
    color: theme.palette.text.secondary,
    opacity: '1',
  },
  '& .Mui-disabled .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.grey[200],
  },
}));

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = yup.object({
    username: yup.string().required(t('Username is required')),
    password: yup.string().required(t('Password is required')),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setError('');
      setIsLoading(true);

      try {
        await login(values.username, values.password);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('Login failed'));
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
        position: 'relative',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          maxWidth: 450,
          width: '100%',
          mx: 2,
          borderRadius: 3,
          boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img
            src="/logo.jpg"
            alt="Clock Logo"
            style={{
              width: '112px',
              height: '112px',
              objectFit: 'cover',
              borderRadius: '12px',
            }}
          />
        </Box>

        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Stack>
              <Box>
                <CustomFormLabel htmlFor="username">{t('Username')}</CustomFormLabel>
                <CustomTextField
                  id="username"
                  name="username"
                  variant="outlined"
                  fullWidth
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.username && Boolean(formik.errors.username)}
                  helperText={formik.touched.username && formik.errors.username}
                />
              </Box>
              <Box>
                <CustomFormLabel htmlFor="password">{t('Password')}</CustomFormLabel>
                <CustomTextField
                  id="password"
                  name="password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Box>
            </Stack>

            <Box mt={3}>
              <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : t('Sign In')}
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};
