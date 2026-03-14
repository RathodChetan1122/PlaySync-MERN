export default function Loader() {
  return (
    <div style={styles.container}>
      <div className="spinner" />
      <style>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 5px solid #2e2e3e;
          border-top: 5px solid #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#1e1e2e',
  },
};