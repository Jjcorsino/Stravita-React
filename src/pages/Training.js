// pages/Training.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  DirectionsWalk,
  DirectionsBike,
  Terrain,
  Speed,
  Timer,
  Straighten,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

// Componente de mapa simulado
const MapPreview = ({ route, isActive }) => {
  return (
    <Card sx={{ 
      height: 300, 
      bgcolor: '#E9ECEF', 
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3
    }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(145deg, #2C3E50 0%, #3498DB 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          {route && route.length > 0 ? (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                🗺️ Recorrido: {route.length} puntos
              </Typography>
              <Box sx={{ 
                width: 200, 
                height: 100, 
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  background: 'white',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.3
                }
              }}>
                {route.map((point, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute',
                      left: `${(i / (route.length - 1)) * 100}%`,
                      top: `${50 + (point.lat * 10)}%`,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: i === route.length - 1 ? '#FC4C02' : 'white',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                    }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {isActive ? '📍 En movimiento' : '🗺️ Vista del mapa'}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                {isActive ? 'Sigue tu ruta en tiempo real' : 'Comienza a entrenar para ver tu ruta'}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Card>
  );
};

const Training = () => {
  const navigate = useNavigate();
  const { addTraining, profile } = useData();
  
  const [trainingState, setTrainingState] = useState('idle'); // idle, active, paused
  const [selectedType, setSelectedType] = useState(null);
  const [trainingData, setTrainingData] = useState({
    type: '',
    startTime: null,
    currentTime: 0,
    distance: 0,
    currentSpeed: 0,
    avgSpeed: 0,
    route: [],
    altitude: profile.startAltitude || 100
  });
  
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  
  const intervalRef = useRef(null);
  const speedIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    };
  }, []);

  const startTraining = () => {
    if (!selectedType) return;
    
    setTrainingState('active');
    setTrainingData({
      type: selectedType,
      startTime: new Date(),
      currentTime: 0,
      distance: 0,
      currentSpeed: 0,
      avgSpeed: 0,
      route: [{ 
        lat: 40.416775 + (Math.random() - 0.5) * 0.01, 
        lng: -3.703790 + (Math.random() - 0.5) * 0.01,
        altitude: profile.startAltitude || 100,
        time: 0
      }],
      altitude: profile.startAltitude || 100
    });

    // Simular tiempo
    intervalRef.current = setInterval(() => {
      setTrainingData(prev => ({
        ...prev,
        currentTime: prev.currentTime + 1
      }));
    }, 1000);

    // Simular velocidad y distancia
    speedIntervalRef.current = setInterval(() => {
      setTrainingData(prev => {
        const speedVariation = Math.random() * 3 + (prev.type === 'caminar' ? 4 : prev.type === 'bici' ? 15 : 12);
        const newCurrentSpeed = parseFloat(speedVariation.toFixed(1));
        const distanceIncrease = (newCurrentSpeed / 3600).toFixed(3);
        const newDistance = prev.distance + parseFloat(distanceIncrease);
        const newAvgSpeed = prev.currentTime > 0 ? (newDistance / (prev.currentTime / 3600)) : 0;
        
        // Simular variación de altitud
        const altitudeVariation = (Math.random() - 0.5) * 2;
        const newAltitude = Math.max(50, prev.altitude + altitudeVariation);
        
        // Nuevo punto de ruta
        const lastPoint = prev.route[prev.route.length - 1];
        const newPoint = {
          lat: lastPoint.lat + (Math.random() - 0.5) * 0.001,
          lng: lastPoint.lng + (Math.random() - 0.5) * 0.001,
          altitude: newAltitude,
          time: prev.currentTime
        };

        return {
          ...prev,
          currentSpeed: newCurrentSpeed,
          distance: newDistance,
          avgSpeed: newAvgSpeed,
          route: [...prev.route, newPoint],
          altitude: newAltitude
        };
      });
    }, 3000);
  };

  const pauseTraining = () => {
    setTrainingState('paused');
    clearInterval(intervalRef.current);
    clearInterval(speedIntervalRef.current);
  };

  const resumeTraining = () => {
    setTrainingState('active');
    
    intervalRef.current = setInterval(() => {
      setTrainingData(prev => ({
        ...prev,
        currentTime: prev.currentTime + 1
      }));
    }, 1000);

    speedIntervalRef.current = setInterval(() => {
      setTrainingData(prev => {
        const speedVariation = Math.random() * 3 + (prev.type === 'caminar' ? 4 : prev.type === 'bici' ? 15 : 12);
        const newCurrentSpeed = parseFloat(speedVariation.toFixed(1));
        const distanceIncrease = (newCurrentSpeed / 3600).toFixed(3);
        const newDistance = prev.distance + parseFloat(distanceIncrease);
        const newAvgSpeed = prev.currentTime > 0 ? (newDistance / (prev.currentTime / 3600)) : 0;
        
        const altitudeVariation = (Math.random() - 0.5) * 2;
        const newAltitude = Math.max(50, prev.altitude + altitudeVariation);
        
        const lastPoint = prev.route[prev.route.length - 1];
        const newPoint = {
          lat: lastPoint.lat + (Math.random() - 0.5) * 0.001,
          lng: lastPoint.lng + (Math.random() - 0.5) * 0.001,
          altitude: newAltitude,
          time: prev.currentTime
        };

        return {
          ...prev,
          currentSpeed: newCurrentSpeed,
          distance: newDistance,
          avgSpeed: newAvgSpeed,
          route: [...prev.route, newPoint],
          altitude: newAltitude
        };
      });
    }, 3000);
  };

  const finishTraining = () => {
    setFinishDialogOpen(true);
  };

  const confirmFinish = () => {
    clearInterval(intervalRef.current);
    clearInterval(speedIntervalRef.current);
    
    // Calcular métricas finales
    const endTime = new Date();
    const totalSeconds = trainingData.currentTime;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Calcular ritmo promedio
    const paceMinutes = trainingData.distance > 0 
      ? (totalSeconds / 60) / trainingData.distance 
      : 0;
    const paceMinutesFloor = Math.floor(paceMinutes);
    const paceSeconds = Math.round((paceMinutes - paceMinutesFloor) * 60);
    const avgPace = `${paceMinutesFloor}:${paceSeconds.toString().padStart(2, '0')}`;
    
    // Calcular calorías (fórmula simplificada)
    const caloriesPerKgPerKm = trainingData.type === 'caminar' ? 0.7 : trainingData.type === 'bici' ? 0.5 : 0.8;
    const caloriesBurned = Math.round(profile.weight * trainingData.distance * caloriesPerKgPerKm);
    
    // Calcular desnivel
    let elevationGain = 0;
    let elevationLoss = 0;
    for (let i = 1; i < trainingData.route.length; i++) {
      const diff = trainingData.route[i].altitude - trainingData.route[i-1].altitude;
      if (diff > 0) elevationGain += diff;
      else elevationLoss += Math.abs(diff);
    }
    
    // Crear splits
    const splits = [];
    let cumulativeDistance = 0;
    let splitStartTime = 0;
    let splitKm = 1;
    
    for (let i = 1; i < trainingData.route.length && cumulativeDistance < trainingData.distance; i++) {
      const prevPoint = trainingData.route[i-1];
      const currentPoint = trainingData.route[i];
      
      // Distancia entre puntos (simplificada)
      const segmentDistance = 0.001; // ~100m
      cumulativeDistance += segmentDistance;
      
      if (cumulativeDistance >= splitKm) {
        const splitTime = currentPoint.time - splitStartTime;
        const splitMinutes = Math.floor(splitTime / 60);
        const splitSeconds = splitTime % 60;
        
        splits.push({
          km: splitKm,
          pace: `${splitMinutes}:${splitSeconds.toString().padStart(2, '0')}`,
          time: splitTime
        });
        
        splitKm++;
        splitStartTime = currentPoint.time;
      }
    }
    
    const newTraining = {
      id: Date.now(),
      type: trainingData.type,
      date: trainingData.startTime.toISOString(),
      startTime: trainingData.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      movingTime: totalSeconds,
      totalTime: totalSeconds + 60, // Añadimos 1 minuto de pausas
      distance: parseFloat(trainingData.distance.toFixed(2)),
      avgSpeed: parseFloat(trainingData.avgSpeed.toFixed(1)),
      maxSpeed: parseFloat((trainingData.currentSpeed * 1.2).toFixed(1)),
      avgPace: avgPace,
      elevationGain: Math.round(elevationGain),
      elevationLoss: Math.round(elevationLoss),
      startAltitude: Math.round(trainingData.route[0]?.altitude || 100),
      endAltitude: Math.round(trainingData.altitude),
      calories: caloriesBurned,
      route: trainingData.route,
      splits: splits
    };
    
    addTraining(newTraining);
    setFinishDialogOpen(false);
    setTrainingState('idle');
    setSelectedType(null);
    setTrainingData({
      type: '',
      startTime: null,
      currentTime: 0,
      distance: 0,
      currentSpeed: 0,
      avgSpeed: 0,
      route: [],
      altitude: profile.startAltitude || 100
    });
    
    navigate('/home');
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityTypeColor = (type) => {
    switch(type) {
      case 'caminar': return { bg: '#E8F5E9', color: '#2E7D32' };
      case 'bici': return { bg: '#E3F2FD', color: '#1976D2' };
      case 'mtb': return { bg: '#EFEBE9', color: '#8D6E63' };
      default: return { bg: '#F5F5F5', color: '#757575' };
    }
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/home')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {trainingState === 'idle' ? 'Nuevo entrenamiento' : 
           trainingState === 'active' ? 'Entrenando' : 'Entrenamiento pausado'}
        </Typography>
      </Box>

      {/* Mapa */}
      <MapPreview route={trainingData.route} isActive={trainingState !== 'idle'} />

      {/* Selector de tipo de actividad */}
      {trainingState === 'idle' && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Selecciona tipo de actividad
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 2,
                    cursor: 'pointer',
                    border: selectedType === 'caminar' ? '2px solid #2E7D32' : 'none',
                    bgcolor: selectedType === 'caminar' ? '#E8F5E9' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F5F5F5' }
                  }}
                  onClick={() => setSelectedType('caminar')}
                >
                  <DirectionsWalk sx={{ fontSize: 40, color: '#2E7D32' }} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    Caminar
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 2,
                    cursor: 'pointer',
                    border: selectedType === 'bici' ? '2px solid #1976D2' : 'none',
                    bgcolor: selectedType === 'bici' ? '#E3F2FD' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F5F5F5' }
                  }}
                  onClick={() => setSelectedType('bici')}
                >
                  <DirectionsBike sx={{ fontSize: 40, color: '#1976D2' }} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    Bici
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 2,
                    cursor: 'pointer',
                    border: selectedType === 'mtb' ? '2px solid #8D6E63' : 'none',
                    bgcolor: selectedType === 'mtb' ? '#EFEBE9' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F5F5F5' }
                  }}
                  onClick={() => setSelectedType('mtb')}
                >
                  <Terrain sx={{ fontSize: 40, color: '#8D6E63' }} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    MTB
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Estado del entrenamiento */}
      {trainingState !== 'idle' && (
        <>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={trainingData.type === 'mtb' ? 'MTB' : trainingData.type}
                  icon={
                    trainingData.type === 'caminar' ? <DirectionsWalk /> :
                    trainingData.type === 'bici' ? <DirectionsBike /> : <Terrain />
                  }
                  sx={{ 
                    bgcolor: getActivityTypeColor(trainingData.type).bg,
                    color: getActivityTypeColor(trainingData.type).color,
                    fontWeight: 600
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {formatTime(trainingData.currentTime)}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="text.secondary">Distancia</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {trainingData.distance.toFixed(2)} km
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="text.secondary">Vel. actual</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {trainingData.currentSpeed.toFixed(1)} km/h
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="text.secondary">Vel. promedio</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {trainingData.avgSpeed.toFixed(1)} km/h
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="text.secondary">Altitud</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {Math.round(trainingData.altitude)} m
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            {trainingState === 'active' ? (
              <>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={<Pause />}
                  onClick={pauseTraining}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Pausa
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<Stop />}
                  onClick={finishTraining}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Finalizar
                </Button>
              </>
            ) : trainingState === 'paused' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={resumeTraining}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Reanudar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<Stop />}
                  onClick={finishTraining}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Finalizar
                </Button>
              </>
            )}
          </Box>
        </>
      )}

      {/* Botón de inicio */}
      {trainingState === 'idle' && (
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={!selectedType}
          onClick={startTraining}
          sx={{ mt: 3, py: 1.5, fontSize: '1.1rem' }}
        >
          Comenzar entrenamiento
        </Button>
      )}

      {/* Diálogo de confirmación */}
      <Dialog open={finishDialogOpen} onClose={() => setFinishDialogOpen(false)}>
        <DialogTitle>Finalizar entrenamiento</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres finalizar el entrenamiento?
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Distancia</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {trainingData.distance.toFixed(2)} km
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Tiempo</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatTime(trainingData.currentTime)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmFinish} variant="contained" color="error">
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Training;