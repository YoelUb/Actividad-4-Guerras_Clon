import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import TournamentDashboard from '../TournamentDashboard';

global.fetch = jest.fn();

const mockUser = { id: 1, username: 'TestUser' };
const mockToken = 'fake-token';

const mockOpenTournaments = [
    { id: 1, name: 'Torneo de Tatooine', status: 'pending', participants: [] },
    { id: 2, name: 'Torneo de Hoth', status: 'pending', participants: [{ user: { id: 2, username: 'IA' } }] }
];

const mockTournamentDetail = {
    id: 1,
    name: 'Torneo de Tatooine',
    status: 'active',
    winner: null,
    participants: [
        { id: 1, user: mockUser, character_id: 'luke', character: { nombre: 'Luke' } },
        { id: 2, ai_name: 'IA: Vader', character_id: 'vader', character: { nombre: 'Vader' } }
    ],
    matches: [
        { id: 1, round: 1, match_index: 0, player1_id: 1, player2_id: 2, winner_id: null, status: 'pending' }
    ]
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('Componente TournamentDashboard', () => {

    test('1. Muestra "Cargando..." y luego la lista de torneos', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => (mockOpenTournaments),
        });

        render(
            <TournamentDashboard
                currentUser={mockUser}
                token={mockToken}
                onVolver={() => {}}
                setCharToJoinWith={() => {}}
            />
        );

        expect(screen.queryByText('Torneo de Tatooine')).not.toBeInTheDocument();

        expect(await screen.findByText('Torneo de Tatooine')).toBeInTheDocument();
        expect(screen.getByText('Torneo de Hoth')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: /unirse y empezar/i })).toBeInTheDocument();

        expect(screen.getByText(/torneo lleno/i)).toBeInTheDocument();
    });

    test('2. Muestra mensaje si no hay torneos abiertos', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ([]),
        });

        render(
            <TournamentDashboard
                currentUser={mockUser}
                token={mockToken}
                onVolver={() => {}}
                setCharToJoinWith={() => {}}
            />
        );

        expect(await screen.findByText(/no hay torneos abiertos. ¡crea uno!/i)).toBeInTheDocument();
    });

    test('3. Clica en "Ver Estado" y muestra los detalles del torneo', async () => {

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => (mockOpenTournaments),
        });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => (mockTournamentDetail),
        });

        render(
            <TournamentDashboard
                currentUser={mockUser}
                token={mockToken}
                onVolver={() => {}}
                setCharToJoinWith={() => {}}
            />
        );

        const verEstadoButton = (await screen.findAllByText(/ver estado/i))[0];

        await userEvent.click(verEstadoButton);

        expect(await screen.findByText(/cuadro del torneo/i)).toBeInTheDocument();
        expect(screen.getByText('IA: Vader (Vader)')).toBeInTheDocument();
        expect(screen.getByText('TestUser (Luke)')).toBeInTheDocument();

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8000/api/tournament/1',
            expect.anything()
        );
    });
});
