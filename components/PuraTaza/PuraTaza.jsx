'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const PuraTaza = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const objectronRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [detections, setDetections] = useState([]);

  const BOX_CONNECTIONS = [
    [0, 1], [1, 5], [5, 4], [4, 0],
    [2, 3], [3, 7], [7, 6], [6, 2],
    [0, 2], [1, 3], [5, 7], [4, 6],
  ];

  useEffect(() => {
    if (!ready) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
        minTrackingConfidence: 0.8,
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
        console.log(results.objectDetections); // ✅ Puntos 2D en la consola
        results.objectDetections.forEach(obj => {
          const points2D = obj.keypoints.map(k => k.point2d);



          drawBox(ctx, points2D);
          drawPointNumbers(ctx, points2D); // ✅ Números de puntos en el canvas

          // Mostrar confianza
          const cx = points2D[0].x * canvas.width;
          const cy = points2D[0].y * canvas.height - 10;
          const vis = (obj.visibility * 100).toFixed(1) + '%';
          ctx.fillStyle = obj.visibility > 0.8 ? 'green' : 'orange';
          ctx.font = '14px sans-serif';
          ctx.fillText(`Confianza: ${vis}`, cx, cy);

          newDetections.push({
            id: obj.id,
            visibility: obj.visibility,
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
      ctx.lineWidth = 2;
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
      ctx.font = '10px sans-serif';
      landmarks.forEach((pt, idx) => {
        const x = pt.x * canvasRef.current.width;
        const y = pt.y * canvasRef.current.height;
        ctx.fillText(idx.toString(), x + 5, y - 5);
      });
    };

    initObjectron();
  }, [ready]);

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
        style={{ width: '100%', height: 'auto', border: '1px solid lime' }}
      />

      <div
        style={{
          marginTop: '1rem',
          padding: '10px',
          borderBottom: '2px solid lime',
          
        }}
      >
        {detections.length === 0 ? (
          <p className='text-white'>⏳🫡☕ Buscando tazas...</p>
        ) : (
          detections.map((det, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <strong>Objeto #{det.id}</strong> — Confianza:
              <span
                style={{
                  color: det.visibility > 0.8 ? 'green' : 'orange',
                }}
              >
                {' '}{(det.visibility * 100).toFixed(1)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PuraTaza;
