// context/DataContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const DataContext = createContext();

// Datos iniciales simulados
const initialTrainings = [
  {
    id: 1,
    type: 'caminar',
    date: '2024-01-15T10:30:00',
    startTime: '10:30',
    endTime: '11:45',
    movingTime: 2700, // segundos
    totalTime: 3000,
    distance: 4.2, // km
    avgSpeed: 5.6, // km/h
    maxSpeed: 7.2,
    avgPace: '10:42', // min/km
    elevationGain: 45, // metros
    elevationLoss: 38,
    startAltitude: 120,
    endAltitude: 127,
    calories: 280,
    route: [
      { lat: 40.416775, lng: -3.703790, altitude: 120 },
      { lat: 40.416875, lng: -3.703890, altitude: 122 },
      // ... más puntos
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
    type: 'bici',
    date: '2024-01-14T15:00:00',
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
      // ... más splits
    ]
  },
  {
    id: 3,
    type: 'mtb',
    date: '2024-01-12T09:00:00',
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
      // ... más splits
    ]
  }
];

const initialProfile = {
  name: 'Juan Pérez',
  weight: 75, // kg
  height: 178, // cm
  age: 32,
  sex: 'masculino',
  fitnessLevel: 'intermedio',
  restingBpm: 62,
  maxBpm: 188,
  email: 'juan.perez@email.com',
  avatar: null
};

export const DataProvider = ({ children }) => {
  const [trainings, setTrainings] = useState(() => {
    const saved = localStorage.getItem('trainings');
    return saved ? JSON.parse(saved) : initialTrainings;
  });
  
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : initialProfile;
  });

  const [currentTraining, setCurrentTraining] = useState(null);

  useEffect(() => {
    localStorage.setItem('trainings', JSON.stringify(trainings));
  }, [trainings]);

  useEffect(() => {
    localStorage.setItem('profile', JSON.stringify(profile));
  }, [profile]);

  const addTraining = (training) => {
    setTrainings(prev => [training, ...prev]);
  };

  const deleteTraining = (id) => {
    setTrainings(prev => prev.filter(t => t.id !== id));
  };

  const updateProfile = (newProfile) => {
    setProfile(newProfile);
  };

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