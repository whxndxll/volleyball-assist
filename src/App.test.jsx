import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import localforage from 'localforage';
import App from './App';

const rachaWithPlayers = (players) => ({
  id: 'r1',
  name: 'Racha Teste',
  players: players.map((name, i) => ({ id: `p${i}`, name })),
});

describe('App - delete racha undo', () => {
  it('restores the deleted racha exactly once after undo', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('Nenhum racha cadastrado ainda.')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Nome do novo racha...'), 'Racha Teste{Enter}');
    expect(await screen.findByText('Racha Teste')).toBeInTheDocument();

    await user.click(screen.getByTitle('Excluir racha'));
    expect(await screen.findByText('Nenhum racha cadastrado ainda.')).toBeInTheDocument();
    expect(screen.getByText('Racha excluído')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));

    expect(await screen.findByText('Racha Teste')).toBeInTheDocument();
    const rows = screen.getAllByText('Racha Teste');
    expect(rows).toHaveLength(1);
  });

  it('undo restores match history for the racha without duplicating', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('Nenhum racha cadastrado ainda.')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Nome do novo racha...'), 'Racha Teste{Enter}');
    expect(await screen.findByText('Racha Teste')).toBeInTheDocument();

    await user.click(screen.getByTitle('Excluir racha'));
    expect(await screen.findByText('Nenhum racha cadastrado ainda.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Desfazer' }));

    await screen.findByText('Racha Teste');
    const list = screen.getByText('Racha Teste').closest('.grid');
    expect(within(list).getAllByText('Racha Teste')).toHaveLength(1);
  });
});

describe('App - match configuration', () => {
  it('starts a placar with the configured points and best-of', async () => {
    await localforage.setItem('rachas', [
      rachaWithPlayers(Array.from({ length: 12 }, (_, i) => `Jogador ${i + 1}`)),
    ]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Novo Sorteio/ }));
    await user.click(screen.getByRole('button', { name: 'Todos' }));
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));

    const points = screen.getByLabelText('Pontos por set');
    fireEvent.change(points, { target: { value: '21' } });
    await user.click(screen.getByRole('button', { name: 'Bo1' }));
    await user.click(screen.getByRole('button', { name: 'Iniciar Placar' }));

    expect(await screen.findByText('Jogo até 21 pontos · melhor de 1 (1 sets para vencer)')).toBeInTheDocument();
  });
});

describe('App - statistics', () => {
  it('shows stats per player from finished matches', async () => {
    const p0 = { id: 'a', name: 'Ana' };
    const p1 = { id: 'b', name: 'Bia' };
    const p2 = { id: 'c', name: 'Carla' };
    const p3 = { id: 'd', name: 'Duda' };
    await localforage.setItem('rachas', [{ id: 'r1', name: 'Racha Teste', players: [p0, p1, p2, p3] }]);
    await localforage.setItem('matches', [
      {
        id: 'm1',
        rachaId: 'r1',
        createdAt: 1,
        targetPoints: 25,
        bestOf: 3,
        finished: true,
        teams: [
          { id: 't1', name: 'Time 1', players: [p0, p1], points: 25, sets: 2 },
          { id: 't2', name: 'Time 2', players: [p2, p3], points: 20, sets: 0 },
        ],
      },
    ]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Estatísticas/ }));

    expect(await screen.findByText('Estatísticas')).toBeInTheDocument();
    expect(within(screen.getByText('Partidas').closest('div')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByText('Sets jogados').closest('div')).getByText('2')).toBeInTheDocument();
    expect(within(screen.getByText('Jogadores').closest('div')).getByText('4')).toBeInTheDocument();
    expect(screen.getAllByText('100%')).toHaveLength(2);
    expect(screen.getAllByText('0%')).toHaveLength(2);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Duda')).toBeInTheDocument();
  });
});

describe('App - dark mode', () => {
  it('toggles the dark class on the document root', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('Nenhum racha cadastrado ainda.')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass('dark');

    await user.click(screen.getByTitle('Modo escuro'));
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByTitle('Modo claro')).toBeInTheDocument();

    await user.click(screen.getByTitle('Modo claro'));
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
