// pages/Statistics.js
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Avatar,
  Chip,
  Divider,
  Button,
  IconButton  // ← Agrega esta línea
} from '@mui/material';
import {
  ArrowBack,
  DirectionsWalk,
  DirectionsBike,
  Terrain,
  TrendingUp,
  CalendarMonth,
  Speed,
  Timer,
  Straighten,
  LocalFireDepartment,
  DirectionsRun
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Statistics = () => {
  const navigate = useNavigate();
  const { trainings } = useData();

  // Calcular estadísticas
  const totalDistance = trainings.reduce((acc, t) => acc + t.distance, 0);
  const totalTime = trainings.reduce((acc, t) => acc + t.movingTime, 0);
  const totalCalories = trainings.reduce((acc, t) => acc + t.calories, 0);
  const totalElevation = trainings.reduce((acc, t) => acc + t.elevationGain, 0);
  
  const avgSpeed = totalTime > 0 
    ? (totalDistance / (totalTime / 3600)).toFixed(1) 
    : 0;
  
  const activitiesByType = {
    caminar: trainings.filter(t => t.type === 'caminar').length,
    bici: trainings.filter(t => t.type === 'bici').length,
    mtb: trainings.filter(t => t.type === 'mtb').length
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  const getMonthlyActivity = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return trainings.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  };

  const getBestActivity = () => {
    if (trainings.length === 0) return { type: 'ninguna', distance: 0 };
    
    const best = trainings.reduce((max, t) => 
      t.distance > max.distance ? t : max
    , trainings[0]);
    
    return { type: best.type, distance: best.distance };
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/home')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Estadísticas
        </Typography>
      </Box>

      {/* Resumen general */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total km
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalDistance.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                kilómetros
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tiempo total
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatTime(totalTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                en movimiento
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Más métricas */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Métricas globales
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <LocalFireDepartment sx={{ color: '#FF6B6B', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Calorías
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {totalCalories.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ color: '#4CAF50', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Desnivel +
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {totalElevation}m
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Speed sx={{ color: '#2196F3', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Vel. promedio
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {avgSpeed} km/h
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Distribución de actividades */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Actividades por tipo
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#E8F5E9' }}>
                <DirectionsWalk sx={{ color: '#2E7D32' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {activitiesByType.caminar}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  caminatas
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#E3F2FD' }}>
                <DirectionsBike sx={{ color: '#1976D2' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {activitiesByType.bici}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ciclismo
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#EFEBE9' }}>
                <Terrain sx={{ color: '#8D6E63' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {activitiesByType.mtb}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  MTB
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Logros y récords */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Resumen mensual
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Actividades este mes
              </Typography>
              <Chip 
                label={getMonthlyActivity()} 
                size="small" 
                color="primary"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Mejor entrenamiento
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {getBestActivity().type} · {getBestActivity().distance.toFixed(1)} km
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Próximo objetivo
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {totalDistance < 100 ? `${(100 - totalDistance).toFixed(1)} km para 100km` : '¡100km alcanzados!'}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((totalDistance / 100) * 100, 100)} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: '#E0E0E0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main'
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Statistics;