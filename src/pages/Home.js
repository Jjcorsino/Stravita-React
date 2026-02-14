// pages/Home.js
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Button
} from '@mui/material';
import {
  DirectionsWalk,
  DirectionsBike,
  Terrain,
  Timer,
  Speed,
  FitnessCenter,
  DeleteOutline,
  LocalFireDepartment,
  CalendarToday,
  TrendingUp,
  DirectionsRun as RunIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Home = () => {
  const navigate = useNavigate();
  const { trainings, deleteTraining, profile } = useData();

  const getActivityIcon = (type) => {
    switch(type) {
      case 'caminar': return <DirectionsWalk sx={{ color: '#2E7D32' }} />;
      case 'ciclismo': return <DirectionsBike sx={{ color: '#1976D2' }} />;
      case 'mtb': return <Terrain sx={{ color: '#8D6E63' }} />;
      default: return <DirectionsWalk />;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'caminar': return '#E8F5E9';
      case 'ciclismo': return '#E3F2FD';
      case 'mtb': return '#EFEBE9';
      default: return '#F5F5F5';
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            ¡Hola, {profile.name?.split(' ')[0]}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
          {profile.name?.charAt(0)}
        </Avatar>
      </Box>

      {/* Resumen rápido */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
         <Grid item xs={6}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Distancia Total</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {/* ✅ NUEVA LÓGICA: metros si es < 1km */}
                {(() => {
                  const totalDistance = trainings.reduce((acc, t) => acc + t.distance, 0);
                  return totalDistance < 1 
                    ? `${Math.round(totalDistance * 1000)}`
                    : totalDistance.toFixed(1);
                })()}
              </Typography>
              <Typography variant="caption">
                {(() => {
                  const totalDistance = trainings.reduce((acc, t) => acc + t.distance, 0);
                  return totalDistance < 1 ? 'Metros' : 'Kilómetros';
                })()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Entrenamientos</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {trainings.length}
              </Typography>
              <Typography variant="caption">actividades</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de entrenamientos */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Actividades recientes
        </Typography>
        <Button size="small" onClick={() => navigate('/statistics')}>
          Ver todo
        </Button>
      </Box>

      {trainings.map((training) => (
        <Card 
          key={training.id} 
          sx={{ 
            mb: 2,
            borderLeft: '6px solid',
            borderLeftColor: 
              training.type === 'caminar' ? '#2E7D32' :
              training.type === 'ciclismo' ? '#1976D2' :
              training.type === 'MTB' ? '#8D6E63' :
              '#8D6E63'
          }}
        >

          <CardActionArea onClick={() => navigate(`/training/${training.id}`)}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar sx={{ bgcolor: getActivityColor(training.type) }}>
                    {getActivityIcon(training.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {training.type === 'mtb' ? 'MTB' : training.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 14 }} />
                      {format(new Date(training.date), "d MMM, HH:mm", { locale: es })}
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTraining(training.id);
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteOutline />
                </IconButton>
              </Box>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Distancia</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.distance < 1 
                    ? `${Math.round(training.distance * 1000)} m`
                    : `${training.distance.toFixed(2)} km`
                  }
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Tiempo</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatTime(training.movingTime)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Ritmo</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.avgPace}/km
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  size="small" 
                  icon={<TrendingUp />} 
                  label={`${training.elevationGain}m +`} 
                  variant="outlined"
                />
                <Chip 
                  size="small" 
                  icon={<LocalFireDepartment sx={{ color: '#FF6B6B'}} />} 
                  label={`${training.calories} kcal`} 
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}

      {trainings.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No tienes entrenamientos registrados
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/training')}
            startIcon={<RunIcon />}
          >
            Comenzar entrenamiento
          </Button>
        </Card>
      )}
    </Box>
  );
};

export default Home;