import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Divider,
  Button,
  IconButton,
  ButtonGroup,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  DirectionsWalk,
  DirectionsBike,
  Terrain,
  TrendingUp,
  Speed,
  Timer,
  Straighten,
  LocalFireDepartment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  subDays,
  addDays,
  isSameDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';

const Statistics = () => {
  const navigate = useNavigate();
  const { trainings } = useData();
  const [period, setPeriod] = useState('all'); // 'all' o 'month'

  // Filtrar entrenamientos según período seleccionado
  const filteredTrainings = useMemo(() => {
    if (period === 'all') return trainings;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return trainings.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  }, [trainings, period]);

  // --- Métricas generales ---
  const totalDistance = filteredTrainings.reduce((acc, t) => acc + t.distance, 0);
  const totalTime = filteredTrainings.reduce((acc, t) => acc + t.movingTime, 0);
  const totalCalories = filteredTrainings.reduce((acc, t) => acc + t.calories, 0);
  const totalElevation = filteredTrainings.reduce((acc, t) => acc + t.elevationGain, 0);
  
  const avgSpeed = totalTime > 0 
    ? (totalDistance / (totalTime / 3600)).toFixed(1) 
    : 0;

  const activitiesByType = {
    caminar: filteredTrainings.filter(t => t.type === 'caminar').length,
    ciclismo: filteredTrainings.filter(t => t.type === 'ciclismo').length,
    mtb: filteredTrainings.filter(t => t.type === 'mtb').length
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  // Mejor entrenamiento del período
  const getBestActivity = () => {
    if (filteredTrainings.length === 0) return { type: 'ninguna', distance: 0 };
    const best = filteredTrainings.reduce((max, t) => 
      t.distance > max.distance ? t : max
    , filteredTrainings[0]);
    return { type: best.type, distance: best.distance };
  };
  const bestActivity = getBestActivity();

  // Objetivo según período
  const goalDistance = period === 'all' ? 100 : 30;
  const goalLabel = period === 'all' 
    ? `${(goalDistance - totalDistance).toFixed(1)} km para 100km`
    : `${(goalDistance - totalDistance).toFixed(1)} km para 30km este mes`;

  // --- DATOS PARA GRÁFICOS ---
  const ACTIVITY_COLORS = {
    caminar: '#2E7D32',
    ciclismo: '#1976D2',
    mtb: '#8D6E63'
  };

  // Gráfico de barras
  const barChartData = useMemo(() => {
  if (period === 'all') {
    const monthsMap = new Map();
    trainings.forEach(t => {
      const date = new Date(t.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      // Clave en formato YYYY-MM para orden cronológico
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { label, distance: 0, sortKey: key });
      }
      monthsMap.get(key).distance += t.distance;
    });
    // Convertir a array, ordenar por sortKey y luego quitar la clave auxiliar
    return Array.from(monthsMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ label, distance }) => ({ label, distance }));
  } else {
    // Vista mensual (sin cambios)
    const daysMap = new Map();
    filteredTrainings.forEach(t => {
      const date = new Date(t.date);
      const day = date.getDate();
      const key = day.toString();
      const label = `${day}`;
      if (!daysMap.has(key)) {
        daysMap.set(key, { label, distance: 0 });
      }
      daysMap.get(key).distance += t.distance;
    });
    return Array.from(daysMap.values()).sort((a, b) => parseInt(a.label) - parseInt(b.label));
  }
}, [trainings, filteredTrainings, period]);

  // Gráfico circular
  const pieChartData = useMemo(() => {
    return [
      { name: 'Caminar', value: activitiesByType.caminar, color: ACTIVITY_COLORS.caminar },
      { name: 'Ciclismo', value: activitiesByType.ciclismo, color: ACTIVITY_COLORS.ciclismo },
      { name: 'MTB', value: activitiesByType.mtb, color: ACTIVITY_COLORS.mtb }
    ].filter(item => item.value > 0);
  }, [activitiesByType]);

  // --- CALENDARIO ---
  const today = new Date();
  
  // Generar días a mostrar según período
  const calendarDays = useMemo(() => {
    if (period === 'month') {
      // Mes completo
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return eachDayOfInterval({ start, end });
    } else {
      // 5 semanas centradas en hoy: 17 días atrás, hoy, 17 adelante = 35 días
      const start = subDays(today, 17);
      const end = addDays(today, 17);
      // Ajustar para que empiece en lunes y termine en domingo (semana completa)
      const mondayStart = startOfWeek(start, { weekStartsOn: 1 });
      const sundayEnd = endOfWeek(end, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: mondayStart, end: sundayEnd });
    }
  }, [period, today]);

  // Días de la semana (abreviados)
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Conjunto de fechas con actividad
  const activityDates = useMemo(() => {
    return new Set(
      trainings.map(t => format(new Date(t.date), 'yyyy-MM-dd'))
    );
  }, [trainings]);

  const currentStreak = useMemo(() => {
  if (!activityDates.size) return 0;
  let streak = 0;
  let date = new Date();
  while (true) {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (activityDates.has(dateStr)) {
      streak++;
      date = subDays(date, 1);
    } else {
      break;
    }
  }
  return streak;
  }, [activityDates]);

  // Título del calendario
  const calendarTitle = useMemo(() => {
    if (period === 'month') {
      return format(today, "MMMM yyyy", { locale: es });
    } else {
      const start = calendarDays[0];
      const end = calendarDays[calendarDays.length - 1];
      return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`;
    }
  }, [period, calendarDays, today]);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/home')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Estadísticas
        </Typography>
      </Box>

      {/* Selector de período */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ButtonGroup variant="contained" disableElevation>
          <Button
            onClick={() => setPeriod('all')}
            color={period === 'all' ? 'primary' : 'inherit'}
            sx={{ 
              bgcolor: period === 'all' ? 'primary.main' : 'grey.300',
              color: period === 'all' ? 'white' : 'text.primary',
              '&:hover': { bgcolor: period === 'all' ? 'primary.dark' : 'grey.400' }
            }}
          >
            Global
          </Button>
          <Button
            onClick={() => setPeriod('month')}
            color={period === 'month' ? 'primary' : 'inherit'}
            sx={{ 
              bgcolor: period === 'month' ? 'primary.main' : 'grey.300',
              color: period === 'month' ? 'white' : 'text.primary',
              '&:hover': { bgcolor: period === 'month' ? 'primary.dark' : 'grey.400' }
            }}
          >
            Este mes
          </Button>
        </ButtonGroup>
      </Box>

      {/* Resumen general */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {period === 'all' ? 'Distancia Total' : 'Distancia este mes'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalDistance < 1 
                  ? `${Math.round(totalDistance * 1000)} m`
                  : `${totalDistance.toFixed(2)} km`
                }
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalDistance < 1 ? 'Metros' : 'Kilómetros'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {period === 'all' ? 'Tiempo total' : 'Tiempo este mes'}
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

      {/* Métricas globales */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            {period === 'all' ? 'Métricas globales' : 'Métricas del mes'}
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
                  Desnivel Positivo
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

      {/* Gráfico de evolución */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            {period === 'all' ? 'Distancia por mes' : 'Distancia por día'}
          </Typography>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} unit="km" />
                <Tooltip formatter={(value) => [`${value.toFixed(2)} km`, 'Distancia']} />
                <Bar dataKey="distance" fill="#FC4C02" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No hay datos suficientes para mostrar el gráfico
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Distribución de actividades y calendario */}
      <Grid container spacing={2}>
        {/* Gráfico circular */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Actividades por tipo
              </Typography>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => {
                        const percentage = (percent * 100).toFixed(0);
                        return `${name} ${percentage}%`;
                      }}
                      labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                      labelStyle={{ fontSize: '8px', fontWeight: 600, fill: '#1F2937' }}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fontSize='10px'/>
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} actividades`, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Sin actividades en este período
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen del período y objetivo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {period === 'all' ? 'Resumen global' : 'Resumen del mes'}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {period === 'all' ? 'Total actividades' : 'Actividades este mes'}
                  </Typography>
                  <Chip label={filteredTrainings.length} size="small" color="primary" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Mejor entrenamiento
                  </Typography>
                  <Typography variant="body2" sx={{fontSize: '10px', fontWeight: 600, textTransform: 'capitalize' }}>
                    {bestActivity.type} · {bestActivity.distance.toFixed(1)} km
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Próximo objetivo
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {totalDistance >= goalDistance 
                    ? `¡${goalDistance}km alcanzados!` 
                    : goalLabel}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((totalDistance / goalDistance) * 100, 100)} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#E0E0E0',
                    '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Calendario de actividades */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              {/* Título + Chip de racha */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {calendarTitle}
                </Typography>
                {currentStreak > 0 && (
                  <Chip
                    icon={<LocalFireDepartment sx={{ fontSize: 16 }} />}
                    label={`${currentStreak} días`}
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                )}
              </Box>

              {/* Cabecera días de la semana */}
              <Grid container spacing={0.5}>
                {weekDays.map((day, i) => (
                  <Grid item xs={12 / 7} key={`header-${i}`}>
                    <Typography variant="caption" align="center" display="block" color="text.secondary">
                      {day}
                    </Typography>
                  </Grid>
                ))}
                {/* Días */}
                {calendarDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const hasActivity = activityDates.has(dateStr);
                  const isToday = isSameDay(day, today);
                  return (
                    <Grid item xs={12 / 7} key={dateStr}>
                      <Paper
                        elevation={0}
                        sx={{
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: hasActivity ? 'primary.main' : 'transparent',
                          color: hasActivity ? 'white' : 'text.primary',
                          borderRadius: '50%',
                          fontWeight: hasActivity ? 700 : 400,
                          border: isToday ? '2px solid' : 'none',
                          borderColor: 'primary.main',
                          mx: 'auto',
                          fontSize: '0.9rem',
                          boxShadow: hasActivity ? 1 : 0
                        }}
                      >
                        {format(day, 'd')}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              {/* 🚀 Barra de progreso – Racha de 7 días */}
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Racha de 7 días
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {currentStreak} / 7
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((currentStreak / 7) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#E0E0E0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: currentStreak >= 7 ? 'success.main' : 'warning.main',
                    }
                  }}
                />
                {currentStreak >= 7 && (
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                    🎉 ¡Objetivo semanal cumplido!
                  </Typography>
                )}
                {currentStreak === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                    Entrena hoy para comenzar tu racha 🔥
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics;