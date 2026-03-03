'use client';

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getMonthName } from '@/utils/dateUtils';

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ year, month, onChange }) => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>{t('Year')}</InputLabel>
        <Select
          value={year}
          label={t('Year')}
          onChange={(e) => onChange(Number(e.target.value), month)}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t('Month')}</InputLabel>
        <Select
          value={month}
          label={t('Month')}
          onChange={(e) => onChange(year, Number(e.target.value))}
        >
          {months.map((m) => (
            <MenuItem key={m} value={m}>
              {getMonthName(m, i18n.language)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
