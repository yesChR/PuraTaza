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

    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    };

    const initObjectron = async () => {
      if (!window.Objectron) {
        console.error('Objectron no está disponible.');
        return;
      }

      objectronRef.current = new window.Objectron({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/objectron/${file}`,
      });

      objectronRef.current.setOptions({
        modelName: 'Cup',          // Modelo: Cup
        maxNumObjects: 1,           // Detecta solo 1 objeto
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.99,
      });

      objectronRef.current.onResults(drawResults);

      await startCamera();

      const sendToObjectron = async () => {
        if (objectronRef.current && videoRef.current) {
          await objectronRef.current.send({ image: videoRef.current });
        }
        requestAnimationFrame(sendToObjectron);
      };

      sendToObjectron();
    };

    const drawResults = (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      canvas.width = results.image.width;
      canvas.height = results.image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.objectDetections?.length) {
        results.objectDetections.forEach(obj => {
          ctx.strokeStyle = 'lime';
          ctx.lineWidth = 2;
          ctx.beginPath();
          obj.keypoints.forEach((kp, index) => {
            const x = kp.point2d.x * canvas.width;
            const y = kp.point2d.y * canvas.height;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.stroke();
        });
      }
    };

    initObjectron();
  }, [ready]);

  return (
    <div>
      {/* Cargar MediaPipe Objectron desde CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/objectron/objectron.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />

      {/* Video de entrada */}
      <video
        ref={videoRef}
        style={{ width: '100%', display: 'none' }} // Oculto para solo ver el canvas
        playsInline
        muted
      />

      {/* Canvas para mostrar los resultados */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', border: '1px solid lime' }}
      />
    </div>
  );
};

export default PuraTaza;
