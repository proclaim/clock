'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { AttendanceRecord } from '@/types/attendance';
import { formatTime } from '@/utils/dateUtils';

interface AttendanceStatusProps {
  isCheckedIn: boolean;
  currentRecord: AttendanceRecord | null;
}

export const AttendanceStatus: React.FC<AttendanceStatusProps> = ({
  isCheckedIn,
  currentRecord,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        boxShadow: 'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {t('Current Status')}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
        {isCheckedIn ? (
          <>
            <Chip
              icon={<CheckCircle />}
              label={t('Checked In')}
              color="success"
              size="medium"
            />
            {currentRecord && (
              <Typography variant="body2" color="text.secondary">
                {t('Since')} {formatTime(currentRecord.check_in_time, i18n.language)}
              </Typography>
            )}
          </>
        ) : (
          <Chip
            icon={<Cancel />}
            label={t('Not Checked In')}
            color="default"
            size="medium"
          />
        )}
      </Box>
    </Paper>
  );
};
