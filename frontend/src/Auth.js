import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [registerStage, setRegisterStage] = useState('form'); // 'form' o 'verify'
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (isLogin) {
      try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Error al iniciar sesión');
        }
        const data = await response.json();
        onLoginSuccess(data.access_token);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (registerStage === 'form') {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail || 'Error al solicitar el registro');
          }

          setMessage(data.message);
          setRegisterStage('verify');
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail || 'Error al verificar el código');
          }

          onLoginSuccess(data.access_token); // ¡Login exitoso!
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Reiniciar todo al cambiar de modo
    setUsername('');
    setPassword('');
    setEmail('');
    setCode('');
    setError(null);
    setMessage(null);
    setLoading(false);
    setRegisterStage('form');
  };

  const inputStyle = { padding: '10px', fontSize: '1rem', fontFamily: 'Orbitron, sans-serif', borderRadius: '5px', border: '1px solid #49dafd', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', width: '100%', boxSizing: 'border-box' };

  const renderRegisterForm = () => {
    if (registerStage === 'form') {
      return (
        <>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
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
        </>
      );
    }

    if (registerStage === 'verify') {
      return (
        <>
          <p style={{fontSize: '0.9rem', color: '#eee'}}>
            Introduce el código enviado a <strong>{email}</strong>
          </p>
          <input
            type="text"
            placeholder="Código de Verificación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            style={inputStyle}
          />
        </>
      );
    }
  };

  const getButtonText = () => {
    if (loading) return "Cargando...";
    if (isLogin) return "Entrar";
    if (registerStage === 'form') return "Enviar Código";
    return "Verificar y Crear Cuenta";
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
      <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

        {isLogin ? (
          <>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
            />
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
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
          </>
        ) : (
          renderRegisterForm()
        )}

        {error && <p className="error" style={{ cursor: 'default' }}>{error}</p>}
        {message && <p style={{ cursor: 'default', color: '#50c878' }}>{message}</p>}

        <button type="submit" className="btn-elegir" disabled={loading}>
          {getButtonText()}
        </button>
      </form>

      <p style={{ marginTop: '15px', color: '#61dafb', cursor: 'pointer', fontSize: '0.9rem' }} onClick={toggleMode}>
        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </p>
    </div>
  );
}

export default Auth;