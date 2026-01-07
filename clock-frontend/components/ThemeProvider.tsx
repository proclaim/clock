'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { baselightTheme } from '@/utils/theme/DefaultColors';
import typography from '@/utils/theme/Typography';
import components from '@/utils/theme/Components';
import '@/utils/i18n';

const theme = createTheme({
  ...baselightTheme,
  typography,
  shape: {
    borderRadius: 7,
  },
  components: components(baselightTheme as any),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
