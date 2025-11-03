import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

function CreateTournament({ token, onTournamentCreated }) {
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!name) {
            setError('Por favor, dale un nombre al torneo.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tournament/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Error al crear el torneo');
            }

            // Éxito
            setMessage(`¡Torneo "${data.name}" creado! Ahora puedes unirte.`);
            setName(''); // Limpiar el campo
            onTournamentCreated(); // ¡Llama al callback para refrescar la lista!

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = { padding: '10px', fontSize: '1rem', fontFamily: 'Orbitron, sans-serif', borderRadius: '5px', border: '1px solid #49dafd', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{
            border: '1px solid #ffe81f',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '20px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '500px',
            margin: '20px 0'
        }}>
            <h3 style={{ marginTop: 0 }}>Crear un Nuevo Torneo</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="text"
                    placeholder="Nombre del Torneo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                />
                <button type="submit" className="btn-elegir" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear'}
                </button>
                {error && <p className="error" style={{ cursor: 'default' }}>{error}</p>}
                {message && <p style={{ color: '#50c878' }}>{message}</p>}
            </form>
        </div>
    );
}

export default CreateTournament;