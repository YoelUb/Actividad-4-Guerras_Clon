import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [heroes, setHeroes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = 'http://localhost:8000/ministerioMarvel/heroes';

    console.log("Buscando héroes en:", API_URL);

    fetch(API_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Héroes encontrados:", data);
        setHeroes(data);
      })
      .catch(err => {
        console.error("Error al hacer fetch:", err);
        setError(err.message);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ministerio Marvel</h1>
        <h2>Lista de Héroes desde la API</h2>

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <div style={{ textAlign: 'left', fontSize: '1rem' }}>
          {heroes.map((heroe, index) => (
            <div key={index} style={{ border: '1px solid #fff', padding: '10px', margin: '10px' }}>
              <p><strong>Nombre:</strong> {heroe.nombre}</p>
              <p><strong>Vida:</strong> {heroe.vida}</p>
              <p><strong>Ataque:</strong> {heroe.ataque}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;