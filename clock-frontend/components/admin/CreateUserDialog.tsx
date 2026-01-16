'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import { adminService } from '@/services/adminService';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username || !name || !password) {
      setError(t('All fields are required'));
      return;
    }
    if (password.length < 6) {
      setError(t('Password must be at least 6 characters'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await adminService.createEmployee({
        username,
        name,
        password,
        role,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('Failed to create user'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setName('');
    setPassword('');
    setRole('STAFF');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Create New User')}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label={t('Username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label={t('Name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label={t('Password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText={t('Initial password for the user')}
        />
        <TextField
          fullWidth
          select
          margin="normal"
          label={t('Role')}
          value={role}
          onChange={(e) => setRole(e.target.value as 'STAFF' | 'ADMIN')}
        >
          <MenuItem value="STAFF">{t('Staff')}</MenuItem>
          <MenuItem value="ADMIN">{t('Admin')}</MenuItem>
        </TextField>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? t('Creating...') : t('Create User')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
