import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import localforage from 'localforage';
import App from './App';

const rachaWithPlayers = (players) => ({
  id: 'r1',
  name: 'Racha Teste',
  players: players.map((name, i) => ({ id: `p${i}`, name })),
});

const p = (id, name) => ({ id, name });

const runningMatch = (overrides = {}) => ({
  id: 'm1',
  createdAt: 1,
  startedAt: Date.now(),
  resumedAt: Date.now(),
  accumulatedMs: 0,
  paused: false,
  targetPoints: 25,
  bestOf: 3,
  finished: false,
  teams: [
    { id: 't1', name: 'Time 1', players: [p('a', 'Ana'), p('b', 'Bia')], points: 0, sets: 0 },
    { id: 't2', name: 'Time 2', players: [p('c', 'Carla'), p('d', 'Duda')], points: 0, sets: 0 },
  ],
  ...overrides,
});

beforeEach(async () => {
  sessionStorage.clear();
  localStorage.clear();
  await localforage.clear();
});

const startDraw = async (user, playerCount) => {
  await localforage.setItem('rachas', [rachaWithPlayers(Array.from({ length: playerCount }, (_, i) => `J ${i + 1}`))]);
  render(<App />);
  await user.click(await screen.findByText('Racha Teste'));
  await user.click(screen.getByRole('button', { name: /Novo Sorteio/ }));
  await user.click(screen.getByRole('button', { name: 'Todos' }));
};

const teamCard = (teamName) => screen.getByRole('group', { name: teamName });

const score = async (user, teamName, times) => {
  for (let i = 0; i < times; i++) {
    await user.click(screen.getByRole('button', { name: `Adicionar ponto ${teamName}` }));
  }
};

describe('App - scoreboard', () => {
  it('pauses, resumes and resets a match', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia', 'Carla', 'Duda'])]);
    await localforage.setItem('activeMatch', runningMatch());

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Placar em andamento/ }));

    expect(await screen.findByText('Placar')).toBeInTheDocument();

    const team1Card = teamCard('Time 1');
    await user.click(screen.getByRole('button', { name: 'Adicionar ponto Time 1' }));
    expect(within(team1Card).getByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pausar' }));

    expect(await screen.findByText('Placar em pausa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zerar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Parar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('button', { name: 'Adicionar ponto Time 1' })).toBeInTheDocument();
    expect(within(teamCard('Time 1')).getByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zerar' }));
    expect(within(teamCard('Time 1')).getByText('0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Voltar' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument();
  });

  it('opens the placar from the home screen when a match exists', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);
    await localforage.setItem('activeMatch', runningMatch());

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Abrir' }));

    expect(await screen.findByText('Placar')).toBeInTheDocument();
  });

  it('starts a quick placar from home without drawing the teams', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(Array.from({ length: 12 }, (_, i) => `J ${i + 1}`))]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Iniciar placar rápido' }));

    expect(await screen.findByText('Placar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar ponto Time 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar ponto Time 2' })).toBeInTheDocument();
  });

  it('hints when no racha has enough players for a quick placar', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Iniciar placar rápido' }));

    expect(await screen.findByText(/Nenhum racha com 12 ou mais jogadores/)).toBeInTheDocument();
  });
});

describe('App - auto set end', () => {
  it('ends a set when a team reaches the target with 2+ points and finishes the match', async () => {
    const user = userEvent.setup();
    await startDraw(user, 12);
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));

    fireEvent.change(screen.getByLabelText('Pontos por set'), { target: { value: '3' } });
    await user.click(screen.getByRole('button', { name: 'Iniciar Placar' }));

    await score(user, 'Time 1', 3);
    expect(within(teamCard('Time 1')).getByText('0')).toBeInTheDocument();

    await score(user, 'Time 2', 3);
    await score(user, 'Time 1', 3);

    expect(await screen.findByText('Time 1 venceu!')).toBeInTheDocument();
    const overlay = screen.getByRole('alertdialog', { name: 'Resultado da partida' });
    expect(within(overlay).getByText('Time 1 2 · Time 2 1')).toBeInTheDocument();
    expect(within(overlay).getByRole('button', { name: /Zerar placar/ })).toBeInTheDocument();
    expect(within(overlay).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('keeps playing on deuce until a team opens a 2-point lead', async () => {
    const user = userEvent.setup();
    await startDraw(user, 12);
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));

    fireEvent.change(screen.getByLabelText('Pontos por set'), { target: { value: '3' } });
    await user.click(screen.getByRole('button', { name: 'Iniciar Placar' }));

    await score(user, 'Time 1', 2);
    await score(user, 'Time 2', 2);
    expect(screen.getAllByText('Deuce')).toHaveLength(1);

    await score(user, 'Time 1', 1);
    expect(within(teamCard('Time 1')).getByText('3')).toBeInTheDocument();
    expect(within(teamCard('Time 2')).getByText('2')).toBeInTheDocument();

    await score(user, 'Time 1', 1);
    expect(within(teamCard('Time 1')).getByText('0')).toBeInTheDocument();
  });
});

