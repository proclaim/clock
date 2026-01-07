import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './languages/en.json';
import zhTW from './languages/zh-TW.json';

const resources = {
  en: {
    translation: en,
  },
  'zh-TW': {
    translation: zhTW,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-TW', // Default to Traditional Chinese as requested
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
