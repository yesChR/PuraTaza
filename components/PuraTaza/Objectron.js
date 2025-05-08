import { useEffect, useRef, useState } from 'react';

const Objectron = (ready) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const objectronRef = useRef(null); 
  const animationRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(true);
  const [detections, setDetections] = useState([]);
  
  const BOX_CONNECTIONS = [
    [1, 2], [2, 4], [4, 3], [3, 1],
    [5, 6], [6, 8], [8, 7], [7, 5],
    [1, 5], [2, 6], [3, 7], [4, 8],
  ];

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    setDetections([]);
    setCameraUnavailable(true);
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
      const imgElement = new Image();
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

      objectronRef.current.onResults((results) => {
        const canvas = canvasRef.current;//nos traemos el canvas
        const ctx = canvas?.getContext('2d');//ctx es el contexto del canvas(obtiene coordenadas del canva)
        if (!canvas || !ctx || results.image.width === 0) return;

        canvas.width = results.image.width;
        canvas.height = results.image.height;
        //limpiar el canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        //dibuja los puntos de referencia
        const newDetections = [];
        if (results.objectDetections?.length) {
          results.objectDetections.forEach(obj => {
            const points2D = obj.keypoints.map(k => k.point2d);
            drawBox(ctx, points2D);//dibuja la caja
            drawPointNumbers(ctx, points2D);//coloca los números
            newDetections.push({ id: obj.id });
          });
        }

        setDetections(newDetections);
        setCameraUnavailable(false);
      });
    }

      //para enviar el video al objectron
    if (cameraOn) {
      startCamera().then(() => {
        const sendToObjectron = async () => {
          if (objectronRef.current && videoRef.current) {
            await objectronRef.current.send({ image: videoRef.current });
          }
          animationRef.current = requestAnimationFrame(sendToObjectron);//propia del video
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

  const drawBox = (ctx, landmarks) => {
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 4;
    for (const [startIdx, endIdx] of BOX_CONNECTIONS) {
      //en start tenemos las coordenadas de los puntos
      const start = landmarks[startIdx];//punto donde se inicia la línea
      const end = landmarks[endIdx];//punto donde termina la línea

      // Convertir las coordenadas normalizadas a píxeles
      const x1 = start.x * canvasRef.current.width;
      const y1 = start.y * canvasRef.current.height;
      const x2 = end.x * canvasRef.current.width;
      const y2 = end.y * canvasRef.current.height;
      //realiza el trazo
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawPointNumbers = (ctx, landmarks) => {
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    //idx es el # del punto
    landmarks.forEach((pt, idx) => {
      const x = pt.x * canvasRef.current.width;
      const y = pt.y * canvasRef.current.height;
      ctx.fillText(idx.toString(), x + 5, y - 5);
    });
  };

  return {
    videoRef,
    canvasRef,
    cameraOn,
    setCameraOn,
    cameraUnavailable,
    detections,
    handleImageUpload,
    startCamera,
    stopCamera,
  };
};

export default Objectron;