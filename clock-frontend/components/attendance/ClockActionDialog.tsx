'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Typography,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers';
import { startOfDay, endOfDay, format, parseISO } from 'date-fns';
import { attendanceService } from '@/services/attendanceService';
import { ClockAction } from '@/types/attendance';
import { scrollMeridiemToTop } from '@/utils/timePicker';

type TimeChoice = 'usual' | 'now' | 'custom';

interface ClockActionDialogProps {
  open: boolean;
  action: ClockAction;
  onClose: () => void;
  // chosenTime is null when the current time should be recorded
  onConfirm: (chosenTime: Date | null) => Promise<void>;
}

export const ClockActionDialog: React.FC<ClockActionDialogProps> = ({
  open,
  action,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const isCheckIn = action === 'check_in';

  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState<Date | null>(null);
  const [choice, setChoice] = useState<TimeChoice>('now');
  const [customTime, setCustomTime] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setChoice('now');
    setSuggestedTime(null);
    setCustomTime(new Date());
    setError('');
    setIsSubmitting(false);

    let cancelled = false;
    setIsLoadingSuggestion(true);
    attendanceService
      .getSuggestedTime(action)
      .then((result) => {
        if (cancelled) return;
        if (result.has_suggestion && result.suggested_time) {
          setSuggestedTime(parseISO(result.suggested_time));
          setChoice('usual');
        }
      })
      .catch(() => {
        // No suggestion available; fall back to "now"
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSuggestion(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, action]);

  const handleConfirm = async () => {
    let chosenTime: Date | null = null;

    if (choice === 'usual') {
      chosenTime = suggestedTime;
    } else if (choice === 'custom') {
      if (!customTime) {
        setError(t('Please pick a time'));
        return;
      }
      chosenTime = customTime;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(chosenTime);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmLabel = isCheckIn ? t('Check In') : t('Check Out');
  const submittingLabel = isCheckIn ? t('Checking In...') : t('Checking Out...');

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isCheckIn ? t('Confirm Check In') : t('Confirm Check Out')}</DialogTitle>
      <DialogContent>
        {isLoadingSuggestion ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            {suggestedTime && (
              <Typography sx={{ mb: 1 }}>
                {isCheckIn
                  ? t('You usually clock in at {{time}}', { time: format(suggestedTime, 'HH:mm') })
                  : t('You usually clock out at {{time}}', { time: format(suggestedTime, 'HH:mm') })}
              </Typography>
            )}

            <FormControl fullWidth>
              <RadioGroup value={choice} onChange={(e) => setChoice(e.target.value as TimeChoice)}>
                {suggestedTime && (
                  <FormControlLabel
                    value="usual"
                    control={<Radio />}
                    label={t('Usual time ({{time}})', { time: format(suggestedTime, 'HH:mm') })}
                  />
                )}
                <FormControlLabel
                  value="now"
                  control={<Radio />}
                  label={t('Now ({{time}})', { time: format(new Date(), 'HH:mm') })}
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label={t('Pick a different time')}
                />
              </RadioGroup>
            </FormControl>

            {choice === 'custom' && (
              <Box sx={{ mt: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label={isCheckIn ? t('Check-In Time') : t('Check-Out Time')}
                    value={customTime}
                    onChange={(newValue) => setCustomTime(newValue)}
                    minDateTime={startOfDay(new Date())}
                    maxDateTime={endOfDay(new Date())}
                    timeSteps={{ minutes: 15 }}
                    viewRenderers={{
                      hours: renderMultiSectionDigitalClockTimeView as any,
                      minutes: renderMultiSectionDigitalClockTimeView as any,
                      meridiem: renderMultiSectionDigitalClockTimeView as any,
                    }}
                    onOpen={() => setTimeout(scrollMeridiemToTop, 150)}
                    onViewChange={(view) => {
                      if (view !== 'day' && view !== 'month' && view !== 'year') {
                        scrollMeridiemToTop();
                      }
                    }}
                    slotProps={{
                      textField: { fullWidth: true },
                      popper: {
                        sx: {
                          '.MuiMultiSectionDigitalClockSection-root:last-of-type': {
                            overflow: 'hidden',
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={isCheckIn ? 'success' : 'error'}
          disabled={isSubmitting || isLoadingSuggestion}
        >
          {isSubmitting ? submittingLabel : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
