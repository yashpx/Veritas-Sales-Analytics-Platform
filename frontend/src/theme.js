import { createTheme } from '@mui/material/styles';

// Create a theme instance based on the existing CSS variables and styles
const theme = createTheme({
  palette: {
    primary: {
      main: '#5a2ca0', // --primary-color
      dark: '#4a1f90', // --primary-hover
      light: '#f5f0ff', // --primary-light
      contrastText: '#fff',
    },
    secondary: {
      main: '#10b981', // --success-color
      light: '#dcfce7', // --success-light
      dark: '#059669',
      contrastText: '#fff',
    },
    error: {
      main: '#ef4444', // --error-color
      light: '#fee2e2', // --error-light
      dark: '#b91c1c',
    },
    background: {
      default: '#f9fafb', // --bg-light
      paper: '#ffffff', // --bg-white
      dark: '#1f2937', // --bg-dark
    },
    text: {
      primary: '#111827', // --text-dark
      secondary: '#4b5563', // --text-medium
      disabled: '#9ca3af', // --text-light
    },
    divider: '#e5e7eb', // --input-border
    action: {
      active: '#5a2ca0',
      hover: 'rgba(90, 44, 160, 0.08)',
      selected: 'rgba(90, 44, 160, 0.16)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      '"Open Sans"',
      '"Helvetica Neue"',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#9ca3af', // --text-light
    },
  },
  shape: {
    borderRadius: 8, // Default border radius
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.05)',
    '0 1px 3px rgba(0, 0, 0, 0.1)',
    '0 2px 4px rgba(0, 0, 0, 0.1)',
    '0 4px 6px rgba(0, 0, 0, 0.1)',
    '0 8px 8px rgba(0, 0, 0, 0.1)',
    '0 8px 16px rgba(0, 0, 0, 0.1)',
    '0 10px 20px rgba(0, 0, 0, 0.15)',
    '0 12px 24px rgba(0, 0, 0, 0.15)',
    '0 14px 28px rgba(0, 0, 0, 0.15)',
    '0 16px 32px rgba(0, 0, 0, 0.15)',
    '0 20px 40px rgba(0, 0, 0, 0.2)',
    '0 24px 48px rgba(0, 0, 0, 0.2)',
    '0 32px 64px rgba(0, 0, 0, 0.2)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
    '0 40px 80px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    // MUI Button customization
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '0.875rem 1.5rem',
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          backgroundColor: '#5a2ca0', // --primary-color
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#4a1f90', // --primary-hover
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(90, 44, 160, 0.08)',
          },
        },
        sizeLarge: {
          padding: '1rem 2rem',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
        },
      },
    },
    // MUI TextField customization
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          marginBottom: '1.25rem',
        },
      },
    },
    // MUI Input customization
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9ca3af', // --text-light
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5a2ca0', // --primary-color
            borderWidth: '1px',
            boxShadow: '0 0 0 2px rgba(90, 44, 160, 0.2)',
          },
        },
        input: {
          padding: '0.875rem 1rem',
          '&::placeholder': {
            color: '#9ca3af', // --text-light
            opacity: 1,
          },
        },
        notchedOutline: {
          borderColor: '#e5e7eb', // --input-border
        },
      },
    },
    // MUI Input Label customization
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.9rem',
          color: '#4b5563', // --text-medium
          fontWeight: 500,
          '&.Mui-focused': {
            color: '#5a2ca0', // --primary-color
          },
        },
      },
    },
    // MUI Card customization
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    // MUI Paper customization
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        elevation4: {
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    // MUI List Item customization
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(90, 44, 160, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(90, 44, 160, 0.16)',
            },
          },
        },
      },
    },
    // MUI Table customization
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f0f0f0',
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f9fafb',
          color: '#4b5563',
        },
      },
    },
    // MUI Chip customization
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: 'rgba(90, 44, 160, 0.1)',
          color: '#5a2ca0',
        },
        colorSecondary: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
        },
        colorError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
        },
      },
    },
    // MUI Alert customization
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: '#dcfce7', // --success-light
          color: '#10b981', // --success-color
          '& .MuiAlert-icon': {
            color: '#10b981',
          },
        },
        standardError: {
          backgroundColor: '#fee2e2', // --error-light
          color: '#ef4444', // --error-color
          '& .MuiAlert-icon': {
            color: '#ef4444',
          },
        },
        standardInfo: {
          backgroundColor: '#f5f0ff', // --primary-light
          color: '#5a2ca0', // --primary-color
          '& .MuiAlert-icon': {
            color: '#5a2ca0',
          },
        },
      },
    },
    // MUI Checkbox customization
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#e5e7eb', // --input-border
          '&.Mui-checked': {
            color: '#5a2ca0', // --primary-color
          },
        },
      },
    },
    // MUI Dialog customization
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    // MUI Backdrop customization
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
      },
    },
    // MUI Tabs customization
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
          minWidth: 100,
          '&.Mui-selected': {
            fontWeight: 600,
          },
        },
      },
    },
    // MUI Tooltip customization
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1f2937', // --bg-dark
          padding: '8px 12px',
          fontSize: '0.75rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme;