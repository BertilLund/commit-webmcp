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

    await user.click(screen.getByRole('button', { name: /create a clearance plan/i }));
    expect((await screen.findByRole('button', { name: /approve this plan/i })).disabled).toBe(false);
    expect(screen.getByText(/your store has not changed/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /approve this plan/i }));
    expect((await screen.findByRole('button', { name: /apply these changes/i })).disabled).toBe(false);

    await user.click(screen.getByRole('button', { name: /apply these changes/i }));
    expect(await screen.findByText(/your store is updated/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /see the audit record/i }).disabled).toBe(false);
  });

  test('invalidates an approval when a human changes the staged plan', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /create a clearance plan/i }));
    await user.click(await screen.findByRole('button', { name: /approve this plan/i }));
    expect(await screen.findByRole('button', { name: /apply these changes/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /see all 13 individual changes/i }));
    await user.click(screen.getByRole('button', { name: /edit aster field jacket/i }));
    const price = await screen.findByRole('spinbutton', { name: /new proposed price/i });
    await user.clear(price);
    await user.type(price, '115');
    await user.click(screen.getByRole('button', { name: /save price/i }));

    expect(await screen.findByRole('button', { name: /approve this plan/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /apply these changes/i })).toBeNull();
  });
});
