import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

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
