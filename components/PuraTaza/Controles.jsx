const Controles = ({ cameraOn, setCameraOn, handleImageUpload }) => {
  return (
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
  );
};

export default Controles;