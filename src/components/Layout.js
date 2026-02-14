// components/Layout.js
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Avatar,
  Typography,
  Alert
} from '@mui/material';
import {
  Home as HomeIcon,
  DirectionsRun as RunIcon,
  BarChart as StatsIcon,
  Person as ProfileIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, currentTraining } = useData();
  
  const isTrainingActive = location.pathname.includes('/training') && 
    (currentTraining?.state === 'active' || currentTraining?.state === 'paused');

  const getNavValue = () => {
    const path = location.pathname;
    if (path.includes('/home')) return 0;
    if (path.includes('/training')) return 1;
    if (path.includes('/statistics')) return 2;
    if (path.includes('/profile')) return 3;
    return 0;
  };

  const handleNavigation = (newValue) => {
    if (isTrainingActive) {
      alert('⚠️ Entrenamiento en curso. Finaliza o pausa antes de salir.');
      return;
    }
    
    switch(newValue) {
      case 0: navigate('/home'); break;
      case 1: navigate('/training'); break;
      case 2: navigate('/statistics'); break;
      case 3: navigate('/profile'); break;
      default: break;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      // Padding superior para la barra de estado (safe area)
      pt: 'env(safe-area-inset-top)',
      // Padding inferior para la barra de navegación + espacio para el BottomNavigation
      pb: 'calc(env(safe-area-inset-bottom) + 56px)', // 56px es altura típica del BottomNavigation
      position: 'relative'
    }}>
      <Box sx={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {isTrainingActive && (
          <Alert 
            severity="info" 
            sx={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 1000,
              borderRadius: 0,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
            icon={<RunIcon />}
          >
            🏃 Entrenamiento en curso - No puedes cambiar de pantalla
          </Alert>
        )}
        
        <Outlet />
        
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            borderRadius: 0,
            opacity: isTrainingActive ? 0.5 : 1,
            pointerEvents: isTrainingActive ? 'none' : 'auto',
            // Añadimos padding inferior para la barra de navegación nativa (safe area)
            pb: 'env(safe-area-inset-bottom)'
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={getNavValue()}
            onChange={(event, newValue) => handleNavigation(newValue)}
          >
            <BottomNavigationAction label="Inicio" icon={<HomeIcon />} />
            <BottomNavigationAction 
              label="Entrenar" 
              icon={<RunIcon />}
              sx={isTrainingActive ? { color: 'primary.main' } : {}}
            />
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