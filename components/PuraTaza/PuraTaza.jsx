'use client';

import { useState } from 'react';
import Script from 'next/script';
import Controles from './Controles';
import Canvas from './Canvas';
import Objectron from './Objectron';

const PuraTaza = () => {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false); // Nuevo estado para el spinner
  const {
    videoRef,
    canvasRef,
    cameraOn,
    setCameraOn,
    cameraUnavailable,
    detections,
    handleImageUpload,
    startCamera,
    stopCamera,
  } = Objectron(ready);

  const toggleCamera = async () => {
    setLoading(true); // Mostrar spinner
    if (cameraOn) {
      stopCamera();
    } else {
      await startCamera();
    }
    setCameraOn(!cameraOn);
    setLoading(false); // Ocultar spinner
  };

  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/objectron/objectron.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />

      <Controles
        cameraOn={cameraOn}
        setCameraOn={toggleCamera} // Cambiar a la nueva función
        handleImageUpload={handleImageUpload}
      />

      <Canvas
        videoRef={videoRef}
        canvasRef={canvasRef}
        cameraUnavailable={cameraUnavailable}
        loading={loading} // Pasar el estado de carga al Canvas
      />

      <div
        style={{
          marginTop: '1rem',
          padding: '10px',
          borderBottom: '2px solid lime',
          height: '55px',
          overflowY: 'auto',
        }}
      >
        {detections.length === 0 ? (
          <p className='text-white'>⏳🫡☕ Buscando tazas...</p>
        ) : (
          <p className='text-white'>Detectada☕💯👍</p>
        )}
      </div>
    </div>
  );
};

export default PuraTaza;
