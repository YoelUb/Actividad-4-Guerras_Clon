import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

function TournamentDashboard({ currentUser, token, onVolver, charToJoinWith, setCharToJoinWith }) {
    const [openTournaments, setOpenTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);



    const fetchOpenTournaments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/tournament/open`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar torneos');
            const data = await response.json();
            setOpenTournaments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchTournamentDetails = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/tournament/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar detalles del torneo');
            const data = await response.json();
            setSelectedTournament(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOpenTournaments();
    }, [fetchOpenTournaments]);

    const handleJoin = async (tournamentId) => {
        if (!charToJoinWith) {
            setError("Debes seleccionar un personaje desde la pantalla de mundos primero.");
            onVolver();
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/tournament/${tournamentId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ character_id: charToJoinWith.id }) // Usar el ID del personaje
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Error al unirse al torneo');

            setSelectedTournament(data);
            fetchOpenTournaments();
            setCharToJoinWith(null);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSimulate = async (matchId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/tournament/match/${matchId}/simulate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Error al simular el partido');

            fetchTournamentDetails(selectedTournament.id);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderTournamentList = () => (
        <div style={{width: '100%'}}>
            <h2>Torneos Abiertos (1 Jugador + 15 IA)</h2>
            <button className="btn-info" onClick={fetchOpenTournaments} disabled={loading}>
                Recargar Lista
            </button>

            {charToJoinWith && (
                <div style={{padding: '10px', margin: '20px 0', border: '1px solid #ffe81f', backgroundColor: 'rgba(255, 232, 31, 0.1)', borderRadius: '8px'}}>
                    <p style={{margin: 0}}>Personaje seleccionado: <strong style={{color: '#ffe81f'}}>{charToJoinWith.nombre}</strong></p>
                    <p style={{margin: '5px 0 0 0'}}>¡Elige un torneo para unirte y empezar!</p>
                </div>
            )}


            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                {loading && openTournaments.length === 0 && <p>Buscando torneos...</p>}
                {!loading && openTournaments.length === 0 && <p>No hay torneos abiertos. Pide a un admin que cree uno.</p>}

                {openTournaments.map(torneo => {
                    const isJoinedByHuman = torneo.participants.some(p => p.user !== null);

                    return (
                        <div key={torneo.id} style={{ border: '1px solid #49dafd', padding: '15px', borderRadius: '8px', width: '80%', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                            <h3>{torneo.name}</h3>
                            <p>Participantes: {torneo.participants.length} / 16</p>

                            {!isJoinedByHuman ? (
                                <button className="btn-elegir" onClick={() => handleJoin(torneo.id)} disabled={loading || !charToJoinWith}>
                                    {charToJoinWith ? 'Unirse y Empezar' : 'Elige personaje primero'}
                                </button>
                            ) : (
                                <p style={{color: '#ff3838'}}>Torneo Lleno</p>
                            )}

                            <button className="btn-info" onClick={() => fetchTournamentDetails(torneo.id)} disabled={loading}>
                                Ver Estado
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderBracket = () => {
        if (!selectedTournament) return null;

        const { matches } = selectedTournament;
        const rounds = { 1: [], 2: [], 3: [], 4: [] };
        matches.forEach(m => {
            if (rounds[m.round]) {
                rounds[m.round].push(m);
            }
        });

        const getPName = (p) => {
            if (!p) return '???';
            if (p.user && p.user.id === currentUser.id) {
                return <strong style={{color: '#ffe81f'}}>{p.user.username} ({p.character?.nombre || '...'})</strong>;
            }
            return p.ai_name ? `${p.ai_name} (${p.character?.nombre || '...'})` : `${p.user.username} (${p.character?.nombre || '...'})`;
        };

        return (
            <div style={{ display: 'flex', overflowX: 'auto', padding: '20px', gap: '30px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                {Object.keys(rounds).map(roundNum => (
                    <div key={roundNum} style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
                        <h2>
                            {roundNum === '1' ? 'Octavos' : roundNum === '2' ? 'Cuartos' : roundNum === '3' ? 'Semifinal' : 'FINAL'}
                        </h2>
                        {rounds[roundNum].sort((a,b) => a.match_index - b.match_index).map(match => (
                            <div key={match.id} style={{border: '1px solid #ffe81f', padding: '10px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '5px'}}>
                                <p style={{color: match.status === 'completed' ? '#888' : 'white', fontSize: '0.9rem', lineHeight: '1.6'}}>
                                    {getPName(match.player1)} <br/> vs <br/> {getPName(match.player2)}
                                </p>
                                {match.winner && <p style={{color: '#50c878', fontSize: '1rem'}}>Ganador: {getPName(match.winner)}</p>}

                                {match.status === 'pending' && match.player1 && match.player2 && (
                                    <button className="btn-elegir" onClick={() => handleSimulate(match.id)} disabled={loading}>
                                        Simular
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )
    };

    const renderTournamentDetails = () => (
        <div style={{width: '95%'}}>
            <button className="btn-volver" style={{alignSelf: 'flex-start'}} onClick={() => { setSelectedTournament(null); fetchOpenTournaments(); }}>
                Volver a la Lista
            </button>
            <h2>{selectedTournament.name}</h2>
            <p>Estado: {selectedTournament.status}</p>
            {selectedTournament.winner && <h3 style={{color: '#50c878'}}>Ganador del Torneo: {selectedTournament.winner.username}</h3>}
            {selectedTournament.status === 'completed' && !selectedTournament.winner && <h3 style={{color: '#50c878'}}>Ganador del Torneo: ¡Una IA!</h3>}


            <h3>Cuadro del Torneo</h3>
            {renderBracket()}

            <h3 style={{marginTop: '30px'}}>Participantes ({selectedTournament.participants.length} / 16)</h3>
            <div style={{textAlign: 'left', listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                {selectedTournament.participants.map(p => (
                    <span
                        key={p.id}
                        style={{
                            backgroundColor: p.user ? 'rgba(255, 232, 31, 0.3)' : 'rgba(255,255,255,0.1)',
                            border: p.user ? '1px solid #ffe81f' : '1px solid #555',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            color: p.user ? '#ffe81f' : 'white'
                        }}
                    >
                        {p.user ? p.user.username : p.ai_name} ({p.character?.nombre || p.character_id})
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button className="btn-volver" onClick={onVolver} style={{ position: 'absolute', top: 20, left: 20 }}>
                Volver a Mundos
            </button>
            <h1 style={{color: '#ffe81f'}}>Torneos</h1>
            {error && <p className="error" onClick={() => setError(null)}>{error}</p>}

            {loading && !selectedTournament && <p>Cargando...</p>}

            {selectedTournament ? renderTournamentDetails() : renderTournamentList()}
        </div>
    );
}

export default TournamentDashboard;