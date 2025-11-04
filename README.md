# Star Wars: Guerras Clon - Juego de Batalla y Torneos

Este proyecto es una aplicación web full-stack (React + FastAPI) que implementa un juego de batalla temático de Star Wars. Permite a los usuarios registrarse, verificar su cuenta por correo electrónico, iniciar sesión y participar en dos modos de juego: una batalla 1v1 contra la IA o un torneo completo de 16 participantes (1 jugador humano contra 15 IAs).

El panel de control frontend permite a los usuarios elegir un mundo, seleccionar un personaje y luchar. El backend gestiona toda la lógica de autenticación, persistencia de torneos y reglas de batalla, comunicándose con el frontend a través de una API REST.

## 🚀 Características Principales

* **API REST (FastAPI):** Un backend asíncrono robusto construido con FastAPI que proporciona endpoints para la autenticación de usuarios, la lógica del juego y la gestión completa de torneos.
* **Autenticación Segura por Roles:**
    * Sistema completo de registro, inicio de sesión y gestión de usuarios basada en tokens **JWT**.
    * Implementa roles (`jugador` y `admin`) con endpoints protegidos por dependencias.
    * **Registro con Verificación por Email:** Los nuevos usuarios deben verificar su cuenta mediante un código enviado a su correo electrónico (usando `fastapi-mail`) para activar la cuenta.
    * **Seguridad de Admin:** El administrador por defecto es forzado a cambiar sus credenciales en su primer inicio de sesión.
* **Dashboard Frontend Reactivo:** Una interfaz de usuario en React (construida con Create React App) que incluye:
    * Un formulario de autenticación (Login / Registro / Verificación).
    * Una intro animada al estilo "Star Wars" con música.
    * Selección de mundos y personajes (Héroes y Villanos).
    * Un panel de batalla 1v1 por turnos.
    * Un dashboard completo para crear, unirse y visualizar torneos.
    * Un panel de administración para ver estadísticas y logs de auditoría.
* **Sistema de Torneos Persistente:**
    * Los usuarios pueden crear torneos o unirse a torneos existentes.
    * Al unirse, el sistema completa el cuadro de 16 participantes con 15 IAs, seleccionando personajes aleatorios.
    * Toda la estructura del torneo (rondas, partidas, participantes, ganador) se guarda y gestiona en la base de datos.
    * Incluye un "Salón de la Fama" (Leaderboard) que muestra los ganadores más rápidos.
* **Persistencia de Datos (PostgreSQL):**
    * Todos los usuarios, registros de auditoría y datos de torneos se guardan en una base de datos **PostgreSQL**.
    * La interacción con la BD es totalmente asíncrona usando **SQLAlchemy 2.0 (asyncio)**.
* **Monitorización y Administración:**
    * Un endpoint `/api/admin/stats` muestra estadísticas de usuarios y logs.
    * Un endpoint `/api/admin/logs` permite a los administradores revisar las acciones de los usuarios en el sistema.
    * Integración con `prometheus-fastapi-instrumentator` para exponer métricas en `/metrics`.

## 🛠️ Stack Tecnológico

* **Backend:** Python 3.12, FastAPI, Uvicorn
* **Base de Datos:** PostgreSQL, SQLAlchemy (Async), `asyncpg`
* **Autenticación:** JWT (python-jose), `passlib[bcrypt]`, `fastapi-mail`
* **Frontend:** React 19, React Hooks, JavaScript (ES6+), CSS3
* **Contenerización:** Docker, Docker Compose
* **Testing:** React Testing Library (Jest), Pytest

## 🏛️ Arquitectura


1. **Diagrama de Clases**



![Diagrama_Clase.png](docs/arquitectura/Diagrama_Clase.png)



2. **Diagrama de Objetos**



![Diagrama_Objetos.png](docs/arquitectura/Diagrama_Objetos.png)



3. **Diagrama de Secuencia**



![Diagrama_Secuencia.png](docs/arquitectura/Diagrama_Secuencia.png)



##  Sistema


El sistema está orquestado con `docker-compose` y se divide en tres servicios principales:

