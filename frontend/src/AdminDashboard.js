import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

function AdminDashboard({ user, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('starwars_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Cargar Logs
        const logsResponse = await fetch(`${API_BASE_URL}/admin/logs`, { headers });
        if (!logsResponse.ok) throw new Error('Error al cargar logs');
        const logsData = await logsResponse.json();
        setLogs(logsData);

        // Cargar Stats
        const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
        if (!statsResponse.ok) throw new Error('Error al cargar estadísticas');
        const statsData = await statsResponse.json();
        setStats(statsData);

      } catch (err) {
        setError(err.message);
      }
    };

    if (token) {
        fetchData();
    }
  }, [token]);

  return (
    <div style={{ width: '90%', maxWidth: '1000px', color: 'white' }}>
      <button
        className="btn-volver"
        onClick={onLogout}
        style={{position: 'absolute', top: 20, right: 20}}
      >
        Salir (Admin)
      </button>

      <h1>Panel de Administrador</h1>
      <h3>Bienvenido, {user.username}</h3>
      {error && <p className="error">{error}</p>}

      <h2>Estadísticas</h2>
      {stats ? (
        <ul style={{textAlign: 'left', fontSize: '1.2rem'}}>
          <li>Usuarios Totales: {stats.total_users}</li>
          <li>Eventos de Auditoría: {stats.total_audit_logs}</li>
          <li><a href="http://localhost:8000/metrics" target="_blank" rel="noopener noreferrer">Ver Métricas de Prometheus</a></li>
        </ul>
      ) : <p>Cargando estadísticas...</p>}

      <h2>Registros de Auditoría</h2>
      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #49dafd', padding: '10px', backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{border: '1px solid #49dafd', padding: '5px'}}>Fecha</th>
              <th style={{border: '1px solid #49dafd', padding: '5px'}}>Usuario</th>
              <th style={{border: '1px solid #49dafd', padding: '5px'}}>Acción</th>
              <th style={{border: '1px solid #49dafd', padding: '5px'}}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{border: '1px solid #49dafd', padding: '5px'}}>{new Date(log.timestamp).toLocaleString()}</td>
                <td style={{border: '1px solid #49dafd', padding: '5px'}}>{log.username}</td>
                <td style={{border: '1px solid #49dafd', padding: '5px'}}>{log.action}</td>
                <td style={{border: '1px solid #49dafd', padding: '5px'}}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;