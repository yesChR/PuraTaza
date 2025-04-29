'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const PuraTaza = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const objectronRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error al acceder a la cámara:', error);
      }
    }

    async function initObjectron() {
      if (!window.Objectron) {
        console.error('Objectron no está disponible. Asegúrate de que el script se haya cargado correctamente.');
        return;
      }

      objectronRef.current = new window.Objectron({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/objectron/${file}`
      });

      objectronRef.current.setOptions({
        modelName: 'Cup',
        maxNumObjects: 1,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.99
      });
      console.log('✅ Modelo configurado como Cup');

      objectronRef.current.onResults(onResults);

      await startCamera();

      const sendToObjectron = async () => {
        if (objectronRef.current && videoRef.current) {
          await objectronRef.current.send({ image: videoRef.current });
        }
        requestAnimationFrame(sendToObjectron);
      };

      sendToObjectron();
    }

    function onResults(results) {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.detectedObjects && results.detectedObjects.length > 0) {
        console.log(`✅ ¡Objeto detectado! Se detectaron ${results.detectedObjects.length} objeto(s).`);
        for (const detectedObject of results.detectedObjects) {
          drawBox(ctx, detectedObject.landmarks_2d);
        }
      } else {
        console.log('❌ No se detectó ningún objeto.');
      }
    }

    function drawBox(ctx, landmarks) {
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const landmark of landmarks) {
        ctx.lineTo(landmark.x * canvasRef.current.width, landmark.y * canvasRef.current.height);
      }
      ctx.closePath();
      ctx.stroke();
    }

    initObjectron();
  }, [ready]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Carga el script de Objectron */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/objectron/objectron.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      {/* Video oculto */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline></video>
      {/* Canvas para dibujar detecciones */}
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />
    </div>
  );
};

export default PuraTaza;