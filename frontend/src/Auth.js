import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const url = isLogin
      ? `${API_BASE_URL}/auth/token`
      : `${API_BASE_URL}/auth/register`;

    try {
      let response;
      if (isLogin) {

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Error al procesar la solicitud');
      }

      const data = await response.json();
      onLoginSuccess(data.access_token);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container" style={{
      backgroundColor: 'rgba(22, 33, 62, 0.8)',
      border: '2px solid #ffe81f',
      borderRadius: '10px',
      padding: '30px',
      width: '90%',
      maxWidth: '450px',
      backdropFilter: 'blur(5px)'
    }}>
      <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '1rem', fontFamily: 'Orbitron, sans-serif', borderRadius: '5px', border: '1px solid #49dafd', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '1rem', fontFamily: 'Orbitron, sans-serif', borderRadius: '5px', border: '1px solid #49dafd', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
        />
        {error && <p className="error" style={{ cursor: 'default' }}>{error}</p>}
        <button type="submit" className="btn-elegir">
          {isLogin ? 'Entrar' : 'Crear Cuenta'}
        </button>
      </form>
      <p style={{ marginTop: '15px', color: '#61dafb', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </p>
    </div>
  );
}

export default Auth;