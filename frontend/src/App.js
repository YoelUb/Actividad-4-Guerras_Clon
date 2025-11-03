import React, {useState, useEffect, useRef, useCallback} from 'react';
import './App.css';
import './index.css';
import ForceChangePassword from './ForceChangePassword';
import Auth from './Auth';
import AdminDashboard from './AdminDashboard';
import TournamentDashboard from './TournamentDashboard';

const API_BASE_URL = 'http://localhost:8000/api';
const GAME_API_URL = 'http://localhost:8000/api/guerras-clon';

function App() {
    const [mundos, setMundos] = useState([]);
    const [mundoSeleccionado, setMundoSeleccionado] = useState(null);
    const [personajes, setPersonajes] = useState({heroes: [], villanos: []});
    const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null);
    const [mostrarInfo, setMostrarInfo] = useState(false);
    const [estadoBatalla, setEstadoBatalla] = useState(null);
    const [enBatalla, setEnBatalla] = useState(false);
    const audioRef = useRef(null);
    const [introVisto, setIntroVisto] = useState(false);
    const [token, setToken] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [appLoading, setAppLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vistaActual, setVistaActual] = useState('mundos'); // 'mundos', 'torneo'
    const [charToJoinWith, setCharToJoinWith] = useState(null); // Personaje para unirse al torneo
    const [mostrarLeaderboard, setMostrarLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('starwars_token');
        if (storedToken) {
            setToken(storedToken);
        }
        setAppLoading(false);
    }, []);

    const handleLogout = useCallback(() => {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('starwars_token');

        setMundoSeleccionado(null);
        setPersonajes({heroes: [], villanos: []});
        setPersonajeSeleccionado(null);
        setMostrarInfo(false);
        setEstadoBatalla(null);
        setEnBatalla(false);
        setError(null);
        setIntroVisto(false);
        setVistaActual('mundos'); // Resetear vista
        setMostrarLeaderboard(false);
    }, []);

    useEffect(() => {
        if (!token) {
            setCurrentUser(null);
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: {'Authorization': `Bearer ${token}`}
                });
                if (response.status === 401) {
                    throw new Error("Token inválido o expirado");
                }
                if (!response.ok) {
                    throw new Error("Error al obtener datos del usuario");
                }
                const userData = await response.json();
                setCurrentUser(userData);
            } catch (err) {
                console.error(err);
                handleLogout();
            }
        };

        fetchUser();
    }, [token, handleLogout]);

    useEffect(() => {
        if (token && currentUser && currentUser.role === 'jugador' && vistaActual === 'mundos') {
            fetch(`${GAME_API_URL}/mundos`, {
                headers: {'Authorization': `Bearer ${token}`}
            })
                .then(response => {
                    if (response.status === 401) handleLogout();
                    if (!response.ok) {
                        throw new Error(`Error HTTP: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => setMundos(data))
                .catch(err => {
                    console.error("Error fetching mundos:", err);
                    setError(`Failed to fetch mundos. Is the backend running?`);
                });
        }
    }, [token, currentUser, handleLogout, vistaActual]);

    const handleLoginSuccess = (newToken) => {
        setToken(newToken);
        localStorage.setItem('starwars_token', newToken);
    };

    const handleCredentialsUpdated = (newToken) => {
        setToken(newToken);
        localStorage.setItem('starwars_token', newToken);
    };

    const handleEmpezarIntro = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Error al reproducir audio:", e));
            audioRef.current.volume = 0.3;
        }
        setIntroVisto(true);
    };

    const handleMundoClick = (mundo) => {
        setMundoSeleccionado(mundo);
        setPersonajeSeleccionado(null);
        setMostrarInfo(false);
        setError(null);

        fetch(`${GAME_API_URL}/mundos/${mundo.id}/personajes`, {
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(response => {
                if (response.status === 401) handleLogout();
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                return response.json();
            })
            .then(data => setPersonajes(data))
            .catch(err => {
                console.error("Error fetching personajes:", err);
                setError(`Failed to fetch personajes.`);
            });
    };

    const handlePersonajeClick = (personaje) => {
        setPersonajeSeleccionado(personaje);
        setMostrarInfo(false);
        setError(null);
    };

    const handleVolverMundos = () => {
        setMundoSeleccionado(null);
        setPersonajes({heroes: [], villanos: []});
        setPersonajeSeleccionado(null);
        setMostrarInfo(false);
        setEstadoBatalla(null);
        setEnBatalla(false);
        setError(null);
    };


    const handleIniciarBatalla = () => {
        if (!personajeSeleccionado || !mundoSeleccionado) return;
        setError(null);

        fetch(`${GAME_API_URL}/batalla/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                mundo_id: mundoSeleccionado.id,
                jugador_id: personajeSeleccionado.id,
            }),
        })
            .then(response => {
                if (response.status === 401) handleLogout();
                if (!response.ok) throw new Error(`Failed to fetch`);
                return response.json();
            })
            .then(data => {
                setEstadoBatalla(data);
                setEnBatalla(true);
                setPersonajeSeleccionado(null);
                setMundoSeleccionado(null);
            })
            .catch(err => {
                console.error("Error starting battle:", err);
                setError(`Failed to start battle.`);
            });
    };

    const handleJoinTournament = () => {
        if (!personajeSeleccionado) return;
        setCharToJoinWith(personajeSeleccionado);
        setVistaActual('torneo');
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/tournament/leaderboard`, {
                headers: {'Authorization': `Bearer ${token}`}
            });
            if (!response.ok) throw new Error('Error al cargar el leaderboard');
            const data = await response.json();
            setLeaderboardData(data);
            setMostrarLeaderboard(true); // Mostrar el modal
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };


    const handleAccionBatalla = (tipo_accion) => {
        if (!estadoBatalla || estadoBatalla.terminada) return;
        setError(null);

        if (tipo_accion === 'ataque_especial' && estadoBatalla.jugador.especial_usado) {
            setError("Ya has usado tu ataque especial.");
            return;
        }

        fetch(`${GAME_API_URL}/batalla/accion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id_batalla: estadoBatalla.id_batalla,
                tipo_accion: tipo_accion,
            }),
        })
            .then(response => {
                if (response.status === 401) handleLogout();
                if (!response.ok) throw new Error(`Failed to fetch`);
                return response.json();
            })
            .then(data => {
                setEstadoBatalla(data);
            })
            .catch(err => {
                console.error("Error taking action:", err);
                setError(`Failed to take action.`);
            });
    };

    const handleSalirBatalla = () => {
        handleVolverMundos();
    };

    const renderIntro = () => (
        <div className="intro-container">
            <div className="crawl-fade"></div>
            <div className="crawl">
                <div className="crawl-content">
                    <p>Hace mucho tiempo, en una galaxia muy, muy lejana....</p>
                    <br/>
                    <h1>GUERRAS CLON</h1>
                    <br/>
                    <p>La galaxia está en guerra. El malvado IMPERIO GALÁCTICO ha extendido su tiranía, pero valientes
                        héroes de la ALIANZA REBELDE se alzan para luchar por la libertad.</p>
                    <p>Desde los desiertos de TATOOINE hasta los bosques de ENDOR, la batalla por el destino de la
                        galaxia se libra en todos los frentes.</p>
                    <p>Ahora, debes elegir tu bando y tu campeón. Elige un mundo, selecciona a tu luchador y prepárate
                        para la batalla final...</p>
                </div>
            </div>
            <button className="btn-empezar" onClick={handleEmpezarIntro}>
                Empezar
            </button>
        </div>
    );

    const renderInfoPersonaje = () => {
        if (!personajeSeleccionado) return null;
        return (
            <div className="info-personaje">
                <img
                    src={personajeSeleccionado.imagen}
                    alt={personajeSeleccionado.nombre}
                    className="img-personaje-grande"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                <h3>{personajeSeleccionado.nombre}</h3>
                {mostrarInfo && (
                    <div className="stats">
                        <p><strong>Daño:</strong> {personajeSeleccionado.info.daño}</p>
                        <p><strong>Defensa:</strong> {personajeSeleccionado.info.defensa}</p>
                        <p><strong>Ataque Especial:</strong> {personajeSeleccionado.info.ataque_especial}</p>
                    </div>
                )}
                <div className="botones-accion">
                    <button className="btn-elegir" onClick={handleIniciarBatalla}>Elegir (1v1)</button>
                    <button
                        className="btn-info"
                        style={{backgroundColor: '#ffe81f', color: '#1a1a2e'}}
                        onClick={handleJoinTournament}
                    >
                        Torneo
                    </button>
                    <button className="btn-info" onClick={() => setMostrarInfo(!mostrarInfo)}>
                        {mostrarInfo ? 'Ocultar Info' : 'Info'}
                    </button>
                </div>
                <button className="btn-volver" onClick={() => setPersonajeSeleccionado(null)}>
                    Volver a Personajes
                </button>
            </div>
        );
    };

    const renderPersonajes = () => {
        if (!mundoSeleccionado) return null;
        return (
            <div className="vista-personajes">
                <h2>{mundoSeleccionado.nombre}</h2>
                <div className="listas-personajes">
                    <div className="columna-personajes">
                        <h3 className="heroe">Héroes</h3>
                        {personajes.heroes.map(heroe => (
                            <div key={heroe.id} className="card-personaje heroe"
                                 onClick={() => handlePersonajeClick(heroe)}>
                                <img
                                    src={heroe.imagen}
                                    alt={heroe.nombre}
                                    className="img-personaje-peq"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                {heroe.nombre}
                            </div>
                        ))}
                    </div>
                    <div className="columna-personajes">
                        <h3 className="villano">Villanos</h3>
                        {personajes.villanos.map(villano => (
                            <div key={villano.id} className="card-personaje villano"
                                 onClick={() => handlePersonajeClick(villano)}>
                                <img
                                    src={villano.imagen}
                                    alt={villano.nombre}
                                    className="img-personaje-peq"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                {villano.nombre}
                            </div>
                        ))}
                    </div>
                </div>
                <button className="btn-volver" onClick={handleVolverMundos}>Volver a Mundos</button>
            </div>
        );
    };

    const renderMundos = () => {
        return (
            <div className="vista-mundos">
                <button
                    className="btn-info"
                    onClick={() => setVistaActual('torneo')}
                    style={{position: 'absolute', top: 20, left: 20}}
                >
                    Ir a Torneos
                </button>
                <h2>Elige un Mundo, {currentUser?.username || 'soldado'}</h2>
                <div className="lista-mundos">
                    {mundos.map(mundo => (
                        <div key={mundo.id} className="card-mundo" onClick={() => handleMundoClick(mundo)}>
                            <img
                                src={mundo.imagen}
                                alt={mundo.nombre}
                                className="img-mundo"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                            <span>{mundo.nombre}</span>
                        </div>
                    ))}
                </div>
                <div style={{marginTop: '30px'}}>
                    <button
                        className="btn-info"
                        style={{backgroundColor: '#ffe81f', color: '#1a1a2e'}}
                        onClick={fetchLeaderboard}
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : 'Ver Ganadores de Torneos'}
                    </button>
                </div>
            </div>
        );
    };

    const renderLeaderboardModal = () => {
        if (!mostrarLeaderboard) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 100
            }}>
                <div style={{
                    backgroundColor: '#1a1a2e', border: '2px solid #ffe81f',
                    borderRadius: '10px', padding: '30px', width: '90%',
                    maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto'
                }}>
                    <h2 style={{color: '#ffe81f'}}>Salón de la Fama</h2>

                    {leaderboardData.length > 0 ? (
                        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '1rem', marginTop: '20px'}}>
                            <thead>
                            <tr>
                                <th style={{border: '1px solid #49dafd', padding: '8px'}}>Pos.</th>
                                <th style={{border: '1px solid #49dafd', padding: '8px'}}>Ganador</th>
                                <th style={{border: '1px solid #49dafd', padding: '8px'}}>Torneo</th>
                                <th style={{border: '1px solid #49dafd', padding: '8px'}}>Tiempo</th>
                            </tr>
                            </thead>
                            <tbody>
                            {leaderboardData.map((entry, index) => (
                                <tr key={index}>
                                    <td style={{
                                        border: '1px solid #49dafd',
                                        padding: '8px',
                                        textAlign: 'center'
                                    }}>{index + 1}</td>
                                    <td style={{border: '1px solid #49dafd', padding: '8px'}}>{entry.winner_name}</td>
                                    <td style={{
                                        border: '1px solid #49dafd',
                                        padding: '8px'
                                    }}>{entry.tournament_name}</td>
                                    <td style={{border: '1px solid #49dafd', padding: '8px', textAlign: 'center'}}>
                                        {formatDuration(entry.duration_seconds)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Aún no hay ganadores registrados. ¡Sé el primero!</p>
                    )}

                    <button className="btn-volver" style={{marginTop: '20px'}}
                            onClick={() => setMostrarLeaderboard(false)}>
                        Cerrar
                    </button>
                </div>
            </div>
        );
    };


    const renderBatalla = () => {
        if (!enBatalla || !estadoBatalla) return null;

        const {jugador, oponente, log_batalla, terminada} = estadoBatalla;

        const LuchadorCard = ({luchador, esJugador}) => {
            const esBajoHp = luchador.hp_actual < 100;
            const estaDerrotado = luchador.hp_actual <= 0;
            const containerClasses = ['luchador-imagen-container', esJugador ? 'jugador' : 'oponente', esBajoHp ? 'bajo-hp' : '', estaDerrotado ? 'derrotado' : ''].join(' ');
            const hpRatio = luchador.hp_actual / luchador.personaje.info.defensa;
            const hpClass = hpRatio > 0.5 ? 'alta' : hpRatio > 0.25 ? 'media' : 'baja';

            return (
                <div className="luchador-card-wrapper">
                    <div className={containerClasses}>
                        <img src={luchador.personaje.imagen} alt={luchador.personaje.nombre} onError={(e) => {
                            e.target.style.display = 'none';
                        }}/>
                        <div className="luchador-imagen-overlay"></div>
                    </div>
                    <h3>{luchador.personaje.nombre}</h3>
                    <div className="barra-vida-exterior">
                        <div
                            className={`barra-vida-interior ${hpClass}`}
                            style={{width: `${Math.max(0, hpRatio * 100)}%`}}
                        ></div>
                    </div>
                    <p style={{marginTop: '5px', fontSize: '1rem'}}>
                        HP: {luchador.hp_actual} / {luchador.personaje.info.defensa}
                    </p>
                </div>
            );
        };

        const getLogColorClass = (linea) => {
            const nombreJugador = jugador.personaje.nombre;
            const nombreOponente = oponente.personaje.nombre;
            if (linea.startsWith('¡')) return 'log-sistema';
            if (linea.includes('esquivado')) return 'log-esquivo';
            if (linea.startsWith(nombreJugador)) return 'log-jugador';
            if (linea.startsWith(nombreOponente)) return 'log-oponente';
            return 'log-default';
        };

        return (
            <div className="vista-batalla">
                <div className="luchadores">
                    <LuchadorCard luchador={jugador} esJugador={true}/>
                    <h2 style={{color: '#ffe81f', alignSelf: 'center', margin: '20px'}}>VS</h2>
                    <LuchadorCard luchador={oponente} esJugador={false}/>
                </div>
                {!terminada ? (
                    <div className="botones-accion" style={{marginTop: '20px'}}>
                        <button className="btn-info" onClick={() => handleAccionBatalla('ataque_normal')}>Atacar
                        </button>
                        <button
                            className="btn-elegir"
                            onClick={() => handleAccionBatalla('ataque_especial')}
                            disabled={jugador.especial_usado}
                            style={{
                                backgroundColor: jugador.especial_usado ? '#888' : undefined,
                                cursor: jugador.especial_usado ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {jugador.especial_usado ? 'Especial (Usado)' : 'Ataque Especial'}
                        </button>
                    </div>
                ) : (
                    <div style={{marginTop: '20px'}}>
                        <h2 style={{color: jugador.hp_actual > 0 ? '#50c878' : '#ff3838'}}>
                            {jugador.hp_actual > 0 ? '¡Has Ganado!' : '¡Has Sido Derrotado!'}
                        </h2>
                        <button className="btn-volver" onClick={handleSalirBatalla}>Volver al Inicio</button>
                    </div>
                )}
                <div className="log-batalla">
                    {log_batalla.slice(0).reverse().map((linea, index) => (
                        <p key={index} className={`log-linea ${getLogColorClass(linea)}`}>{linea}</p>
                    ))}
                </div>
            </div>
        );
    };

    const renderPlayerGame = () => {
        if (vistaActual === 'torneo') {
            return (
                <TournamentDashboard
                    currentUser={currentUser}
                    token={token}
                    onVolver={() => setVistaActual('mundos')}
                    charToJoinWith={charToJoinWith}
                    setCharToJoinWith={setCharToJoinWith}
                />
            );
        }

        return (
            <>
                <button
                    className="btn-volver"
                    onClick={handleLogout}
                    style={{position: 'absolute', top: 20, right: 20}}
                >
                    Salir
                </button>

                {error && <p className="error" onClick={() => setError(null)}>{error}</p>}

                {renderLeaderboardModal()}


                {enBatalla
                    ? renderBatalla()
                    : personajeSeleccionado
                        ? renderInfoPersonaje()
                        : mundoSeleccionado
                            ? renderPersonajes()
                            : renderMundos()
                }
            </>
        )
    }

    const renderAppContent = () => {
        if (appLoading) {
            return (<h2>Cargando...</h2>);
        }

        if (!introVisto) {
            return renderIntro();
        }

        if (introVisto && !token) {
            return <Auth onLoginSuccess={handleLoginSuccess}/>;
        }

        if (introVisto && token && !currentUser) {
            return <h2>Verificando sesión...</h2>
        }

        if (introVisto && token && currentUser) {
            if (currentUser.role === 'admin') {
                if (currentUser.must_change_password) {
                    return <ForceChangePassword
                        token={token}
                        onSuccess={handleCredentialsUpdated}
                        username={currentUser.username}
                    />;
                }
                return <AdminDashboard user={currentUser} onLogout={handleLogout}/>;
            }
            if (currentUser.role === 'jugador') {
                return renderPlayerGame();
            }
        }

        return <p>Estado inesperado. <span onClick={handleLogout}>Salir</span></p>;
    };

    return (
        <div className="App">
            <audio
                ref={audioRef}
                src={process.env.PUBLIC_URL + '/audio/music.mp3'}
                loop
            />
            <header className="App-header">
                {renderAppContent()}
            </header>
        </div>
    );
}

export default App;