// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let App;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  ({ default: App } = await import('../src/App.jsx'));
});

afterEach(() => cleanup());

describe('human review UI', () => {
  test('takes a user from a guided plan through approve and atomic commit', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /show me a working plan/i }));
    expect((await screen.findByRole('button', { name: /approve this plan/i })).disabled).toBe(false);
    expect(screen.getByText(/staged — nothing is live/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /approve this plan/i }));
    expect((await screen.findByRole('button', { name: /commit this plan/i })).disabled).toBe(false);

    await user.click(screen.getByRole('button', { name: /commit this plan/i }));
    expect(await screen.findByText(/changes applied/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /view the audit record/i }).disabled).toBe(false);
  });

  test('invalidates an approval when a human changes the staged plan', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /show me a working plan/i }));
    await user.click(await screen.findByRole('button', { name: /approve this plan/i }));
    expect(await screen.findByRole('button', { name: /commit this plan/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /review all 13 changes/i }));
    await user.click(screen.getByRole('button', { name: /edit aster field jacket/i }));
    const price = await screen.findByRole('spinbutton', { name: /new proposed price/i });
    await user.clear(price);
    await user.type(price, '115');
    await user.click(screen.getByRole('button', { name: /save to plan/i }));

    expect(await screen.findByRole('button', { name: /approve this plan/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /commit this plan/i })).toBeNull();
  });
});
