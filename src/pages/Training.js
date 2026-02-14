// pages/Training.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper
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
  ArrowBack,
  GpsFixed,
  GpsOff,
  Height,
  FitnessCenter,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import useGeolocation from '../hooks/useGeolocation';
import TrainingMap from '../components/TrainingMap';

// Calcula distancia en Km entre dos coordenadas
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const Training = () => {
  const navigate = useNavigate();
  const { addTraining, profile, setCurrentTraining } = useData();

  const [trainingState, setTrainingState] = useState('idle');
  const [selectedType, setSelectedType] = useState(null);
  const [trainingData, setTrainingData] = useState({
    type: '',
    startTime: null,
    currentTime: 0,
    distance: 0,
    currentSpeed: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    route: [],
    altitude: 0,
    startAltitude: 0,
    elevationGain: 0,
    totalPausedTime: 0,
    lastValidPosition: null,
    movingTime: 0
  });

  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);

  const intervalRef = useRef(null);
  const lastPositionRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const lastMovingTimeRef = useRef(null);
  const lastSpeedsRef = useRef([]);
  const consecutiveRejectionsRef = useRef(0);
  const stationaryStartTimeRef = useRef(null);
  const isStationaryRef = useRef(false);

  // 📍 Hook de geolocalización de Capacitor
  const { location, error, isWatching, startWatching, stopWatching } = useGeolocation();

  // ============================================
  // CONSTANTES DE FILTRADO GPS
  // ============================================
  const SPEED_LIMITS = {
    caminar: { max: 20, minValid: 2.0, minTrack: 1.5 },
    ciclismo: { max: 60, minValid: 2.0, minTrack: 2.0 },
    mtb: { max: 50, minValid: 2.5, minTrack: 1.5 }
  };

  const MIN_ACCURACY = 30;
  const MIN_DISTANCE_ABSOLUTE = 0.001;
  const MAX_DRIFT_TIME = 2;

  // ============================================
  // CONSTANTE PARA ESTABILIZACIÓN INICIAL
  // ============================================
  const STABLE_POSITIONS_THRESHOLD = 2; 
  const STABILIZATION_ACCURACY = 50;

  // Referencias para la estabilización inicial
  const stableCounterRef = useRef(0);
  const initialStabilizationPassedRef = useRef(false);

  // Iniciar GPS al montar el componente
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  // Manejar errores de GPS
  useEffect(() => {
    if (error) {
      setGpsError(true);
      // Capacitor devuelve el error como string "Permiso de ubicación denegado" o como objeto
      if (typeof error === 'string' && error.includes('denegado')) {
        setGpsPermissionDenied(true);
      } else if (error?.code === 1) {
        setGpsPermissionDenied(true);
      }
    } else {
      setGpsError(false);
      setGpsPermissionDenied(false);
    }
  }, [error]);

  // ============================================
  // Estados relacionados con el warmup
  // ============================================
  const [warmupCountdown, setWarmupCountdown] = useState(0);
  const [isWarmupActive, setIsWarmupActive] = useState(false);

  // ============================================
  // INICIAR ENTRENAMIENTO
  // ============================================
  const startTraining = () => {
    if (!selectedType) {
      alert('Por favor selecciona un tipo de actividad');
      return;
    }

    // Opcional: verificar si ya tenemos alguna señal GPS
    if (!location || location.accuracy > 50) {
      alert('Señal GPS débil o no disponible. Espera unos segundos e intenta de nuevo.');
      return;
    }

    setIsWarmupActive(true);
    setWarmupCountdown(5);
    setTrainingState('preparing');

    // Iniciamos la cuenta regresiva
    startWarmupCountdown().then(() => {
      finishWarmupAndStartTracking();
    });
  };

  // Función independiente que maneja la cuenta regresiva
  const startWarmupCountdown = () => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        setWarmupCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            resolve();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
  };

  // Finaliza el warmup y arranca el entrenamiento real
  const finishWarmupAndStartTracking = () => {
    setIsWarmupActive(false);
    setTrainingState('active');

    // Usamos la posición actual al FINAL del warmup (más estable)
    const now = new Date();
    const initialAltitude = location?.altitude || 0;

    setTrainingData({
      type: selectedType,
      startTime: now,
      currentTime: 0,
      distance: 0,
      currentSpeed: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      route: [],
      altitude: initialAltitude,
      startAltitude: initialAltitude,
      elevationGain: 0,
      totalPausedTime: 0,
      lastValidPosition: null,
      movingTime: 0
    });

    // Resetear todas las referencias
    lastPositionRef.current = location ? {
      lat: location.lat,
      lng: location.lng,
      altitude: initialAltitude,
      timestamp: location.timestamp || now.getTime()
    } : null;

    lastMovingTimeRef.current = now.getTime();
    lastSpeedsRef.current = [];
    isStationaryRef.current = false;
    stationaryStartTimeRef.current = null;
    consecutiveRejectionsRef.current = 0;
    pausedTimeRef.current = 0;
    // ============================================
    // NUEVO: Reiniciamos contador y flag de estabilización
    // ============================================
    stableCounterRef.current = 0;
    initialStabilizationPassedRef.current = false;

    // Iniciar el contador de tiempo transcurrido
    intervalRef.current = setInterval(() => {
      setTrainingData((prev) => ({
        ...prev,
        currentTime: prev.currentTime + 1
      }));
    }, 1000);

    // ← ¡Muy importante! Aquí arrancamos el seguimiento GPS
    startWatching();
    setCurrentTraining({ state: 'active', type: selectedType });
  };

  // Limpieza importante (en useEffect de cleanup)
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // ============================================
  // FILTRO DE POSICIÓN GPS (CON ESTABILIZACIÓN SOLO AL INICIO)
  // ============================================
  useEffect(() => {
    if (trainingState !== 'active' || !location || !selectedType) return;

    const limits = SPEED_LIMITS[selectedType];
    const MIN_VALID_SPEED = limits.minValid;
    const MIN_TRACK_SPEED = limits.minTrack;
    const MAX_VALID_SPEED = limits.max;
    const currentAccuracyThreshold = initialStabilizationPassedRef.current ? MIN_ACCURACY : STABILIZATION_ACCURACY;

    // 1. FILTRO DE PRECISIÓN (siempre se aplica)
     if (location.accuracy > currentAccuracyThreshold) {
      console.log(`📍 GPS impreciso: ${location.accuracy.toFixed(0)}m (umbral: ${currentAccuracyThreshold}m)`);
      if (!initialStabilizationPassedRef.current) {
        stableCounterRef.current = 0; // Reiniciamos contador si estamos en estabilización
      }
      return;
    }

    // 2. INICIALIZAR PRIMERA POSICIÓN
    if (!lastPositionRef.current) {
      lastPositionRef.current = {
        lat: location.lat,
        lng: location.lng,
        altitude: location.altitude || 0,
        timestamp: location.timestamp
      };
      lastMovingTimeRef.current = Date.now();
      return;
    }

    const deltaTimeMs = location.timestamp - lastPositionRef.current.timestamp;
    if (deltaTimeMs < 500) return;

    const deltaTimeSec = deltaTimeMs / 1000;

    const distance = getDistanceFromLatLonInKm(
      lastPositionRef.current.lat,
      lastPositionRef.current.lng,
      location.lat,
      location.lng
    );

    const instantSpeed = location.speed !== null && location.speed !== undefined
      ? location.speed
      : deltaTimeSec > 0 ? (distance / deltaTimeSec) * 3600 : 0;

    const updateReference = () => {
      lastPositionRef.current = {
        lat: location.lat,
        lng: location.lng,
        altitude: location.altitude || 0,
        timestamp: location.timestamp
      };
    };

    // 3. DETECTOR DE ESTACIONARIO

    if (initialStabilizationPassedRef.current) {
      // Solo cuando ya hemos superado la estabilización aplicamos el filtro de estacionario
      if (instantSpeed < limits.minTrack) {
        if (!isStationaryRef.current) {
          stationaryStartTimeRef.current = Date.now();
          isStationaryRef.current = true;
        } else {
          const stationarySec = (Date.now() - stationaryStartTimeRef.current) / 1000;
          if (stationarySec > MAX_DRIFT_TIME) {
            console.log(`⏸️ Estacionario > ${MAX_DRIFT_TIME}s – reseteando referencia`);
            updateReference();
            isStationaryRef.current = false;
            // No reiniciamos el contador de estabilización porque ya pasó esa fase
          }
        }
        return;
      } else {
        isStationaryRef.current = false;
        stationaryStartTimeRef.current = null;
      }
    } else {
      // Durante la estabilización, no filtramos por estar quieto, solo actualizamos referencia si es necesario
      // pero seguimos adelante con el resto de filtros
    }

    // 4. DISTANCIA MÍNIMA ABSOLUTA
    if (distance < MIN_DISTANCE_ABSOLUTE) {
      console.log(`📏 Distancia < ${MIN_DISTANCE_ABSOLUTE * 1000}m, ignorada`);
      updateReference();
      if (!initialStabilizationPassedRef.current) {
        stableCounterRef.current = 0;
      }
      return;
    }

    // 5. SALTO IMPOSIBLE
    const maxDistPossible = (MAX_VALID_SPEED / 3.6) * deltaTimeSec / 1000;
    if (distance > maxDistPossible * 1.2) {
      console.log(`⚠️ Salto imposible: ${(distance * 1000).toFixed(0)}m en ${deltaTimeSec.toFixed(1)}s`);
      if (!initialStabilizationPassedRef.current) {
        stableCounterRef.current = 0;
      }
      return;
    }

    // 6. VELOCIDAD NO REALISTA
    if (instantSpeed > MAX_VALID_SPEED) {
      console.log(`⚠️ Velocidad no realista: ${instantSpeed.toFixed(1)} km/h`);
      if (!initialStabilizationPassedRef.current) {
        stableCounterRef.current = 0;
      }
      return;
    }

    // ============================================
    // FASE DE ESTABILIZACIÓN INICIAL (SOLO SI AÚN NO SE HA SUPERADO)
    // ============================================
    if (!initialStabilizationPassedRef.current) {
      // Incrementamos el contador (esta posición ha pasado todos los filtros)
      stableCounterRef.current++;
      console.log(`🟡 Estabilizando GPS... (${stableCounterRef.current}/${STABLE_POSITIONS_THRESHOLD})`);

      // Si alcanzamos el umbral, marcamos como estabilizado y actualizamos referencia
      if (stableCounterRef.current >= STABLE_POSITIONS_THRESHOLD) {
        console.log('✅ Estabilización inicial completada. Comenzando a registrar datos.');
        initialStabilizationPassedRef.current = true;
        updateReference(); // Guardamos la última posición válida
      } else {
        // Aún no hemos llegado al umbral: solo actualizamos referencia y salimos
        updateReference();
      }
      return; // No actualizamos métricas durante la estabilización
    }

    // ============================================
    // A PARTIR DE AQUÍ: ESTABILIZACIÓN SUPERADA -> PROCESAMIENTO NORMAL
    // ============================================
    const shouldAddDistance = instantSpeed >= MIN_VALID_SPEED;

    lastSpeedsRef.current.push(instantSpeed);
    if (lastSpeedsRef.current.length > 5) lastSpeedsRef.current.shift();
    const smoothedSpeed = lastSpeedsRef.current.reduce((a, b) => a + b, 0) / lastSpeedsRef.current.length;

    setTrainingData(prev => {
      let newDistance = prev.distance + (shouldAddDistance ? distance : 0);
      let newMovingTime = prev.movingTime + (shouldAddDistance ? deltaTimeSec : 0);
      let newMaxSpeed = Math.max(prev.maxSpeed, instantSpeed);
      let newElevationGain = prev.elevationGain;

      if (shouldAddDistance && location.altitude && lastPositionRef.current.altitude) {
        const elevDiff = location.altitude - lastPositionRef.current.altitude;
        const maxElevRate = 1000 / 3600;
        const maxElevPossible = maxElevRate * deltaTimeSec;
        if (elevDiff > 0 && elevDiff < Math.max(20, maxElevPossible)) {
          newElevationGain = prev.elevationGain + elevDiff;
        }
      }

      const avgSpeed = newMovingTime > 0 ? (newDistance / (newMovingTime / 3600)) : 0;

      const newRoutePoint = {
        lat: location.lat,
        lng: location.lng,
        altitude: location.altitude || 0,
        time: prev.currentTime,
        segmentTime: deltaTimeSec,
        speed: smoothedSpeed,
        distance: newDistance,
        isValid: shouldAddDistance
      };

      return {
        ...prev,
        distance: newDistance,
        currentSpeed: smoothedSpeed,
        avgSpeed,
        maxSpeed: Math.min(newMaxSpeed, MAX_VALID_SPEED),
        altitude: location.altitude || prev.altitude,
        startAltitude: prev.startAltitude === 0 ? (location.altitude || 0) : prev.startAltitude,
        elevationGain: newElevationGain,
        movingTime: newMovingTime,
        route: [...prev.route, newRoutePoint]
      };
    });

    updateReference();
    lastMovingTimeRef.current = Date.now();

  }, [location, trainingState, selectedType]);

  // ============================================
  // CONTROLES DE ENTRENAMIENTO
  // ============================================
  const pauseTraining = () => {
    setTrainingState('paused');
    clearInterval(intervalRef.current);
    setCurrentTraining({ state: 'paused', type: trainingData.type });
    pausedTimeRef.current = Date.now();
    lastMovingTimeRef.current = null;
  };

  const resumeTraining = () => {
    setTrainingState('active');
    setCurrentTraining({ state: 'active', type: trainingData.type });

    if (location) {
      lastPositionRef.current = {
        lat: location.lat,
        lng: location.lng,
        altitude: location.altitude || 0,
        timestamp: location.timestamp
      };
    }

    if (pausedTimeRef.current > 0) {
      const pauseDuration = (Date.now() - pausedTimeRef.current) / 1000;
      setTrainingData(prev => ({
        ...prev,
        totalPausedTime: prev.totalPausedTime + pauseDuration
      }));
      pausedTimeRef.current = 0;
    }

    lastMovingTimeRef.current = Date.now();
    // ============================================
    // NUEVO: Al reanudar, también necesitamos re-estabilizar
    // ============================================
    stableCounterRef.current = 0;
    initialStabilizationPassedRef.current = false;

    intervalRef.current = setInterval(() => {
      setTrainingData(prev => ({
        ...prev,
        currentTime: prev.currentTime + 1
      }));
    }, 1000);
  };

  const finishTraining = () => {
    setFinishDialogOpen(true);
  };

  const handleCancelFinish = () => {
    setFinishDialogOpen(false);
    // Reiniciamos el GPS
    startWatching();
  };

  const confirmFinish = () => {
  stopWatching();
  clearInterval(intervalRef.current);
  intervalRef.current = null;

  const endTime = new Date();

  const totalDistance = trainingData.distance;
  const totalMovingSeconds = trainingData.movingTime;
  const totalCurrentSeconds = trainingData.currentTime;

  const validatedMaxSpeed = Math.min(
    trainingData.maxSpeed,
    SPEED_LIMITS[trainingData.type]?.max || 60
  );

  let avgPace = '0:00';
  if (totalDistance > 0 && totalMovingSeconds > 0) {
    const paceInSeconds = totalMovingSeconds / totalDistance;
    const paceMinutes = Math.floor(paceInSeconds / 60);
    const paceSecs = Math.floor(paceInSeconds % 60);
    avgPace = `${paceMinutes}:${paceSecs.toString().padStart(2, '0')}`;
  }

  let caloriesBurned = 0;
  if (profile?.weight && totalDistance > 0) {
    const met = trainingData.type === 'caminar' ? 3.8 : trainingData.type === 'ciclismo' ? 6.8 : 8.5;
    const hours = totalMovingSeconds / 3600;
    caloriesBurned = Math.round(met * profile.weight * hours);
  }

  const splits = [];
  let lastSplitKm = 0;
  let lastSplitTime = 0;

  if (trainingData.route.length > 0) {
    trainingData.route.forEach((point, index) => {
      if (index === 0) {
        lastSplitTime = point.time;
        return;
      }
      const pointDistance = point.distance || 0;
      if (Math.floor(pointDistance) > lastSplitKm) {
        const splitTime = point.time - lastSplitTime;
        const splitMinutes = Math.floor(splitTime / 60);
        const splitSeconds = splitTime % 60;
        splits.push({
          km: lastSplitKm + 1,
          pace: `${splitMinutes}:${splitSeconds.toString().padStart(2, '0')}`,
          time: splitTime
        });
        lastSplitKm = Math.floor(pointDistance);
        lastSplitTime = point.time;
      }
    });
  }

  const getTimeOfDay = (date) => {
  const hour = date.getHours();

    if (hour >= 5 && hour < 12)  return { text: "mañana", emoji: "🌅" };
    if (hour >= 12 && hour < 18) return { text: "tarde",   emoji: "☀️" };
    if (hour >= 18 && hour <= 23) return { text: "noche",  emoji: "🌙" };
    return { text: "madrugada", emoji: "🌌" }; // 00:00–04:59
  };

  const getActivityDisplay = (type) => {
    switch (type) {
      case 'caminar':  return { name: 'caminata', emoji: '🚶‍♂️' };
      case 'ciclismo': return { name: 'bici',   emoji: '🚴‍♂️' };
      case 'mtb':      return { name: 'Downhill',      emoji: '🚵‍♂️' };
      default:         return { name: type,       emoji: '🏃' };
    }
  };

  const timeInfo = getTimeOfDay(trainingData.startTime);
  const activityInfo = getActivityDisplay(trainingData.type);

  // Opción A: "Caminata por la mañana" + emoji al principio
  // const autoTitle = `${activityInfo.emoji} ${activityInfo.name.charAt(0).toUpperCase() + activityInfo.name.slice(1)} por la ${timeInfo.text}`;

  // Opción B: "Tarde de MTB" (más corta y directa, muy común en apps)
  const autoTitle = `${timeInfo.emoji} ${timeInfo.text.charAt(0).toUpperCase() + timeInfo.text.slice(1)} de ${activityInfo.name}`;


  const newTraining = {
    id: Date.now(),
    title: autoTitle,
    type: trainingData.type,
    date: trainingData.startTime.toISOString(),
    startTime: trainingData.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    endTime: endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    movingTime: Math.round(totalMovingSeconds),
    totalTime: Math.round(totalCurrentSeconds),
    distance: parseFloat(totalDistance.toFixed(2)),
    avgSpeed: totalMovingSeconds > 0
      ? parseFloat((totalDistance / (totalMovingSeconds / 3600)).toFixed(1))
      : 0,
    maxSpeed: parseFloat(validatedMaxSpeed.toFixed(1)),
    avgPace: avgPace,
    elevationGain: Math.round(trainingData.elevationGain),
    elevationLoss: 0,
    startAltitude: Math.round(trainingData.startAltitude),
    endAltitude: Math.round(trainingData.altitude),
    calories: caloriesBurned,
    route: trainingData.route,
    splits: splits
  };

  // ←←← AQUÍ ESTÁ EL CAMBIO PRINCIPAL ←←←
  addTraining(newTraining);

  // Limpiamos estados
  setFinishDialogOpen(false);
  setTrainingState('idle');
  setSelectedType(null);
  setCurrentTraining(null);

  // ¡Navegamos directamente al detalle del entrenamiento recién guardado!
  navigate(`/training/${newTraining.id}`);
};

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => {
            if (trainingState === 'idle') {
              navigate('/home');
            }
          }}
          disabled={trainingState !== 'idle'}
          sx={{
            mr: 1,
            opacity: trainingState !== 'idle' ? 0.5 : 1
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {trainingState === 'idle' ? 'Nuevo entrenamiento' :
          trainingState === 'preparing' ? 'Preparando GPS...' :
          trainingState === 'active' ? 'Entrenando' : 'Entrenamiento pausado'}
        </Typography>
      </Box>

      {/* Alerta de GPS */}
      {gpsPermissionDenied && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Permiso de ubicación denegado. Actívalo en la configuración de tu dispositivo.
        </Alert>
      )}

      {gpsError && !gpsPermissionDenied && trainingState !== 'idle' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esperando señal GPS... Asegúrate de tener visibilidad del cielo.
        </Alert>
      )}

      {/* Mapa con Leaflet */}
      <TrainingMap
        route={trainingData.route}
        currentLocation={location}
        showStartEnd={false}
        height={350}
      />

      {/* Estado GPS */}
      {trainingState !== 'idle' && (
        <Card sx={{ mt: 2, mb: 2, bgcolor: isWatching ? (location ? '#E8F5E9' : '#FFF9C4') : '#FFEBEE', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isWatching ? (
                  location ? (
                    <GpsFixed sx={{ color: '#4CAF50' }} />
                  ) : (
                    <GpsFixed sx={{ color: '#FFB300', animation: 'pulse 1.5s infinite' }} />
                  )
                ) : (
                  <GpsOff sx={{ color: '#F44336' }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {isWatching
                    ? (location ? 'GPS Conectado' : 'Buscando señal...')
                    : 'GPS Desconectado'}
                </Typography>
              </Box>
              {location && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Precisión: ±{location.accuracy?.toFixed(0) || '?'}m
                </Typography>
              )}
            </Box>
            {location && trainingState === 'idle' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption">Velocidad: {location.speed?.toFixed(1) || 0} km/h</Typography>
                <Typography variant="caption">Altitud: {location.altitude?.toFixed(0) || 0} m</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selector de actividad */}
      {trainingState === 'idle' && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Selecciona actividad
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper
                  elevation={selectedType === 'caminar' ? 3 : 1}
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: selectedType === 'caminar' ? '#E8F5E9' : 'background.paper',
                    border: selectedType === 'caminar' ? '2px solid #2E7D32' : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#F5F5F5',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleSelectType('caminar')}
                >
                  <DirectionsWalk sx={{ fontSize: 40, color: '#2E7D32' }} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    Caminar
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  elevation={selectedType === 'ciclismo' ? 3 : 1}
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: selectedType === 'ciclismo' ? '#E3F2FD' : 'background.paper',
                    border: selectedType === 'ciclismo' ? '2px solid #1976D2' : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#F5F5F5',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleSelectType('ciclismo')}
                >
                  <DirectionsBike sx={{ fontSize: 40, color: '#1976D2' }} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    Ciclismo
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper
                  elevation={selectedType === 'mtb' ? 3 : 1}
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: selectedType === 'mtb' ? '#EFEBE9' : 'background.paper',
                    border: selectedType === 'mtb' ? '2px solid #8D6E63' : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#F5F5F5',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleSelectType('mtb')}
                >
                  <Terrain sx={{ fontSize: 40, color: '#8D6E63' }} />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    MTB
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {trainingState === 'preparing' && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 10, 
            px: 3,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Preparando GPS...
          </Typography>
          
          <Box 
            sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.5rem',
              fontWeight: 'bold',
              mb: 3,
              boxShadow: 4
            }}
          >
            {warmupCountdown}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 320 }}>
            Mantén el teléfono con buena vista al cielo para una mejor precisión inicial.
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
            Tipo de actividad: {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
          </Typography>
        </Box>
      )}

      {/* Métricas en tiempo real */}
      {trainingState !== 'idle' && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip
                label={trainingData.type === 'mtb' ? 'MTB' : trainingData.type}
                icon={
                  trainingData.type === 'caminar' ? <DirectionsWalk /> :
                    trainingData.type === 'ciclismo' ? <DirectionsBike /> : <Terrain />
                }
                sx={{
                  bgcolor:
                    trainingData.type === 'caminar' ? '#E8F5E9' :
                      trainingData.type === 'ciclismo' ? '#E3F2FD' : '#EFEBE9',
                  color:
                    trainingData.type === 'caminar' ? '#2E7D32' :
                      trainingData.type === 'ciclismo' ? '#1976D2' : '#8D6E63',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                {formatTime(trainingData.currentTime)}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {/* Distancia */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <Straighten sx={{ fontSize: 14, mr: 0.5 }} />
                    Distancia
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {trainingData.distance < 1
                      ? `${Math.round(trainingData.distance * 1000)} m`
                      : `${trainingData.distance.toFixed(2)} km`
                    }
                  </Typography>
                </Card>
              </Grid>
              {/* Velocidad actual */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <Speed sx={{ fontSize: 14, mr: 0.5 }} />
                    Velocidad
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {trainingData.currentSpeed.toFixed(1)} km/h
                  </Typography>
                </Card>
              </Grid>
              {/* Velocidad promedio */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <Timer sx={{ fontSize: 14, mr: 0.5 }} />
                    Promedio
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {trainingData.avgSpeed.toFixed(1)} km/h
                  </Typography>
                </Card>
              </Grid>
              {/* Velocidad máxima */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <FitnessCenter sx={{ fontSize: 14, mr: 0.5 }} />
                    Máxima
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {trainingData.maxSpeed.toFixed(1)} km/h
                  </Typography>
                </Card>
              </Grid>
              {/* Altitud */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <Height sx={{ fontSize: 14, mr: 0.5 }} />
                    Altitud
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {Math.round(trainingData.altitude)} m
                  </Typography>
                </Card>
              </Grid>
              {/* Desnivel + */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <Terrain sx={{ fontSize: 14, mr: 0.5 }} />
                    Desnivel +
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                    +{Math.round(trainingData.elevationGain)} m
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Tiempo en movimiento: {formatTime(trainingData.movingTime)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Botones de control */}
      {trainingState !== 'idle' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          {trainingState === 'active' ? (
            <>
              <Button
                variant="contained"
                color="warning"
                size="large"
                startIcon={<Pause />}
                onClick={pauseTraining}
                sx={{ px: 4, py: 1.5, borderRadius: 3, flex: 1, maxWidth: 150 }}
              >
                Pausa
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<Stop />}
                onClick={finishTraining}
                sx={{ px: 4, py: 1.5, borderRadius: 3, flex: 1, maxWidth: 150 }}
              >
                Finalizar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<PlayArrow />}
                onClick={resumeTraining}
                sx={{ px: 4, py: 1.5, borderRadius: 3, flex: 1, maxWidth: 150 }}
              >
                Reanudar
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<Stop />}
                onClick={finishTraining}
                sx={{ px: 4, py: 1.5, borderRadius: 3, flex: 1, maxWidth: 150 }}
              >
                Finalizar
              </Button>
            </>
          )}
        </Box>
      )}

      {/* Botón de comenzar */}
      {trainingState === 'idle' && (
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={!selectedType}
          onClick={startTraining}
          sx={{
            mt: 3,
            py: 1.5,
            fontSize: '1.1rem',
            borderRadius: 3,
            bgcolor: selectedType ? 'primary.main' : 'action.disabledBackground',
            '&:hover': {
              bgcolor: selectedType ? 'primary.dark' : 'action.disabledBackground'
            }
          }}
        >
          Comenzar entrenamiento
        </Button>
      )}

      {/* Diálogo de finalizar */}
      <Dialog
        open={finishDialogOpen}
        onClose={handleCancelFinish}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Finalizar entrenamiento
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Estás seguro de que quieres finalizar?
          </Typography>
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 2
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Distancia
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {trainingData.distance.toFixed(2)} km
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Tiempo en movimiento
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {formatTime(trainingData.movingTime)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setFinishDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button onClick={confirmFinish} variant="contained" color="error" sx={{ borderRadius: 2 }}>
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Training;