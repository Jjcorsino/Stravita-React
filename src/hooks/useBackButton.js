// hooks/useBackButton.js
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const useBackButton = () => {
  const navigate = useNavigate();
  const [showExitMessage, setShowExitMessage] = useState(false);
  const exitTimerRef = useRef(null);
  const backPressCountRef = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('No es plataforma nativa → no agrego listener backButton');
      return;
    }

    console.log('Agregando listener backButton (Capacitor nativo)');

    const handleBackButton = (event) => {
      console.log('Evento backButton recibido:', event); // ← Esto debe aparecer en consola al presionar back

      const { canGoBack = false } = event || {}; // Safe destructuring (evita crash si event es undefined)

      if (backPressCountRef.current === 0) {
        // Primer toque
        setShowExitMessage(true);
        backPressCountRef.current = 1;

        // Reset automático
        exitTimerRef.current = setTimeout(() => {
          setShowExitMessage(false);
          backPressCountRef.current = 0;
        }, 2000);

        // Si hay historia → back normal (común en apps)
        if (canGoBack) {
          console.log('Hay historia → navigate(-1)');
          navigate(-1);
        }
      } else {
        // Segundo toque rápido → salir
        console.log('Segundo back → exitApp');
        App.exitApp().catch((err) => console.error('Error en exitApp:', err));
      }
    };

    let listener;
    try {
      listener = App.addListener('backButton', handleBackButton);
      console.log('Listener backButton agregado OK');
    } catch (err) {
      console.error('Error al agregar listener backButton:', err);
    }

    return () => {
      console.log('Limpiando listener backButton');
      if (listener) listener.remove();
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [navigate]);

  return showExitMessage;
};

export default useBackButton;