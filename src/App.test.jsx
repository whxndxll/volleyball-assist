import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import localforage from 'localforage';
import App from './App';

const rachaWithPlayers = (players) => ({
  id: 'r1',
  name: 'Racha Teste',
  players: players.map((name, i) => ({ id: `p${i}`, name })),
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
