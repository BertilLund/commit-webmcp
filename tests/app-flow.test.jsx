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
  test('shows a real policy block, correction, approval, and atomic commit', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /stage an unsafe price/i }));
    expect(await screen.findByText(/blocked by policy/i)).toBeTruthy();
    expect(screen.getByText(/live price is still \$148/i)).toBeTruthy();
    expect(screen.getByText(/would land at 13% gross margin/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /correct to \$109 and build the plan/i }));
    expect((await screen.findByRole('button', { name: /approve this plan/i })).disabled).toBe(false);
    expect(screen.getByText(/live store is unchanged/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /approve this plan/i }));
    expect((await screen.findByRole('button', { name: /apply these changes/i })).disabled).toBe(false);

    await user.click(screen.getByRole('button', { name: /apply these changes/i }));
    expect(await screen.findByText(/commit complete/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /see the audit record/i }).disabled).toBe(false);

    await user.click(screen.getByRole('button', { name: /see the updated catalog/i }));
    expect(await screen.findByText(/what is live now/i)).toBeTruthy();
    expect(screen.getByText('$109')).toBeTruthy();
  });

  test('invalidates an approval when a human changes the staged plan', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /stage an unsafe price/i }));
    await user.click(screen.getByRole('button', { name: /correct to \$109 and build the plan/i }));
    await user.click(await screen.findByRole('button', { name: /approve this plan/i }));
    expect(await screen.findByRole('button', { name: /apply these changes/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /inspect 13 changes/i }));
    await user.click(screen.getByRole('button', { name: /edit aster field jacket/i }));
    const price = await screen.findByRole('spinbutton', { name: /new proposed price/i });
    await user.clear(price);
    await user.type(price, '115');
    await user.click(screen.getByRole('button', { name: /save price/i }));

    expect(await screen.findByRole('button', { name: /approve this plan/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /apply these changes/i })).toBeNull();
  });

  test('creates a reviewable rollback that restores committed catalog state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /stage an unsafe price/i }));
    await user.click(screen.getByRole('button', { name: /correct to \$109 and build the plan/i }));
    await user.click(await screen.findByRole('button', { name: /approve this plan/i }));
    await user.click(await screen.findByRole('button', { name: /apply these changes/i }));
    await user.click(await screen.findByRole('button', { name: /see the audit record/i }));

    await user.click(await screen.findByRole('button', { name: /create a rollback plan/i }));
    expect(await screen.findByText(/safely reverse the latest committed change set/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /approve this plan/i }));
    await user.click(await screen.findByRole('button', { name: /apply these changes/i }));
    await user.click(await screen.findByRole('button', { name: /see the updated catalog/i }));

    expect(await screen.findByText(/what is live now/i)).toBeTruthy();
    expect(screen.getByText('$148')).toBeTruthy();
  });
});
