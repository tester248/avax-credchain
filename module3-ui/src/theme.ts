import { createTheme } from '@mui/material/styles';

// Map existing light theme variables to MUI palette & typography
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // indigo-500 like
      light: '#818cf8',
      dark: '#4f46e5'
    },
    secondary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#5b21b6'
    },
    success: {
      main: '#10b981'
    },
    warning: {
      main: '#f59e0b'
    },
    error: {
      main: '#ef4444'
    },
    info: {
      main: '#0ea5e9'
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff'
    },
    divider: '#e2e8f0',
    text: {
      primary: '#111827',
      secondary: '#374151'
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen',
    h1: { fontSize: '2.25rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.4rem', fontWeight: 600 },
    h4: { fontSize: '1.2rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: '#e2e8f0'
        }
      }
    }
  }
});

export default theme;
