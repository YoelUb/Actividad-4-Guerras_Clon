import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

function ForceChangePassword({ token, onSuccess, username: initialUsername }) {
  const [username, setUsername] = useState(initialUsername || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/update-me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Error al actualizar las credenciales');
      }

      const data = await response.json();
      onSuccess(data.access_token); // Pasa el nuevo token a App.js

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '10px',
    fontSize: '1rem',
    fontFamily: 'Orbitron, sans-serif',
    borderRadius: '5px',
    border: '1px solid #49dafd',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div className="auth-container" style={{
      backgroundColor: 'rgba(62, 22, 22, 0.8)',
      border: '2px solid #ff3838',
      borderRadius: '10px',
      padding: '30px',
      width: '90%',
      maxWidth: '500px',
      backdropFilter: 'blur(5px)'
    }}>
      <h2>Actualización de Seguridad Requerida</h2>
      <p style={{fontSize: '1rem', color: '#eee'}}>
        Por ser tu primer inicio de sesión como administrador, debes actualizar tu nombre de usuario y contraseña.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <input
          type="text"
          placeholder="Nuevo Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />

        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nueva Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <span
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </span>
        </div>

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {error && <p className="error" style={{ cursor: 'default' }}>{error}</p>}
        <button type="submit" className="btn-elegir" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar y Continuar'}
        </button>
      </form>
    </div>
  );
}

export default ForceChangePassword;