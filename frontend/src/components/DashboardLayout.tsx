import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import ScheduleIcon from '@mui/icons-material/CalendarMonth'; // For Weekly Schedule
import PeopleIcon from '@mui/icons-material/People'; // For Employees
import TuneIcon from '@mui/icons-material/Tune'; // For Weekly Preferences
import LogoutIcon from '@mui/icons-material/Logout'; // For Logout

const drawerWidth = 240;

interface DashboardLayoutProps {
  onLogout: () => Promise<any>; // Callback for logout
}

const navItems = [
  { text: 'Weekly Schedule', path: '/', icon: <ScheduleIcon /> },
  { text: 'Employees', path: '/employees', icon: <PeopleIcon /> },
  { text: 'Weekly Preferences', path: '/preferences', icon: <TuneIcon /> },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  const handleLogout = async () => {
    await onLogout();
    // Navigation to /auth will happen automatically due to App.tsx logic
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Shavzak Shift Scheduler
          </Typography>
          {/* Logout Button in AppBar */}
          <Tooltip title="Logout" style={{ marginLeft: 'auto' }}>
            <IconButton
              color="inherit"
              aria-label="logout"
              onClick={handleLogout} // Assuming handleLogout is defined from props
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> {/* For spacing under the AppBar */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={RouterLink} to={item.path}>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* For spacing under the AppBar in the content area */}
        <Outlet /> {/* This is where the routed components will be rendered */}
      </Box>
    </Box>
  );
};

export default DashboardLayout;