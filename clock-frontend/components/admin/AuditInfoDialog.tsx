'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { AttendanceRecordWithEmployee } from '@/types/admin';
import { formatDateTime } from '@/utils/dateUtils';

interface AuditInfoDialogProps {
  open: boolean;
  record: AttendanceRecordWithEmployee | null;
  onClose: () => void;
}

export const AuditInfoDialog: React.FC<AuditInfoDialogProps> = ({
  open,
  record,
  onClose,
}) => {
  const { t, i18n } = useTranslation();

  if (!record || !record.edited_at) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Audit Information')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('Last Edited At')}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formatDateTime(record.edited_at, i18n.language)}
            </Typography>
          </Box>

          {record.edited_by && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('Edited By (Admin ID)')}
              </Typography>
              <Typography variant="body1">
                <Chip label={`ID: ${record.edited_by}`} size="small" color="primary" />
              </Typography>
            </Box>
          )}

          {record.edit_reason && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('Edit Reason')}
              </Typography>
              <Typography variant="body1" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                {record.edit_reason}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
};
