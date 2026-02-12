// components/Layout.js
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Avatar,
  Typography
} from '@mui/material';
import {
  Home as HomeIcon,
  DirectionsRun as TrainingIcon,
  BarChart as StatsIcon,
  Person as ProfileIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useData();

  const getNavValue = () => {
    const path = location.pathname;
    if (path.includes('/home')) return 0;
    if (path.includes('/training')) return 1;
    if (path.includes('/statistics')) return 2;
    if (path.includes('/profile')) return 3;
    return 0;
  };

  return (
    <Box sx={{ pb: 7, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <Outlet />
        
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            borderRadius: 0
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={getNavValue()}
            onChange={(event, newValue) => {
              switch(newValue) {
                case 0: navigate('/home'); break;
                case 1: navigate('/training'); break;
                case 2: navigate('/statistics'); break;
                case 3: navigate('/profile'); break;
                default: break;
              }
            }}
          >
            <BottomNavigationAction label="Inicio" icon={<HomeIcon />} />
            <BottomNavigationAction label="Entrenar" icon={<TrainingIcon />} />
            <BottomNavigationAction label="Estadísticas" icon={<StatsIcon />} />
            <BottomNavigationAction 
              label="Perfil" 
              icon={
                profile.avatar ? (
                  <Avatar src={profile.avatar} sx={{ width: 24, height: 24 }} />
                ) : (
                  <ProfileIcon />
                )
              } 
            />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
};

export default Layout;