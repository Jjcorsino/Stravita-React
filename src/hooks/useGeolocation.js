// hooks/useGeolocation.js
import { useState, useEffect, useRef } from 'react';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false); // ← NUEVO ESTADO
  const watchIdRef = useRef(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options
  };

  const startWatching = () => {
    console.log('📍 startWatching called');
    if (!navigator.geolocation) {
      setError('La geolocalización no es soportada');
      return;
    }

    if (watchIdRef.current !== null) {
      console.log('⚠️ Ya hay un watcher activo');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        console.log('✅ Posición recibida');
        const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
        
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          altitude: altitude || 0,
          speed: speed ? speed * 3.6 : 0,
          heading,
          timestamp: position.timestamp
        });
        setError(null);
      },
      (err) => {
        console.error('❌ Error GPS:', err);
        setError({ code: err.code, message: err.message });
      },
      defaultOptions
    );
    
    setIsWatching(true); // ← ACTUALIZAR ESTADO
  };

  const stopWatching = () => {
    console.log('🛑 stopWatching called');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false); // ← ACTUALIZAR ESTADO
    }
  };

  // Limpieza automática al desmontar
  useEffect(() => {
    return () => stopWatching();
  }, []);

  return { 
    location, 
    error, 
    startWatching, 
    stopWatching, 
    isWatching  // ← AHORA ES REACTIVO
  };
};

export default useGeolocation;