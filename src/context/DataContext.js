// context/DataContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

const DataContext = createContext();

// Datos iniciales simulados
const initialTrainings = [
  {
    id: 1,
    type: 'caminar',
    date: '2026-01-15T10:30:00',
    startTime: '10:30',
    endTime: '11:45',
    movingTime: 2700,
    totalTime: 3000,
    distance: 4.2,
    avgSpeed: 5.6,
    maxSpeed: 7.2,
    avgPace: '10:42',
    elevationGain: 45,
    elevationLoss: 38,
    startAltitude: 120,
    endAltitude: 127,
    calories: 280,
    route: [
      { lat: 40.416775, lng: -3.703790, altitude: 120 },
      { lat: 40.416875, lng: -3.703890, altitude: 122 },
    ],
    splits: [
      { km: 1, pace: '10:15', time: 615 },
      { km: 2, pace: '10:30', time: 630 },
      { km: 3, pace: '10:45', time: 645 },
      { km: 4, pace: '11:00', time: 660 },
      { km: 4.2, pace: '10:18', time: 150 },
    ]
  },
  {
    id: 2,
    type: 'ciclismo',
    date: '2026-01-14T15:00:00',
    startTime: '15:00',
    endTime: '16:30',
    movingTime: 4800,
    totalTime: 5400,
    distance: 25.3,
    avgSpeed: 18.9,
    maxSpeed: 32.5,
    avgPace: '3:10',
    elevationGain: 180,
    elevationLoss: 175,
    startAltitude: 110,
    endAltitude: 115,
    calories: 520,
    splits: [
      { km: 1, pace: '3:05', time: 185 },
      { km: 2, pace: '3:12', time: 192 },
    ]
  },
  {
    id: 3,
    type: 'mtb',
    date: '2026-01-12T09:00:00',
    startTime: '09:00',
    endTime: '11:00',
    movingTime: 6000,
    totalTime: 7200,
    distance: 18.7,
    avgSpeed: 11.2,
    maxSpeed: 28.3,
    avgPace: '5:21',
    elevationGain: 320,
    elevationLoss: 315,
    startAltitude: 150,
    endAltitude: 155,
    calories: 680,
    splits: [
      { km: 1, pace: '5:15', time: 315 },
      { km: 2, pace: '5:22', time: 322 },
    ]
  }
];

const initialProfile = {
  name: 'Julian Corsino',
  weight: 71,
  height: 174,
  age: 29,
  sex: 'masculino',
  fitnessLevel: 'intermedio',
  restingBpm: 64,
  maxBpm: 198,
  email: 'juliancorsino@gmail.com',
  avatar: null,
  startAltitude: 100
};

export const DataProvider = ({ children }) => {
  const [trainings, setTrainings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [currentTraining, setCurrentTraining] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos desde Preferences al iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const trainingsData = await Preferences.get({ key: 'trainings' });
        const profileData = await Preferences.get({ key: 'profile' });
        
        setTrainings(trainingsData.value ? JSON.parse(trainingsData.value) : initialTrainings);
        setProfile(profileData.value ? JSON.parse(profileData.value) : initialProfile);
      } catch (error) {
        console.error('Error loading data from Preferences:', error);
        setTrainings(initialTrainings);
        setProfile(initialProfile);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Guardar trainings cada vez que cambien
  useEffect(() => {
    if (!loading) {
      Preferences.set({ key: 'trainings', value: JSON.stringify(trainings) });
    }
  }, [trainings, loading]);

  // Guardar profile cada vez que cambie
  useEffect(() => {
    if (!loading) {
      Preferences.set({ key: 'profile', value: JSON.stringify(profile) });
    }
  }, [profile, loading]);

  const addTraining = (training) => {
    setTrainings(prev => [training, ...prev]);
  };

  const deleteTraining = (id) => {
    setTrainings(prev => prev.filter(t => t.id !== id));
  };

  const updateProfile = (newProfile) => {
    setProfile(newProfile);
  };

  if (loading) {
    // Puedes reemplazar esto por un spinner o pantalla de carga
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  return (
    <DataContext.Provider value={{
      trainings,
      profile,
      currentTraining,
      setCurrentTraining,
      addTraining,
      deleteTraining,
      updateProfile
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);