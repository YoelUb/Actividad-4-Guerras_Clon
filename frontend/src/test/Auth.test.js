import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import Auth from '../Auth';

global.fetch = jest.fn();

afterEach(() => {
    jest.clearAllMocks();
});

describe('Componente Auth', () => {

    test('1. Renderiza el formulario de login por defecto', () => {
        render(<Auth onLoginSuccess={() => {}} />);

        expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/usuario/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/^contraseña \(/i)).toBeInTheDocument(); // Regex para la contraseña de registro
        expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    test('2. Cambia a modo de registro al hacer clic en el enlace', async () => {
        const user = userEvent.setup();
        render(<Auth onLoginSuccess={() => {}} />);

        const toggleLink = screen.getByText(/¿no tienes cuenta\? regístrate/i);
        await user.click(toggleLink);

        expect(screen.getByRole('heading', { name: /registrarse/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/usuario \(4-20 caracteres\)/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument();

        expect(screen.getByText(/¿ya tienes cuenta\? inicia sesión/i)).toBeInTheDocument();
    });

    test('3. Muestra error de validación de usuario en registro', async () => {
        const user = userEvent.setup();
        render(<Auth onLoginSuccess={() => {}} />);

        // Ir a registro
        await user.click(screen.getByText(/¿no tienes cuenta\? regístrate/i));

        await user.type(screen.getByPlaceholderText(/usuario \(4-20 caracteres\)/i), "123");
        await user.type(screen.getByPlaceholderText(/email/i), "test@test.com");
        await user.type(screen.getByPlaceholderText(/contraseña \(mín 8, A, a, 1, \$\)/i), "ValidPass123!");

        await user.click(screen.getByRole('button', { name: /enviar código/i }));

        expect(await screen.findByText(/usuario: 4-20 caracteres/i)).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('4. Envía solicitud de registro y pasa a la verificación', async () => {
        const user = userEvent.setup();
        const mockOnLogin = jest.fn();

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ message: "Se ha enviado un código." }),
        });

        render(<Auth onLoginSuccess={mockOnLogin} />);

        await user.click(screen.getByText(/¿no tienes cuenta\? regístrate/i));

        await user.type(screen.getByPlaceholderText(/usuario \(4-20 caracteres\)/i), "usuarioValido");
        await user.type(screen.getByPlaceholderText(/email/i), "test@test.com");
        await user.type(screen.getByPlaceholderText(/contraseña \(mín 8, A, a, 1, \$\)/i), "ValidPass123!");

        await user.click(screen.getByRole('button', { name: /enviar código/i }));

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8000/api/auth/register/request',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ username: 'usuarioValido', email: 'test@test.com', password: 'ValidPass123!' })
            })
        );

        // 5. Verificar que estamos en la pantalla de verificación
        expect(await screen.findByText(/introduce el código enviado/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/código de verificación/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /verificar y crear cuenta/i })).toBeInTheDocument();
    });

    test('5. Envía login exitoso y llama a onLoginSuccess', async () => {
        const user = userEvent.setup();
        const mockOnLogin = jest.fn();
        const mockToken = "fake.jwt.token";

        // Mockear la respuesta de /token
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ access_token: mockToken }),
        });

        render(<Auth onLoginSuccess={mockOnLogin} />);

        // Rellenar formulario
        await user.type(screen.getByPlaceholderText(/usuario/i), "testuser");
        await user.type(screen.getByPlaceholderText(/^contraseña \(/i), "testpass");

        // Enviar
        await user.click(screen.getByRole('button', { name: /entrar/i }));

        await waitFor(() => {
            expect(mockOnLogin).toHaveBeenCalledWith(mockToken);
        });

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8000/api/auth/token',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(URLSearchParams)
            })
        );
    });

    test('6. Muestra error en login fallido', async () => {
        const user = userEvent.setup();
        const mockOnLogin = jest.fn();

        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({ detail: "Error al iniciar sesión" }),
        });

        render(<Auth onLoginSuccess={mockOnLogin} />);

        await user.type(screen.getByPlaceholderText(/usuario/i), "wrong");
        await user.type(screen.getByPlaceholderText(/^contraseña \(/i), "wrong");
        await user.click(screen.getByRole('button', { name: /entrar/i }));

        const errorMessage = await screen.findByText("Error al iniciar sesión");
        expect(errorMessage).toBeInTheDocument();
        expect(mockOnLogin).not.toHaveBeenCalled();
    });
});