// hooks/useCapacitorGeolocation.js
import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

const useCapacitorGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  let watchId = null;

  const startWatching = async () => {
    try {
      // Solicitar permisos primero
      const permStatus = await Geolocation.requestPermissions();
      if (permStatus.location !== 'granted') {
        setError('Permiso de ubicación denegado');
        return;
      }

      setIsWatching(true);
      watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position, err) => {
          if (err) {
            setError(err.message);
            return;
          }
          if (position) {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || 0,
              speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // m/s → km/h
              timestamp: position.timestamp,
            });
            setError(null);
          }
        }
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const stopWatching = () => {
    if (watchId) {
      Geolocation.clearWatch({ id: watchId });
      setIsWatching(false);
    }
  };

  useEffect(() => {
    return () => stopWatching();
  }, []);

  return { location, error, isWatching, startWatching, stopWatching };
};

export default useCapacitorGeolocation;