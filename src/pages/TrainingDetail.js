// pages/TrainingDetail.js
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Divider,
  Button,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  DirectionsWalk,
  DirectionsBike,
  Terrain,
  Timer,
  Speed,
  TrendingUp,
  TrendingDown,
  Height,
  LocalFireDepartment,
  DeleteOutline,
  CalendarToday,
  AccessTime,
  Straighten
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TrainingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { trainings, deleteTraining } = useData();
  
  const training = trainings.find(t => t.id === parseInt(id));

  if (!training) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Entrenamiento no encontrado</Typography>
        <Button onClick={() => navigate('/home')} sx={{ mt: 2 }}>
          Volver al inicio
        </Button>
      </Box>
    );
  }

  const getActivityIcon = (type) => {
    switch(type) {
      case 'caminar': return <DirectionsWalk sx={{ color: '#2E7D32' }} />;
      case 'bici': return <DirectionsBike sx={{ color: '#1976D2' }} />;
      case 'mtb': return <Terrain sx={{ color: '#8D6E63' }} />;
      default: return <DirectionsWalk />;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'caminar': return '#2E7D32';
      case 'bici': return '#1976D2';
      case 'mtb': return '#8D6E63';
      default: return '#757575';
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  const handleDelete = () => {
    deleteTraining(training.id);
    navigate('/home');
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/home')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Detalle del entrenamiento
        </Typography>
      </Box>

      {/* Mapa estático */}
      <Card sx={{ height: 200, bgcolor: '#E9ECEF', mb: 2, borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(145deg, #2C3E50 0%, #3498DB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              🗺️ Recorrido completado
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
              {training.route?.length || 50} puntos · {training.distance} km
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Cabecera de actividad */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: `${getActivityColor(training.type)}20`, width: 56, height: 56 }}>
              {getActivityIcon(training.type)}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                {training.type === 'mtb' ? 'MTB' : training.type}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(training.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {training.startTime} - {training.endTime}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Distancia
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {training.distance.toFixed(1)}
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
                {formatTime(training.totalTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                movimiento: {formatTime(training.movingTime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Métricas detalladas */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Estadísticas
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Velocidad promedio
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.avgSpeed} km/h
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Velocidad máxima
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.maxSpeed} km/h
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ritmo promedio
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.avgPace}/km
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalFireDepartment sx={{ color: '#FF6B6B' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Calorías
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.calories} kcal
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Altitud */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Altitud
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Height sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Inicial / Final
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.startAltitude}m / {training.endAltitude}m
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: '#4CAF50' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Desnivel +
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    +{training.elevationGain}m
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown sx={{ color: '#F44336' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Desnivel -
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#F44336' }}>
                    -{training.elevationLoss}m
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Splits por kilómetro */}
      {training.splits && training.splits.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Splits por kilómetro
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  {training.splits.map((split) => (
                    <TableRow key={split.km}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>KM {split.km}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          Ritmo
                        </Typography>
                        <Typography sx={{ fontWeight: 600 }}>{split.pace}/km</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          Tiempo
                        </Typography>
                        <Typography sx={{ fontWeight: 600 }}>
                          {Math.floor(split.time / 60)}:{(split.time % 60).toString().padStart(2, '0')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Botón eliminar */}
      <Button
        fullWidth
        variant="outlined"
        color="error"
        startIcon={<DeleteOutline />}
        onClick={handleDelete}
        sx={{ mt: 2, py: 1.5 }}
      >
        Eliminar entrenamiento
      </Button>
    </Box>
  );
};

export default TrainingDetail;