* **`app` (Backend - FastAPI):**
    * Sirve la API REST en el puerto `8000`.
    * Maneja la autenticación, la lógica de negocio y la comunicación con la base de datos.
    * Persiste usuarios, logs de auditoría y estado de torneos en PostgreSQL.
    * Maneja las batallas 1v1 en memoria (estado efímero).
* **`frontend` (Frontend - React):**
    * Sirve la Single Page Application (SPA) de React en el puerto `3000`.
    * Consume la API del backend para todas las operaciones.
* **`postgres-db` (Base de Datos - PostgreSQL):**
    * La base de datos relacional que da persistencia al proyecto.
    * Expone el puerto `5433` al host para inspección, pero el servicio `app` se conecta a él internamente a través de la red de Docker en el puerto `5432`.

## ⚙️ Instalación y Ejecución


  **¡IMPORTANTE!** Debes tener instalado **GIT** para poder hacerlo desde el terminal con mayor comodidad

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/YoelUb/Actividad-4-Guerras_Clon.git](https://github.com/YoelUb/Actividad-4-Guerras_Clon.git)
    cd Actividad-4-Guerras_Clon
    ```

2.  **Configurar variables de entorno:**
    Copia el archivo `env.example` a `.env` en la raíz del proyecto.
    ```bash
    cp env.example .env
    ```

    Edita el archivo `.env` con tus credenciales. Asegúrate de configurar tus credenciales de Gmail (`MAIL_USERNAME`, `MAIL_PASSWORD`) para que el registro de usuarios funcione.


    Tu archivo `.env` debe verse así:
    ```ini
    DB_USER=clon_user
    DB_PASSWORD=secret_password
    DB_NAME=guerras_clon_bd
    DB_HOST=postgres-db
    DB_PORT=5432
    DATABASE_URL=postgresql+asyncpg://clon_user:secret_password@postgres-db:5432/guerras_clon_bd
    
    # ... Resto de variables ...
    
    MAIL_USERNAME=tu_correo@gmail.com
    MAIL_PASSWORD=tu_contraseña_de_aplicacion
    MAIL_FROM=tu_correo@gmail.com
    ```
    (Recuerda generar una Contraseña de Aplicación si usas 2FA en Gmail).

3.  **Construir y ejecutar con Docker Compose:**
    Asegúrate de tener Docker y Docker Compose en ejecución.
    ```bash
    # (Opcional) Limpiar cualquier estado anterior para evitar conflictos
    docker-compose down -v
    
    # Construir y ejecutar los contenedores
    docker-compose up --build
    ```
    Esto iniciará los tres contenedores: `postgres-db`, `app` (backend), y `frontend`.

4.  **Acceder a la aplicación:**
    Abre tu navegador y ve a: **`http://localhost:3000`**

5.  **Primer Inicio de Sesión (Admin):**
    * El sistema crea automáticamente un usuario administrador al arrancar (definido en tu `.env` como `administrador`, `Admin123`, `admin@starwars.com`).
    * Inicia sesión con esas credenciales.
    * Se te redirigirá a una pantalla para forzar la actualización de tu nombre de usuario y contraseña por motivos de seguridad.

## 🧪 Ejecutar Pruebas

El proyecto incluye pruebas para ambos, backend y frontend.

### Pruebas del Backend (Pytest)

Las pruebas del backend están configuradas para ejecutarse contra el contenedor de la base de datos que ya está en funcionamiento con `docker-compose`.

1.  **Abre una nueva terminal.**
    ¡IMPORTANTE! --> No detengas `docker-compose up`. Los contenedores deben estar ejecutándose.

2.  **Ejecuta este comando para los test de Backend**
    ```bash
    docker-compose exec app pytest -v
    ```

### Pruebas del Frontend (React Testing Library)

Las pruebas del frontend validan los componentes de React.

1.  **Abre una nueva terminal.**

2.  **Navega al directorio del frontend:**
    ```bash
    cd frontend
    ```

3.  **Instala las dependencias de Node.js:**
    ```bash
    npm install
    ```

4.  **Ejecuta las pruebas en modo interactivo:**
    ```bash
    npm test
    ```

## Contacto

Escribir ante cualquier duda --> yoelurquijo13@gmail.com