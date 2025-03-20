# UI Standardization Guide

This document provides guidelines for standardizing the UI components in the Veritas Authentication project using Material UI (MUI).

## Overview

We've standardized on Material UI (MUI) as our primary UI component library. All new components and pages should be built using MUI components to ensure consistency.

## Theme Setup

We've created a central theme configuration in `src/theme.js` that defines our color palette, typography, component styles, and more. This theme is applied to the entire application through the `ThemeProvider` in `App.js`.

## Key Benefits

- **Consistent styling**: All components look and behave consistently across the application
- **Easier maintenance**: Style changes can be made in one place
- **Better developer experience**: Reduces decision fatigue and speeds up development
- **Responsive design**: MUI components are responsive by default

## How to Use MUI Components

### Basic Example

```jsx
import { Box, Typography, Button } from '@mui/material';

function MyComponent() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
        My Title
      </Typography>
      <Button variant="contained" color="primary">
        Click Me
      </Button>
    </Box>
  );
}
```

### Using Theme Variables

Our theme defines a consistent set of colors, typography, spacing, and more. You can access these variables using the `sx` prop:

```jsx
<Box 
  sx={{ 
    bgcolor: 'background.paper',
    color: 'text.primary',
    p: 3,
    borderRadius: 2
  }}
>
  Content here
</Box>
```

## Component Guidelines

### Typography

Use MUI Typography components for text with appropriate variants:

```jsx
<Typography variant="h1">Page Title</Typography>
<Typography variant="h2">Section Title</Typography>
<Typography variant="body1">Main paragraph text</Typography>
<Typography variant="body2">Smaller text</Typography>
<Typography variant="caption">Caption text</Typography>
```

### Layout and Spacing

Use the Box and Grid components for layout:

```jsx
<Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
  <Box flex={1}>Left content</Box>
  <Box flex={2}>Right content</Box>
</Box>

<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <Box>Column 1</Box>
  </Grid>
  <Grid item xs={12} md={6}>
    <Box>Column 2</Box>
  </Grid>
</Grid>
```

### Forms

Use MUI form components for all forms:

```jsx
<TextField 
  label="Email" 
  fullWidth 
  variant="outlined" 
  margin="normal" 
/>

<FormControl fullWidth margin="normal">
  <InputLabel>Role</InputLabel>
  <Select value={role} onChange={handleChange}>
    <MenuItem value="user">User</MenuItem>
    <MenuItem value="admin">Admin</MenuItem>
  </Select>
</FormControl>
```

### Cards and Containers

Use MUI Paper and Card components for containers:

```jsx
<Card sx={{ p: 3, borderRadius: 2 }}>
  <CardHeader title="Card Title" />
  <CardContent>
    <Typography>Card content goes here</Typography>
  </CardContent>
  <CardActions>
    <Button size="small">Action</Button>
  </CardActions>
</Card>
```

### Status Indicators

Use consistent components for status:

```jsx
// For success/error messages
<Alert severity="success">Operation successful!</Alert>
<Alert severity="error">An error occurred</Alert>

// For status indicators
<Chip label="Active" color="success" />
<Chip label="Pending" color="warning" />
<Chip label="Failed" color="error" />
```

### Buttons

Follow a consistent button hierarchy:

```jsx
// Primary action
<Button variant="contained" color="primary">Save</Button>

// Secondary action
<Button variant="outlined" color="primary">Cancel</Button>

// Tertiary action
<Button variant="text" color="primary">Learn More</Button>

// Danger action
<Button variant="contained" color="error">Delete</Button>
```

## Responsive Design

MUI provides tools for responsive design:

```jsx
// Responsive spacing
<Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>

// Responsive typography
<Typography sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>

// Responsive layout
<Box sx={{ 
  display: 'flex', 
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 2, md: 4 }
}}>
```

## Component Migration

When migrating existing components:

1. Replace custom UI components with MUI equivalents
2. Use the theme's color palette instead of CSS variables
3. Replace custom CSS with the `sx` prop
4. Use MUI spacing system (1 = 8px, 2 = 16px, etc.)

## Developer Tools

Install the React Developer Tools and MUI DevTools extensions for Chrome to inspect and debug MUI components and theme values.

## Questions and Support

If you have questions about using MUI or the theme, check out:

- [Material UI Documentation](https://mui.com/material-ui/getting-started/overview/)
- The comments in `src/theme.js` for our custom theme configuration