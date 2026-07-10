export default function AuthLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FDF5EE',
        zIndex: 9999,
      }}
    >
      {/* Brand */}
      <p
        style={{
          fontFamily: 'var(--font-sooner, serif)',
          fontSize: '1.6rem',
          letterSpacing: '0.05em',
          textTransform: 'lowercase',
          color: '#2a2019',
          opacity: 0.8,
          marginBottom: '2rem',
        }}
      >
        faceyoguez
      </p>

      {/* Minimal spinner — CSS only, no JS */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '2.5px solid rgba(231,111,81,0.2)',
          borderTopColor: '#e76f51',
          animation: 'spin 0.7s linear infinite',
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