describe('App - set history', () => {
  it('keeps the score of every finished set', async () => {
    const user = userEvent.setup();
    await startDraw(user, 12);
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));

    fireEvent.change(screen.getByLabelText('Pontos por set'), { target: { value: '5' } });
    await user.click(screen.getByRole('button', { name: 'Iniciar Placar' }));

    await score(user, 'Time 1', 4);
    await score(user, 'Time 2', 1);
    expect(screen.queryByLabelText('Placar por sets')).not.toBeInTheDocument();

    await score(user, 'Time 1', 1);

    const strip = screen.getByLabelText('Placar por sets');
    expect(within(strip).getByLabelText('Set 1: Time 1 5 a 1')).toBeInTheDocument();
    expect(within(teamCard('Time 1')).getByText('0')).toBeInTheDocument();

    await score(user, 'Time 2', 5);
    await score(user, 'Time 2', 1);
    expect(within(strip).getByLabelText('Set 2: Time 2 5 a 0')).toBeInTheDocument();
  });

  it('rolls the whole set back when the winning point is undone', async () => {
    const user = userEvent.setup();
    await startDraw(user, 12);
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));

    fireEvent.change(screen.getByLabelText('Pontos por set'), { target: { value: '3' } });
    await user.click(screen.getByRole('button', { name: 'Iniciar Placar' }));

    await score(user, 'Time 1', 2);
    await score(user, 'Time 2', 1);
    await score(user, 'Time 1', 1);

    expect(screen.getByLabelText('Set 1: Time 1 3 a 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer último ponto' }));

    expect(screen.queryByLabelText('Placar por sets')).not.toBeInTheDocument();
    expect(within(teamCard('Time 1')).getByText('2')).toBeInTheDocument();
    expect(within(teamCard('Time 2')).getByText('1')).toBeInTheDocument();
  });
});

describe('App - placar chrome', () => {
  it('offers fullscreen in landscape', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);
    await localforage.setItem('activeMatch', runningMatch());

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Placar em andamento/ }));

    expect(await screen.findByRole('button', { name: 'Tela cheia e paisagem' })).toBeInTheDocument();
  });

  it('hides the cards from assistive tech only as groups, never as nested buttons', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);
    await localforage.setItem('activeMatch', runningMatch());

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Placar em andamento/ }));

    await screen.findByRole('group', { name: 'Time 1' });
    expect(screen.queryByRole('button', { name: 'Pontuar Time 1' })).not.toBeInTheDocument();
  });
});

describe('App - bench marker', () => {
  it('puts bench-marked players in the last team when it completes a full 3rd team', async () => {
    const user = userEvent.setup();
    await startDraw(user, 18);

    const spinbuttons = screen.getAllByRole('spinbutton');
    fireEvent.change(spinbuttons[1], { target: { value: '3' } });

    for (const name of ['J 13', 'J 14', 'J 15', 'J 16', 'J 17', 'J 18']) {
      await user.click(screen.getByRole('button', { name: `Marcar ${name} como reserva` }));
    }
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));

    expect(await screen.findByText('3 times')).toBeInTheDocument();
    const team3 = screen.getByText('Time 3 · 6 jogadores').closest('div');
    for (const name of ['J 13', 'J 14', 'J 15', 'J 16', 'J 17', 'J 18']) {
      expect(within(team3).getByText(name)).toBeInTheDocument();
    }
    expect(within(team3).queryByText('J 1')).not.toBeInTheDocument();
    expect(screen.queryByText(/na reserva/)).not.toBeInTheDocument();
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

describe('App - block starting another placar', () => {
  it('does not allow starting a new placar while one is active', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(Array.from({ length: 12 }, (_, i) => `J ${i + 1}`))]);
    await localforage.setItem('activeMatch', runningMatch());

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Novo Sorteio/ }));
    await user.click(screen.getByRole('button', { name: 'Todos' }));
    await user.click(screen.getByRole('button', { name: 'Sortear Times' }));
    await user.click(screen.getByRole('button', { name: 'Iniciar Placar' }));

    expect(await screen.findByText(/Já existe um placar em andamento/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Placar' })).toBeInTheDocument();
  });
});
