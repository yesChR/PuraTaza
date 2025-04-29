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
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

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
        modelName: 'Cup',
        maxNumObjects: 2,
        selfieMode: false,
        minDetectionConfidence: 0.2,
        minTrackingConfidence: 0.5,
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

      const newDetections = [];

      if (results.objectDetections?.length) {
        results.objectDetections.forEach(obj => {
          const points2D = obj.keypoints.map(k => k.point2d);
          drawBox(ctx, points2D);
          drawAxes(ctx, points2D);

          // ✅ Mostrar confianza en canvas
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

    const drawAxes = (ctx, landmarks) => {
      const CENTER = 0;
      const xEnd = midpoint(landmarks[1], landmarks[2]); // Eje X (derecha)
      const yEnd = midpoint(landmarks[3], landmarks[2]); // Eje Y (arriba)
      const zEnd = midpoint(landmarks[0], landmarks[4]); // Eje Z (profundidad)

      drawArrow(ctx, landmarks[CENTER], xEnd, 'red');   // X
      drawArrow(ctx, landmarks[CENTER], yEnd, 'green'); // Y
      drawArrow(ctx, landmarks[CENTER], zEnd, 'blue');  // Z
    };

    const midpoint = (a, b) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });

    const drawArrow = (ctx, from, to, color) => {
      const x1 = from.x * canvasRef.current.width;
      const y1 = from.y * canvasRef.current.height;
      const x2 = to.x * canvasRef.current.width;
      const y2 = to.y * canvasRef.current.height;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
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

      <div style={{ marginTop: '1rem', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h4>Objetos detectados</h4>
        {detections.length === 0 ? (
          <p>⏳ Buscando objetos...</p>
        ) : (
          detections.map((det, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <strong>Objeto #{det.id}</strong> — Confianza:
              <span style={{ color: det.visibility > 0.8 ? 'green' : 'orange' }}>
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
