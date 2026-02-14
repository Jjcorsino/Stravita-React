// components/TrainingMap.js
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para centrar el mapa en la ruta o en la ubicación actual
const FitBounds = ({ route, currentLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  }, [route, currentLocation, map]);
  return null;
};

// Icono personalizado para posición actual (con animación)
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background: #FC4C02;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(252,76,2,0.7);
    animation: pulse 2s infinite;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Icono para inicio de ruta
const startIcon = L.divIcon({
  className: 'start-marker',
  html: `<div style="background-color: #4CAF50; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Icono para fin de ruta
const endIcon = L.divIcon({
  className: 'end-marker',
  html: `<div style="background-color: #F44336; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const TrainingMap = ({ 
  route = [],          // array de puntos { lat, lng, ... }
  currentLocation = null,  // { lat, lng, accuracy, ... }
  showStartEnd = true,     // mostrar marcadores de inicio/fin (útil en detalle)
  height = 350            // altura del contenedor
}) => {
  const hasRoute = route && route.length > 0;
  const hasLocation = currentLocation && currentLocation.lat && currentLocation.lng;

  // Si no hay ruta ni ubicación, mostrar placeholder
  if (!hasRoute && !hasLocation) {
    return (
      <div style={{
        height,
        background: 'linear-gradient(145deg, #2C3E50 0%, #3498DB 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: 16,
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ fontSize: 48 }}>🗺️</div>
        <h3>Esperando señal GPS...</h3>
        <p style={{ opacity: 0.8 }}>Activa la ubicación en tu dispositivo</p>
      </div>
    );
  }

  // Centro inicial: prioridad a ubicación actual, si no, primer punto de ruta
  const defaultCenter = hasLocation
    ? [currentLocation.lat, currentLocation.lng]
    : hasRoute
    ? [route[0].lat, route[0].lng]
    : [0, 0];

  const positions = hasRoute ? route.map(p => [p.lat, p.lng]) : [];

  return (
    <div style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
        />

        {/* Ajustar vista según sea ruta o ubicación actual */}
        <FitBounds route={route} currentLocation={currentLocation} />

        {/* Dibujar la ruta si existe */}
        {hasRoute && (
          <Polyline
            positions={positions}
            color="#FC4C02"
            weight={4}
            opacity={0.8}
            smoothFactor={1}
          />
        )}

        {/* Marcador de posición actual (en entrenamiento en vivo) */}
        {hasLocation && !showStartEnd && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentLocationIcon}>
            <Popup>
              <strong>Tu posición</strong><br />
              Velocidad: {currentLocation.speed?.toFixed(1) || 0} km/h<br />
              Precisión: ±{currentLocation.accuracy?.toFixed(0) || 0}m
            </Popup>
          </Marker>
        )}

        {/* Marcadores de inicio y fin (para detalle de entrenamiento) */}
        {showStartEnd && hasRoute && route.length > 0 && (
          <>
            <Marker position={[route[0].lat, route[0].lng]} icon={startIcon}>
              <Popup>Inicio del entrenamiento</Popup>
            </Marker>
            <Marker position={[route[route.length - 1].lat, route[route.length - 1].lng]} icon={endIcon}>
              <Popup>Fin del entrenamiento</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default TrainingMap;