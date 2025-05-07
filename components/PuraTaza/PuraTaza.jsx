'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const PuraTaza = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const objectronRef = useRef(null);
  const animationRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(true);
  const [detections, setDetections] = useState([]);

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    setDetections([]);
    setCameraUnavailable(true); // Mostrar ícono de cámara apagada
  };

  const drawBox = (ctx, landmarks) => {
    const BOX_CONNECTIONS = [
      [1, 2], [2, 4], [4, 3], [3, 1],
      [5, 6], [6, 8], [8, 7], [7, 5],
      [1, 5], [2, 6], [3, 7], [4, 8],
    ];
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 4;
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

  const drawResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || results.image.width === 0) return;

    canvas.width = results.image.width;
    canvas.height = results.image.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    const newDetections = [];
    if (results.objectDetections?.length) {
      results.objectDetections.forEach(obj => {
        const points2D = obj.keypoints.map(k => k.point2d);
        drawBox(ctx, points2D);
        drawPointNumbers(ctx, points2D);
        newDetections.push({ id: obj.id });
      });
    }

    setDetections(newDetections);
    setCameraUnavailable(false); // Ocultar ícono si hubo detección
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
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
      setCameraUnavailable(true);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !objectronRef.current) return;

    if (cameraOn) setCameraOn(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgElement = document.getElementById('inputImage');
      imgElement.src = e.target.result;

      imgElement.onload = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

        await objectronRef.current.send({ image: imgElement });
      };
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!ready) return;

    if (!objectronRef.current && window.Objectron) {
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
    }

    if (cameraOn) {
      startCamera().then(() => {
        const sendToObjectron = async () => {
          if (objectronRef.current && videoRef.current) {
            await objectronRef.current.send({ image: videoRef.current });
          }
          animationRef.current = requestAnimationFrame(sendToObjectron);
        };
        sendToObjectron();
      });
    } else {
      stopCamera();
    }
  }, [ready, cameraOn]);

  useEffect(() => {
    const updateCanvasStyle = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (window.innerWidth <= 480) {
        canvas.style.aspectRatio = '10 / 15';
        canvas.style.maxHeight = '375px';
        canvas.style.maxWidth = '600px';
      } else if (window.innerWidth <= 768) {
        canvas.style.aspectRatio = '9 / 16';
        canvas.style.maxHeight = '400px';
      } else {
        canvas.style.aspectRatio = '16 / 9';
        canvas.style.maxHeight = '500px';
      }
    };

    updateCanvasStyle();
    window.addEventListener('resize', updateCanvasStyle);
    return () => window.removeEventListener('resize', updateCanvasStyle);
  }, []);

  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/objectron/objectron.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />

      {/* Botones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '10px' }}>
        <button
          onClick={() => setCameraOn(prev => !prev)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: cameraOn ? 'darkred' : 'darkgreen',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {cameraOn ? '🛑 Apagar cámara' : '🎥 Encender cámara'}
        </button>

        <label
          htmlFor="upload"
          style={{
            backgroundColor: 'darkblue',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          📷 Subir foto
          <input
            type="file"
            id="upload"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <img
        id="inputImage"
        style={{ display: 'none' }}
        alt="uploaded"
        crossOrigin="anonymous"
      />

      <video
        ref={videoRef}
        style={{ width: '100%', display: 'none' }}
        playsInline
        muted
      />

      {/* Canvas con fondo gris e ícono */}
      <div style={{ position: 'relative' }}>
        {cameraUnavailable && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              maxHeight: '700px',
              backgroundColor: 'gray',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2,
            }}
          >
            <img
              src="/camara.png"
              alt="Cámara bloqueada"
              style={{ width: '80px', opacity: 0.5 }}
            />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            border: '1px solid lime',
            aspectRatio: '1 / 1',
            maxHeight: '700px',
            zIndex: 1,
          }}
        />
      </div>

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
