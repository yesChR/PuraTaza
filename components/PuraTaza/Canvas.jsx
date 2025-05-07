const Canvas = ({ videoRef, canvasRef, cameraUnavailable, loading }) => {
  return (
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
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid lime',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}
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
          aspectRatio: '1 / 1',
          maxHeight: '700px',
          zIndex: 1,
        }}
      />
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Canvas;