import React, { useState, useEffect } from 'react';


function App() {
  const [mundos, setMundos] = useState([]);
  const [mundoSeleccionado, setMundoSeleccionado] = useState(null);
  const [personajes, setPersonajes] = useState({ heroes: [], villanos: [] });
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [error, setError] = useState(null);

  const [estadoBatalla, setEstadoBatalla] = useState(null);
  const [enBatalla, setEnBatalla] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api/guerras-clon';

  useEffect(() => {
    fetch(`${API_BASE_URL}/mundos`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setMundos(data))
      .catch(err => setError(err.message));
  }, []);

  const handleMundoClick = (mundo) => {
    setMundoSeleccionado(mundo);
    setPersonajeSeleccionado(null);
    setMostrarInfo(false);
    setError(null);

    fetch(`${API_BASE_URL}/mundos/${mundo.id}/personajes`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setPersonajes(data))
      .catch(err => setError(err.message));
  };

  const handlePersonajeClick = (personaje) => {
    setPersonajeSeleccionado(personaje);
    setMostrarInfo(false);
    setError(null);
  };

  const handleVolverMundos = () => {
    setMundoSeleccionado(null);
    setPersonajes({ heroes: [], villanos: [] });
    setPersonajeSeleccionado(null);
    setMostrarInfo(false);
    setEstadoBatalla(null);
    setEnBatalla(false);
    setError(null);
  };



  const handleIniciarBatalla = () => {
    if (!personajeSeleccionado || !mundoSeleccionado) return;
    setError(null);

    fetch(`${API_BASE_URL}/batalla/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mundo_id: mundoSeleccionado.id,
        jugador_id: personajeSeleccionado.id,
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      setEstadoBatalla(data);
      setEnBatalla(true);
      setPersonajeSeleccionado(null);
      setMundoSeleccionado(null);
    })
    .catch(err => setError(err.message));
  };

  const handleAccionBatalla = (tipo_accion) => {
    if (!estadoBatalla || estadoBatalla.terminada) return;
    setError(null);

    if (tipo_accion === 'ataque_especial' && estadoBatalla.jugador.especial_usado) {
      setError("You have already used your special attack.");
      return;
    }

    fetch(`${API_BASE_URL}/batalla/accion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_batalla: estadoBatalla.id_batalla,
        tipo_accion: tipo_accion,
      }),
    })
    .then(response => {
       if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      setEstadoBatalla(data);
    })
    .catch(err => setError(err.message));
  };

  const handleSalirBatalla = () => {
    handleVolverMundos();
  };


  const renderInfoPersonaje = () => {
    if (!personajeSeleccionado) return null;

    return (
      <div className="info-personaje">
        <img
          src={personajeSeleccionado.imagen}
          alt={personajeSeleccionado.nombre}
          className="img-personaje-grande"
          onError={(e) => { e.target.style.display = 'none'; }}
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
          <button className="btn-elegir" onClick={handleIniciarBatalla}>
            Elegir
          </button>
          <button className="btn-info" onClick={() => setMostrarInfo(!mostrarInfo)}>
            {mostrarInfo ? 'Ocultar Info' : 'Información'}
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
              <div key={heroe.id} className="card-personaje heroe" onClick={() => handlePersonajeClick(heroe)}>
                <img
                  src={heroe.imagen}
                  alt={heroe.nombre}
                  className="img-personaje-peq"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {heroe.nombre}
              </div>
            ))}
          </div>
          <div className="columna-personajes">
            <h3 className="villano">Villanos</h3>
            {personajes.villanos.map(villano => (
              <div key={villano.id} className="card-personaje villano" onClick={() => handlePersonajeClick(villano)}>
                <img
                  src={villano.imagen}
                  alt={villano.nombre}
                  className="img-personaje-peq"
                  onError={(e) => { e.target.style.display = 'none'; }}
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
        <h2>Elige un Mundo</h2>
        <div className="lista-mundos">
          {mundos.map(mundo => (
            <div key={mundo.id} className="card-mundo" onClick={() => handleMundoClick(mundo)}>
              <img
                src={mundo.imagen}
                alt={mundo.nombre}
                className="img-mundo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span>{mundo.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBatalla = () => {
    if (!enBatalla || !estadoBatalla) return null;

    const { jugador, oponente, log_batalla, terminada } = estadoBatalla;

    const LuchadorCard = ({ luchador, esJugador }) => (
      <div className="luchador-card" style={{ flex: 1, margin: '10px', minWidth: '200px', backgroundColor: 'transparent', border: 'none' }}>
        <img
          src={luchador.personaje.imagen}
          alt={luchador.personaje.nombre}
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '50%',
            border: `4px solid ${esJugador ? '#49dafd' : '#ff3838'}`,
            boxShadow: `0 0 15px ${esJugador ? '#49dafd' : '#ff3838'}`
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h3>{luchador.personaje.nombre}</h3>
        {/* Health Bar */}
        <div style={{ width: '100%', backgroundColor: '#555', borderRadius: '5px', overflow: 'hidden', border: '1px solid #777' }}>
          <div style={{
            width: `${(luchador.hp_actual / luchador.personaje.info.defensa) * 100}%`,
            backgroundColor: luchador.hp_actual / luchador.personaje.info.defensa > 0.5 ? '#50c878' : luchador.hp_actual / luchador.personaje.info.defensa > 0.2 ? '#ffe81f' : '#ff3838',
            height: '20px',
            transition: 'width 0.5s ease'
          }}></div>
        </div>
        <p style={{marginTop: '5px', fontSize: '1rem'}}>HP: {luchador.hp_actual} / {luchador.personaje.info.defensa}</p>
      </div>
    );

    return (
      <div className="vista-batalla" style={{ width: '90%', maxWidth: '900px' }}>

        <div className="luchadores" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <LuchadorCard luchador={jugador} esJugador={true} />

          <h2 style={{ color: '#ffe81f', alignSelf: 'center', margin: '20px' }}>VS</h2>

          <LuchadorCard luchador={oponente} esJugador={false} />
        </div>

        {/* Action Buttons */}
        {!terminada ? (
          <div className="botones-accion" style={{ marginTop: '20px' }}>
            <button className="btn-info" onClick={() => handleAccionBatalla('ataque_normal')}>Atacar</button>
            <button
              className="btn-elegir"
              onClick={() => handleAccionBatalla('ataque_especial')}
              disabled={jugador.especial_usado}
              style={{ backgroundColor: jugador.especial_usado ? '#888' : undefined, cursor: jugador.especial_usado ? 'not-allowed' : 'pointer' }}
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

        <div className="log-batalla" style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          border: '1px solid #4a4e5a',
          borderRadius: '8px',
          marginTop: '20px',
          padding: '15px',
          height: '200px',
          overflowY: 'auto',
          textAlign: 'left',
          fontFamily: 'Arial, sans-serif',
          fontSize: '0.9rem'
        }}>
          {log_batalla.slice(0).reverse().map((linea, index) => (
            <p key={index} style={{
              margin: '5px 0',
              borderBottom: '1px solid #333',
              paddingBottom: '5px',
              color: linea.includes('esquivado') ? '#ffc107' : (linea.includes(jugador.personaje.nombre) && linea.includes('causa')) ? '#90ee90' : (linea.includes(oponente.personaje.nombre) && linea.includes('causa')) ? '#f08080' : '#fff'
            }}>
              {linea}
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Star Wars: Guerras Clon</h1>
        {error && <p className="error" onClick={() => setError(null)} style={{cursor: 'pointer'}}>Error: {error} (click to dismiss)</p>}

        {enBatalla
          ? renderBatalla()
          : personajeSeleccionado
            ? renderInfoPersonaje()
            : mundoSeleccionado
              ? renderPersonajes()
              : renderMundos()
        }
      </header>
    </div>
  );
}

export default App;

