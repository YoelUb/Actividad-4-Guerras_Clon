import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [mundos, setMundos] = useState([]);
  const [mundoSeleccionado, setMundoSeleccionado] = useState(null);
  const [personajes, setPersonajes] = useState({ heroes: [], villanos: [] });
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [error, setError] = useState(null);

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
  };

  const handleVolverMundos = () => {
    setMundoSeleccionado(null);
    setPersonajes({ heroes: [], villanos: [] });
    setPersonajeSeleccionado(null);
    setMostrarInfo(false);
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
          <button className="btn-elegir">Elegir</button>
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Star Wars: Guerras Clon</h1>
        {error && <p className="error">Error: {error}</p>}

        {personajeSeleccionado
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
