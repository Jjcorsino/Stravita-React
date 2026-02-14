// pages/Profile.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  Snackbar,
  LinearProgress, // <-- nueva importación
} from '@mui/material';
import {
  Edit,
  Save,
  ArrowBack,
  Person,
  FitnessCenter,
  Height,
  MonitorHeart,
  Cake,
  Female,
  Male,
  Whatshot,      // <-- nueva
  DateRange,     // <-- nueva
  Straighten,    // <-- nueva
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { format, subDays } from 'date-fns'; // <-- nuevas

const Profile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, trainings } = useData(); // <-- añadimos trainings

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // --- Cálculos de métricas adicionales (solo lectura) ---
  const totalTrainings = trainings.length;
  const totalDistance = trainings
    .reduce((acc, t) => acc + t.distance, 0)
    .toFixed(1);

  // Conjunto de fechas con actividad
  const activityDates = new Set(
    trainings.map((t) => format(new Date(t.date), 'yyyy-MM-dd'))
  );

  // Racha actual (días consecutivos hasta hoy)
  let currentStreak = 0;
  let date = new Date();
  while (true) {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (activityDates.has(dateStr)) {
      currentStreak++;
      date = subDays(date, 1);
    } else break;
  }

  // Días entrenados en los últimos 7 días
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return format(d, 'yyyy-MM-dd');
  });
  const trainedLast7Days = last7Days.filter((d) => activityDates.has(d)).length;

  // IMC y clasificación
  let bmi = 0;
  let bmiCategory = '';
  let bmiColor = '';
  if (profile.weight && profile.height) {
    bmi = profile.weight / Math.pow(profile.height / 100, 2);
    if (bmi < 18.5) {
      bmiCategory = 'Bajo peso';
      bmiColor = '#2196F3';
    } else if (bmi < 25) {
      bmiCategory = 'Normal';
      bmiColor = '#4CAF50';
    } else if (bmi < 30) {
      bmiCategory = 'Sobrepeso';
      bmiColor = '#FF9800';
    } else {
      bmiCategory = 'Obesidad';
      bmiColor = '#F44336';
    }
  }

  // FC máxima teórica
  const theoreticalMaxHr = profile.age ? 220 - profile.age : 0;

  // Metabolismo basal (Mifflin-St Jeor)
  let bmr = 0;
  if (profile.weight && profile.height && profile.age && profile.sex) {
    if (profile.sex === 'masculino') {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else if (profile.sex === 'femenino') {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    } else {
      // Valor neutro (promedio)
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 78;
    }
  }
  // -------------------------------------------------------

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSliderChange = (field) => (event, newValue) => {
    setFormData({
      ...formData,
      [field]: newValue,
    });
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    setSnackbarOpen(true);
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setIsEditing(false);
  };

  const fitnessLevels = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
    { value: 'atleta', label: 'Atleta' },
  ];

  const sexes = [
    { value: 'masculino', label: 'Masculino', icon: <Male /> },
    { value: 'femenino', label: 'Femenino', icon: <Female /> },
    { value: 'otro', label: 'Otro', icon: <Person /> },
  ];

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/home')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Mi Perfil
          </Typography>
        </Box>
        {!isEditing ? (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setIsEditing(true)}
          >
            Editar
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleCancel} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
            >
              Guardar
            </Button>
          </Box>
        )}
      </Box>

      {/* Avatar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Avatar
          sx={{
            width: 120,
            height: 120,
            bgcolor: 'primary.main',
            fontSize: 48,
            border: '4px solid',
            borderColor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {formData.name?.charAt(0) || 'U'}
        </Avatar>
      </Box>

      {/* Información personal */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Person sx={{ color: 'primary.main' }} />
            Información personal
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={formData.name || ''}
                onChange={handleChange('name')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'standard'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange('email')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'standard'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Datos físicos */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FitnessCenter sx={{ color: 'primary.main' }} />
            Datos físicos
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Edad"
                type="number"
                value={formData.age || ''}
                onChange={handleChange('age')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'standard'}
                InputProps={{
                  readOnly: !isEditing,
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary">
                      años
                    </Typography>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Peso"
                type="number"
                value={formData.weight || ''}
                onChange={handleChange('weight')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'standard'}
                InputProps={{
                  readOnly: !isEditing,
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary">
                      kg
                    </Typography>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Altura"
                type="number"
                value={formData.height || ''}
                onChange={handleChange('height')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'standard'}
                InputProps={{
                  readOnly: !isEditing,
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary">
                      cm
                    </Typography>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl
                fullWidth
                variant={isEditing ? 'outlined' : 'standard'}
              >
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={formData.sex || ''}
                  onChange={handleChange('sex')}
                  label="Sexo"
                  readOnly={!isEditing}
                  disabled={!isEditing}
                >
                  {sexes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Condición física */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <MonitorHeart sx={{ color: 'primary.main' }} />
            Condición física
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                variant={isEditing ? 'outlined' : 'standard'}
              >
                <InputLabel>Nivel de condición</InputLabel>
                <Select
                  value={formData.fitnessLevel || ''}
                  onChange={handleChange('fitnessLevel')}
                  label="Nivel de condición"
                  readOnly={!isEditing}
                  disabled={!isEditing}
                >
                  {fitnessLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Frecuencia cardíaca en reposo
              </Typography>
              {isEditing ? (
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={formData.restingBpm || 60}
                    onChange={handleSliderChange('restingBpm')}
                    min={40}
                    max={100}
                    marks={[
                      { value: 40, label: '40' },
                      { value: 60, label: '60' },
                      { value: 80, label: '80' },
                      { value: 100, label: '100' },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formData.restingBpm} bpm
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Frecuencia cardíaca máxima
              </Typography>
              {isEditing ? (
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={formData.maxBpm || 188}
                    onChange={handleSliderChange('maxBpm')}
                    min={140}
                    max={220}
                    marks={[
                      { value: 140, label: '140' },
                      { value: 180, label: '180' },
                      { value: 220, label: '220' },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formData.maxBpm} bpm
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen de actividad (solo visible cuando no se está editando) */}
      {!isEditing && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Resumen de actividad
            </Typography>

            <Grid container spacing={2}>
              {/* IMC + clasificación */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    IMC
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {bmi.toFixed(1)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: bmiColor, fontWeight: 600 }}
                  >
                    {bmiCategory}
                  </Typography>
                </Card>
              </Grid>

              {/* FC Zona quema grasa */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Zona quema grasa
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {Math.round(profile.maxBpm * 0.6)}-
                    {Math.round(profile.maxBpm * 0.7)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    FC máx: {profile.maxBpm} bpm
                  </Typography>
                </Card>
              </Grid>

              {/* FC máxima teórica */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    FC máx teórica
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {theoreticalMaxHr} bpm
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    220 - {profile.age}
                  </Typography>
                </Card>
              </Grid>

              {/* Metabolismo basal */}
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Metabolismo basal
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {Math.round(bmr)} kcal
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    por día
                  </Typography>
                </Card>
              </Grid>

              {/* Total entrenamientos */}
              <Grid item xs={4}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <FitnessCenter
                    sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Entrenamientos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {totalTrainings}
                  </Typography>
                </Card>
              </Grid>

              {/* Distancia total */}
              <Grid item xs={4}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Straighten
                    sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Distancia
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {totalDistance} km
                  </Typography>
                </Card>
              </Grid>

              {/* Racha actual */}
              <Grid item xs={4}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Whatshot
                    sx={{
                      fontSize: 24,
                      color: currentStreak > 0 ? '#FF9800' : 'text.disabled',
                      mb: 0.5,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Racha
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {currentStreak} días
                  </Typography>
                </Card>
              </Grid>

              {/* Tendencia semanal */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <DateRange sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Últimos 7 días
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {trainedLast7Days} de 7 días con actividad
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: 'primary.main' }}
                    >
                      {Math.round((trainedLast7Days / 7) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(trainedLast7Days / 7) * 100}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Perfil actualizado correctamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;