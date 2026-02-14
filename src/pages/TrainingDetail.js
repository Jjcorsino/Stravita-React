// pages/TrainingDetail.js
import React, { useEffect, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  Straighten,
  Map as MapIcon,
  ShowChart,
  Share as ShareIcon // <-- Importamos el ícono de compartir
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TrainingMap from '../components/TrainingMap';

// Importar plugin de Capacitor para compartir
import { Share } from '@capacitor/share';

// Importar componentes de Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const TrainingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { trainings, deleteTraining } = useData();
  const training = trainings.find(t => t.id === parseInt(id));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Estados para los gráficos
  const [altitudeData, setAltitudeData] = useState([]);
  const [altitudeStats, setAltitudeStats] = useState({
    min: 0,
    max: 0,
    avg: 0,
    gain: 0,
    loss: 0
  });
  const [speedData, setSpeedData] = useState([]);
  const [speedStats, setSpeedStats] = useState({
    avg: 0,
    max: 0
  });

  useEffect(() => {
    if (training?.route && training.route.length > 0) {
      const route = training.route;

      // Datos de altitud
      const altData = route.map((point, index) => ({
        time: point.time || index * 30,
        altitude: point.altitude || 0
      }));
      setAltitudeData(altData);

      // Datos de velocidad
      const spdData = route.map((point, index) => ({
        time: point.time || index * 30,
        speed: point.speed || 0
      }));
      setSpeedData(spdData);

      // Estadísticas de altitud
      const altitudes = altData.map(d => d.altitude).filter(a => a > 0);
      if (altitudes.length > 0) {
        const min = Math.min(...altitudes);
        const max = Math.max(...altitudes);
        const avg = altitudes.reduce((a, b) => a + b, 0) / altitudes.length;
        let gain = 0;
        let loss = 0;
        for (let i = 1; i < altitudes.length; i++) {
          const diff = altitudes[i] - altitudes[i - 1];
          if (diff > 0) gain += diff;
          else loss += Math.abs(diff);
        }
        setAltitudeStats({
          min: Math.round(min),
          max: Math.round(max),
          avg: Math.round(avg),
          gain: Math.round(gain || training.elevationGain || 0),
          loss: Math.round(loss || training.elevationLoss || 0)
        });
      }

      // Estadísticas de velocidad
      const speeds = spdData.map(d => d.speed).filter(s => s > 0);
      if (speeds.length > 0) {
        const maxSpeed = Math.max(...speeds);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        setSpeedStats({
          max: parseFloat(maxSpeed.toFixed(2)),
          avg: parseFloat(avgSpeed.toFixed(2))
        });
      }
    }
  }, [training]);

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
      case 'ciclismo': return <DirectionsBike sx={{ color: '#1976D2' }} />;
      case 'mtb': return <Terrain sx={{ color: '#8D6E63' }} />;
      default: return <DirectionsWalk />;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'caminar': return '#2E7D32';
      case 'ciclismo': return '#1976D2';
      case 'mtb': return '#8D6E63';
      default: return '#757575';
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}min`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}min`;
  };

  const formatPace = (pace, distance) => {
    if (!pace || pace === '0:00') return '—';
    if (distance < 1) {
      const [min, sec] = pace.split(':').map(Number);
      const paceSeconds = min * 60 + sec;
      const pacePer100m = paceSeconds / 10;
      const m = Math.floor(pacePer100m / 60);
      const s = Math.floor(pacePer100m % 60);
      return `${m}:${s.toString().padStart(2, '0')} /100m`;
    }
    return `${pace}/km`;
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Función para compartir
  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Mi entrenamiento en DropZone',
        text: `Acabo de completar ${training.distance.toFixed(2)} km en ${training.type} con un ritmo de ${training.avgPace}. ¡#DropZoneApp!`,
        dialogTitle: 'Compartir entrenamiento',
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  // Formatear tiempo para los ejes
  const formatTimeAxis = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formateador para tooltip con 2 decimales
  const formatValue = (value) => {
    if (typeof value === 'number') return value.toFixed(2);
    return value;
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header con botón de compartir */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/home')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Detalle del entrenamiento
          </Typography>
        </Box>
        <IconButton onClick={handleShare} color="primary">
          <ShareIcon />
        </IconButton>
      </Box>

      {/* Mapa */}
      <Card sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }}>
        <TrainingMap 
          route={training.route || []}
          showStartEnd={true}
          height={250}
        />
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

      {/* Métricas principales - Distancia y Tiempo total */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Distancia
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {training.distance < 1 
                  ? `${Math.round(training.distance * 1000)} m`
                  : `${training.distance.toFixed(2)} km`
                }
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {training.distance < 1 ? 'Metros' : 'Kilómetros'}
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

      {/* Tarjeta de Estadísticas clave */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Resultados
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Straighten sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Distancia
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.distance < 1 
                      ? `${Math.round(training.distance * 1000)} m`
                      : `${training.distance.toFixed(2)} km`
                    }
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: '#4CAF50' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Desnivel positivo
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    +{training.elevationGain || 0} m
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tiempo en movimiento
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatTime(training.movingTime)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Velocidad media
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {training.avgSpeed?.toFixed(2) || 0} km/h
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
                    {training.calories || 0} kcal
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Height sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Desnivel máx.
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {altitudeStats.max} m
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Gráfico de Altitud */}
      {altitudeData.length > 1 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ShowChart sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Altitud
              </Typography>
            </Box>

            <Box sx={{ width: '100%', height: 200, mb: 2 }}>
              <ResponsiveContainer>
                <LineChart
                  data={altitudeData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTimeAxis}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Tiempo', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toFixed(0)}
                    label={{ value: 'Altitud (m)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(2)} m`, 'Altitud']}
                    labelFormatter={(label) => `Tiempo: ${formatTimeAxis(label)}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="altitude" 
                    stroke="#FC4C02" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <ReferenceLine y={altitudeStats.avg} stroke="#666" strokeDasharray="3 3" label={{ value: 'Promedio', position: 'right', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Desnivel positivo
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                  +{altitudeStats.gain} m
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Desnivel máx.
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {altitudeStats.max} m
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Desnivel negativo
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#F44336' }}>
                  -{altitudeStats.loss} m
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Velocidad */}
      {speedData.length > 1 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Speed sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Velocidad
              </Typography>
            </Box>

            <Box sx={{ width: '100%', height: 200, mb: 2 }}>
              <ResponsiveContainer>
                <LineChart
                  data={speedData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTimeAxis}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Tiempo', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 'dataMax + 2']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toFixed(2)}
                    label={{ value: 'Velocidad (km/h)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(2)} km/h`, 'Velocidad']}
                    labelFormatter={(label) => `Tiempo: ${formatTimeAxis(label)}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    stroke="#2196F3" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <ReferenceLine y={speedStats.avg} stroke="#666" strokeDasharray="3 3" label={{ value: 'Promedio', position: 'right', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Velocidad media
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {speedStats.avg} km/h
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Velocidad máxima
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#FC4C02' }}>
                  {speedStats.max} km/h
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Tiempo en movimiento
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatTime(training.movingTime)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Tiempo transcurrido
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatTime(training.totalTime)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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
        onClick={handleDeleteClick}
        sx={{ mt: 2, py: 1.5 }}
      >
        Eliminar entrenamiento
      </Button>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Eliminar entrenamiento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar este entrenamiento?<br />
            <strong>Esta acción no se puede deshacer.</strong>
          </DialogContentText>

          {/* Resumen visual (como en el diálogo de finalizar) */}
          <Paper
            elevation={0}
            sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Distancia</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {training.distance.toFixed(2)} km
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Fecha</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {format(new Date(training.date), "d MMM yyyy", { locale: es })}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              deleteTraining(training.id);
              setDeleteDialogOpen(false);
              navigate('/home');
            }}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
};

export default TrainingDetail;