const baselightTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      main: '#0085db',
      light: '#e5f3fb',
      dark: '#0085db',
    },
    secondary: {
      main: '#707a82',
      light: '#e7ecf0',
      dark: '#707a82',
    },
    success: {
      main: '#4bd08b',
      light: '#dffff3',
      dark: '#4bd08b',
      contrastText: '#ffffff',
    },
    info: {
      main: '#46caeb',
      light: '#e1f5fa',
      dark: '#46caeb',
      contrastText: '#ffffff',
    },
    error: {
      main: '#fb977d',
      light: '#ffede9',
      dark: '#fb977d',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f8c076',
      light: '#fff6ea',
      dark: '#f8c076',
      contrastText: '#ffffff',
    },
    purple: {
      A50: '#f1ebff',
      A100: '#8763da',
      A200: '#557fb9',
    },
    grey: {
      100: '#F2F6FA',
      200: '#f0f5f9',
      300: '#DFE5EF',
      400: '#7C8FAC',
      500: '#5A6A85',
      600: '#111c2d',

    },
    text: {
      primary: '#111c2d',
      secondary: '#111c2d',
    },
    action: {
      disabledBackground: 'rgba(73,82,88,0.12)',
      hoverOpacity: 0.02,
      hover: '#f6f9fc',
    },
    divider: '#e5eaef',
    background: {
      default: '#F0F5F9',
      dark: '#F0F5F9',
      paper: '#ffffff',
    },
  },
};

const baseDarkTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      main: '#0085db',
      light: '#ECF2FF',
      dark: '#4570EA',
    },
    secondary: {
      main: '#707a82',
      light: '#1C455D',
      dark: '#173f98',
    },
    success: {
      main: '#4bd08b',
      light: '#1B3C48',
      dark: '#02b3a9',
      contrastText: '#ffffff',
    },
    info: {
      main: '#46caeb',
      light: '#223662',
      dark: '#1682d4',
      contrastText: '#ffffff',
    },
    error: {
      main: '#fb977d',
      light: '#4B313D',
      dark: '#f3704d',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f8c076',
      light: '#4D3A2A',
      dark: '#ae8e59',
      contrastText: '#ffffff',
    },
    purple: {
      A50: '#EBF3FE',
      A100: '#6610f2',
      A200: '#557fb9',
    },
    grey: {
      100: '#333F55',
      200: '#465670',
      300: '#7C8FAC',
      400: '#DFE5EF',
      500: '#EAEFF4',
      600: '#F2F6FA'
    },
    text: {
      primary: '#EAEFF4',
      secondary: '#c6d1e9',
    },
    action: {
      disabledBackground: 'rgba(73,82,88,0.12)',
      hoverOpacity: 0.02,
      hover: '#333F55',
    },
    divider: '#333F55',
    background: {
      default: '#15263A',
      dark: '#15263A',
      paper: '#111C2D',
    },
  },
};

export { baseDarkTheme, baselightTheme };
