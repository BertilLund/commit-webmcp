// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';

let App;
const audit = () => axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });

beforeEach(async () => {
  localStorage.clear();
  delete document.modelContext;
  vi.resetModules();
  ({ default: App } = await import('../src/App.jsx'));
});

afterEach(() => cleanup());

describe('primary-flow accessibility', () => {
  test('has no automatically detectable violations before and after a policy block', async () => {
    const user = userEvent.setup();
    render(<App />);

    const landing = await audit();
    expect(landing.violations.map((violation) => violation.id)).toEqual([]);

    await user.click(screen.getByRole('button', { name: /stage an unsafe price/i }));
    expect(await screen.findByText(/blocked by policy/i)).toBeTruthy();

    const blocked = await audit();
    expect(blocked.violations.map((violation) => violation.id)).toEqual([]);
  });
});
