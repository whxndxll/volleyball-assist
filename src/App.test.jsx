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

const runningMatch = () => ({
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
    { id: 't1', name: 'Time 1', players: [p('a', 'Ana')], points: 0, sets: 0 },
    { id: 't2', name: 'Time 2', players: [p('c', 'Carla')], points: 0, sets: 0 },
  ],
});

beforeEach(async () => {
  sessionStorage.clear();
  localStorage.clear();
  await localforage.clear();
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

  it('undo puts the racha back without duplicating it', async () => {
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

  it('keeps two undo actions alive at once instead of dropping the first', async () => {
    const user = userEvent.setup();
    await localforage.setItem('rachas', [
      rachaWithPlayers(['Ana', 'Bia']),
      { id: 'r2', name: 'Outro Racha', players: [{ id: 'q1', name: 'Zeca' }] },
    ]);

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Excluir racha Racha Teste' }));
    await user.click(await screen.findByText('Outro Racha'));
    await user.click(screen.getByRole('button', { name: /Jogadores/ }));
    await user.click(await screen.findByRole('button', { name: 'Remover jogador Zeca' }));

    expect(screen.getAllByRole('button', { name: 'Desfazer' })).toHaveLength(2);
  });
});

describe('App - stop placar', () => {
  it('offers undo after stopping a match in progress', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);
    await localforage.setItem('activeMatch', runningMatch());

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText('Racha Teste'));
    await user.click(screen.getByRole('button', { name: /Placar em andamento/ }));
    await screen.findByRole('group', { name: 'Time 1' });
    await user.click(screen.getByRole('button', { name: 'Adicionar ponto Time 1' }));

    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    await user.click(await screen.findByRole('button', { name: 'Parar' }));

    expect(await screen.findByText('Placar parado')).toBeInTheDocument();
    expect(screen.queryByText('Placar em andamento')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));

    // O placar volta no estado em que foi parado, ou seja, ainda pausado.
    expect(await screen.findByText('Placar em pausa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo Sorteio/ })).toBeInTheDocument();
  });
});

describe('App - import backup', () => {
  it('asks before replacing everything and restores the previous data on undo', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Racha Teste');

    const backup = JSON.stringify({
      app: 'volei-assist',
      version: 2,
      rachas: [{ id: 'x1', name: 'Racha do Backup', players: [{ id: 'x', name: 'Zeca' }] }],
    });
    const file = new File([backup], 'backup.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/Importar/), file);

    const dialog = await screen.findByRole('alertdialog', { name: 'Importar backup?' });
    // Nada é substituído antes da confirmação.
    expect(screen.getByText('Racha Teste')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Importar' }));

    expect(await screen.findByText('Racha do Backup')).toBeInTheDocument();
    expect(screen.queryByText('Racha Teste')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByText('Racha Teste')).toBeInTheDocument();
  });

  it('rejects a structurally invalid backup without touching the stored data', async () => {
    await localforage.setItem('rachas', [rachaWithPlayers(['Ana', 'Bia'])]);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Racha Teste');

    const poisoned = JSON.stringify({ app: 'volei-assist', version: 2, rachas: [{ id: 'x1' }] });
    const file = new File([poisoned], 'ruim.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/Importar/), file);

    expect(await screen.findByText('Arquivo de backup inválido.')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog', { name: 'Importar backup?' })).not.toBeInTheDocument();
    expect(screen.getByText('Racha Teste')).toBeInTheDocument();
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

    expect(await screen.findByText(/Melhor de 1/)).toBeInTheDocument();
    expect(screen.getByText(/até 21 pts/)).toBeInTheDocument();
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
