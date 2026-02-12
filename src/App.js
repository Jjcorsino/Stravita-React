// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

import Layout from './components/Layout';
import Home from './pages/Home';
import Training from './pages/Training';
import TrainingDetail from './pages/TrainingDetail';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';

// Context para datos globales
import { DataProvider } from './context/DataContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FC4C02', // Naranja Strava
    },
    secondary: {
      main: '#2C3E50',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={es}>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="training" element={<Training />} />
                <Route path="training/:id" element={<TrainingDetail />} />
                <Route path="profile" element={<Profile />} />
                <Route path="statistics" element={<Statistics />} />
              </Route>
            </Routes>
          </Router>
        </DataProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;