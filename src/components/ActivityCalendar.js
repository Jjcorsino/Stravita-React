import React, { useMemo } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

const ActivityCalendar = ({ trainings, year, month }) => {
  // Si no se especifica año/mes, usa el mes actual
  const currentDate = useMemo(() => {
    if (year !== undefined && month !== undefined) {
      return new Date(year, month, 1);
    }
    return new Date();
  }, [year, month]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Día de la semana de inicio (0 = domingo, 1 = lunes...)
  const startDay = getDay(startOfMonth(currentDate));

  // Conjunto de fechas (string YYYY-MM-DD) que tienen entrenamiento
  const activityDates = useMemo(() => {
    return new Set(
      trainings.map(t => format(new Date(t.date), 'yyyy-MM-dd'))
    );
  }, [trainings]);

  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textTransform: 'capitalize' }}>
        {format(currentDate, "MMMM yyyy", { locale: es })}
      </Typography>
      <Grid container spacing={0.5}>
        {/* Cabecera días de la semana */}
        {weekDays.map((day, i) => (
          <Grid item xs={12 / 7} key={`header-${i}`}>
            <Typography variant="caption" align="center" display="block" color="text.secondary">
              {day}
            </Typography>
          </Grid>
        ))}
        {/* Celdas vacías antes del día 1 */}
        {Array.from({ length: startDay }).map((_, i) => (
          <Grid item xs={12 / 7} key={`empty-${i}`}>
            <Box sx={{ height: 36 }} />
          </Grid>
        ))}
        {/* Días del mes */}
        {daysInMonth.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasActivity = activityDates.has(dateStr);
          return (
            <Grid item xs={12 / 7} key={dateStr}>
              <Paper
                elevation={0}
                sx={{
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: hasActivity ? 'primary.light' : 'transparent',
                  color: hasActivity ? 'white' : 'text.primary',
                  borderRadius: 1,
                  fontWeight: hasActivity ? 600 : 400,
                  border: hasActivity ? 'none' : '1px solid',
                  borderColor: 'divider'
                }}
              >
                {format(day, 'd')}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ActivityCalendar;