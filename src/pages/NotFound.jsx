import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div 
      className="container-lg my-5" 
      style={{ 
        maxWidth: '900px', 
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50' }}>
        404
      </h1>
      <p className="text-muted mb-4" style={{ fontSize: '1.2rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => navigate('/articles')}
        style={{ borderRadius: '6px' }}
      >
        ← Back to Articles
      </button>
    </div>
  );
}

export default NotFound;