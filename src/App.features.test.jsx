import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import localforage from 'localforage';
import { vi } from 'vitest';
import App from './App';

const rachaWithPlayers = (players) => ({
  id: 'r1',
  name: 'Racha Teste',
  players: players.map((name, i) => ({ id: `p${i}`, name })),
});

const finishedMatch = (id, teams) => ({
  id,
  rachaId: 'r1',
  createdAt: 1,
  targetPoints: 25,
  bestOf: 3,
  finished: true,
  teams,
});

const p = (id, name) => ({ id, name });

describe('App - scoreboard', () => {
  it('adds points, finishes and resets a match', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia', 'Carla', 'Duda'])]);
    await localforage.setItem('matches', [{
      id: 'm1', rachaId: 'r1', createdAt: 1, targetPoints: 25, bestOf: 3, finished: false,
      teams: [
        { id: 't1', name: 'Time 1', players: [p('a', 'Ana'), p('b', 'Bia')], points: 0, sets: 0 },
        { id: 't2', name: 'Time 2', players: [p('c', 'Carla'), p('d', 'Duda')], points: 0, sets: 0 },
      ],
    }]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /^Partidas/ }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Placar')).toBeInTheDocument();

    const team1Card = screen.getByText('Time 1').closest('div');
    await user.click(within(team1Card).getByRole('button', { name: 'Adicionar ponto - Time 1' }));
    expect(within(team1Card).getByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Encerrar partida' }));
    expect(screen.getByText('Partida encerrada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zerar placar' }));
    expect(within(team1Card).getAllByText('0')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Encerrar partida' })).toBeInTheDocument();
  });
});

describe('App - delete match undo', () => {
  it('restores the deleted match after undo', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);
    await localforage.setItem('matches', [finishedMatch('m1', [
      { id: 't1', name: 'Time 1', players: [p('a', 'Ana')], points: 25, sets: 2 },
      { id: 't2', name: 'Time 2', players: [p('b', 'Bia')], points: 20, sets: 0 },
    ])]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /^Partidas/ }));
    expect(await screen.findByText('Time 1 2 x Time 2 0')).toBeInTheDocument();

    await user.click(screen.getByTitle('Excluir partida'));
    expect(await screen.findByText('Partida excluída')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma partida registrada.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByText('Time 1 2 x Time 2 0')).toBeInTheDocument();
  });
});

describe('App - presence import', () => {
  it('matches members, adds unknown names as guests and strips captain marks', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bruno'])]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Novo Sorteio/ }));
    await user.click(screen.getByRole('button', { name: 'Importar lista de presença' }));
    await user.type(screen.getByPlaceholderText(/Cole a lista/), '1. Ana (C)\n2. Bruno\n3. Carla');
    await user.click(screen.getByRole('button', { name: 'Adicionar à presença' }));

    expect(await screen.findByText('2 da lista e 1 convidado(s) adicionado(s).')).toBeInTheDocument();
    expect(screen.getByText(/3 selecionados/)).toBeInTheDocument();
    expect(screen.getByText('Carla')).toBeInTheDocument();
    expect(screen.queryByText('Ana (C)')).not.toBeInTheDocument();
  });
});

describe('App - guest dedup', () => {
  it('does not add a guest with a duplicate name', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana'])]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Novo Sorteio/ }));
    await user.type(screen.getByPlaceholderText('Nome do convidado...'), 'Ze{Enter}');
    await user.type(screen.getByPlaceholderText('Nome do convidado...'), 'Ze{Enter}');

    expect(await screen.findByText('Esse nome já está presente.')).toBeInTheDocument();
    expect(screen.getAllByText('Ze')).toHaveLength(1);
  });
});

describe('App - confirm before replacing active placar', () => {
  it('asks for confirmation when an active match exists', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(Array.from({ length: 12 }, (_, i) => `J ${i + 1}`))]);
    await localforage.setItem('matches', [{
      id: 'm1', rachaId: 'r1', createdAt: 1, targetPoints: 25, bestOf: 3, finished: false,
      teams: [
        { id: 't1', name: 'Time 1', players: [p('a', 'J 1')], points: 0, sets: 0 },
        { id: 't2', name: 'Time 2', players: [p('b', 'J 2')], points: 0, sets: 0 },
      ],
    }]);

    const confirmMock = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmMock);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Novo Sorteio/ }));
    await user.click(screen.getByRole('button', { name: 'Todos' }));
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));
    await user.click(screen.getByRole('button', { name: 'Iniciar Placar' }));

    expect(confirmMock).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Iniciar Placar' })).toBeInTheDocument();
  });
});

describe('App - rename player propagates to matches', () => {
  it('updates the name in finished matches used by stats', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);
    await localforage.setItem('matches', [finishedMatch('m1', [
      { id: 't1', name: 'Time 1', players: [p('p0', 'Ana')], points: 25, sets: 2 },
      { id: 't2', name: 'Time 2', players: [p('p1', 'Bia')], points: 20, sets: 0 },
    ])]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Jogadores/ }));
    await user.click(screen.getByRole('button', { name: 'Renomear jogador Ana' }));
    const editInput = screen.getByDisplayValue('Ana');
    await user.clear(editInput);
    await user.type(editInput, 'Anabela{Enter}');

    await user.click(screen.getByRole('button', { name: 'Painel do Racha' }));
    await user.click(screen.getByRole('button', { name: /Estatísticas/ }));

    expect(await screen.findByText('Anabela')).toBeInTheDocument();
    expect(screen.queryAllByText('Ana')).toHaveLength(0);
  });
});
