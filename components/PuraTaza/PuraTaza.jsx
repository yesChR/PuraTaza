'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const PuraTaza = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const objectronRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    if (!ready) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          {
            video: {
              width: 1280,
              height: 720,
              facingMode: { ideal: 'environment' },
            },
          });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('❌ Error iniciando la cámara:', err);
      }
    };

    const initObjectron = async () => {
      if (!window.Objectron) {
        console.error('Objectron no disponible.');
        return;
      }

      objectronRef.current = new window.Objectron({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/objectron/${file}`,
      });

      objectronRef.current.setOptions({
        modelName: 'Cup',
        maxNumObjects: 2,
        selfieMode: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.4,
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

      if (results.image.width === 0 || results.image.height === 0) return;

      canvas.width = results.image.width;
      canvas.height = results.image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      const newDetections = [];

      if (results.objectDetections?.length) {
        console.log("Aqui entra", results.objectDetections); // ✅ Puntos 2D en la consola
        results.objectDetections.forEach(obj => {
          const points2D = obj.keypoints.map(k => k.point2d);
          drawBox(ctx, points2D); // Dibujar el cubo
          drawPointNumbers(ctx, points2D); // Dibujar números de puntos en el canvas

          newDetections.push({
            id: obj.id,
          });
        });
      }

      setDetections(newDetections);
    };

    const drawBox = (ctx, landmarks) => {
      const BOX_CONNECTIONS = [
        [1, 2], [2, 4], [4, 3], [3, 1], // Trasero
        [5, 6], [6, 8], [8, 7], [7, 5], // Delantero
        [1, 5], [2, 6], [3, 7], [4, 8], // Laterales
      ];
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 4; // Grosor del trazo más ancho
      for (const [startIdx, endIdx] of BOX_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        const x1 = start.x * canvasRef.current.width;
        const y1 = start.y * canvasRef.current.height;
        const x2 = end.x * canvasRef.current.width;
        const y2 = end.y * canvasRef.current.height;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawPointNumbers = (ctx, landmarks) => {
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      landmarks.forEach((pt, idx) => {
        const x = pt.x * canvasRef.current.width;
        const y = pt.y * canvasRef.current.height;
        ctx.fillText(idx.toString(), x + 5, y - 5);
      });
    };

    initObjectron();
  }, [ready]);

  useEffect(() => {
    const updateCanvasStyle = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (window.innerWidth <= 480) {
        // Pantallas muy pequeñas
        canvas.style.aspectRatio = '11 / 16';
        canvas.style.maxHeight = '400px';
        canvas.style.maxWidth = '600px';
      } else if (window.innerWidth <= 768) {
        // Pantallas pequeñas
        canvas.style.aspectRatio = '9 / 16';
        canvas.style.maxHeight = '400px';
      } else {
        // Pantallas grandes
        canvas.style.aspectRatio = '16 / 9';
        canvas.style.maxHeight = '500px';
      }
    };

    // Ejecutar al cargar y al redimensionar la ventana
    updateCanvasStyle();
    window.addEventListener('resize', updateCanvasStyle);

    return () => {
      window.removeEventListener('resize', updateCanvasStyle);
    };
  }, []);

  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/objectron/objectron.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />

      <video
        ref={videoRef}
        style={{ width: '100%', display: 'none' }}
        playsInline
        muted
      />

      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          border: '1px solid lime',
          aspectRatio: '1 / 1', // Mantener proporción 16:9
          maxHeight: '700px', // Limitar la altura máxima
        }}
      />

      <div
        style={{
          marginTop: '1rem',
          padding: '10px',
          borderBottom: '2px solid lime',
          height: '55px', // Altura fija
          overflowY: 'auto', // Habilitar desplazamiento si el contenido excede la altura
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
