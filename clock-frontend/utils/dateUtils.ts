import { format, parseISO, differenceInMinutes, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AttendanceRecord } from '@/types/attendance';

const getLocale = (lang: string) => {
  return lang === 'zh-TW' ? zhTW : undefined;
};

export const formatDate = (dateString: string, lang: string = 'en'): string => {
  try {
    const date = parseISO(dateString);
    if (lang === 'zh-TW') {
      return format(date, 'M月d日 (EEEEE)', { locale: getLocale(lang) });
    }
    return format(date, 'EEEE, MMM d, yyyy', { locale: getLocale(lang) });
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatTime = (dateString: string, lang: string = 'en'): string => {
  try {
    const date = parseISO(dateString);
    if (lang === 'zh-TW') {
      return format(date, 'aa h:mm', { locale: getLocale(lang) });
    }
    return format(date, 'h:mm a', { locale: getLocale(lang) });
  } catch (error) {
    return 'Invalid time';
  }
};

export const formatDateTime = (dateString: string, lang: string = 'en'): string => {
  try {
    const date = parseISO(dateString);
    if (lang === 'zh-TW') {
      return format(date, 'M月d日 (EEEEE) aa h:mm', { locale: getLocale(lang) });
    }
    return format(date, 'EEEE, MMM d, yyyy h:mm a', { locale: getLocale(lang) });
  } catch (error) {
    return 'Invalid date/time';
  }
};

export const calculateDuration = (
  checkInTime: string,
  checkOutTime: string | null,
  lang: string = 'en'
): string => {
  if (!checkOutTime) {
    return '—';
  }

  try {
    const checkIn = parseISO(checkInTime);
    const checkOut = parseISO(checkOutTime);

    if (!isValid(checkIn) || !isValid(checkOut)) {
      return '—';
    }

    const minutes = differenceInMinutes(checkOut, checkIn);

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (lang === 'zh-TW') {
      if (hours === 0) {
        return `${mins}分`;
      }
      return `${hours}小時 ${mins}分`;
    }

    if (hours === 0) {
      return `${mins}m`;
    }

    return `${hours}h ${mins}m`;
  } catch (error) {
    return '—';
  }
};

export const calculateTotalDuration = (records: AttendanceRecord[], lang: string = 'en'): string => {
  let totalMinutes = 0;

  records.forEach((record) => {
    if (record.check_out_time) {
      try {
        const checkIn = parseISO(record.check_in_time);
        const checkOut = parseISO(record.check_out_time);
        totalMinutes += differenceInMinutes(checkOut, checkIn);
      } catch (e) {
        // ignore invalid dates
      }
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (lang === 'zh-TW') {
    return `${hours}小時 ${mins}分`;
  }
  return `${hours}h ${mins}m`;
};

export const getCurrentMonth = (): { year: number; month: number } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // 1-based month
  };
};

export const getMonthName = (month: number, lang: string = 'en'): string => {
  try {
    // Create a date for the 1st of the given month
    const date = new Date(2000, month - 1, 1);
    return format(date, 'MMMM', { locale: getLocale(lang) });
  } catch (error) {
    return '';
  }
};
