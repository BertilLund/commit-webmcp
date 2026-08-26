import { afterEach, describe, expect, test, vi } from 'vitest';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    get commitDemo() { return values.get('commitDemo'); },
    set commitDemo(value) { values.set('commitDemo', String(value)); },
  };
}

async function loadDomain() {
  vi.resetModules();
  vi.stubGlobal('localStorage', memoryStorage());
  return import('../src/lib/domain.js');
}

afterEach(() => vi.unstubAllGlobals());

describe('Commit transaction engine', () => {
  test('blocks unsafe staged pricing without touching canonical state', async () => {
    const domain = await loadDomain();
    domain.resetDemo();
    domain.beginChangeset({ title: 'Margin test', goal: 'Protect gross margin.' });
    const result = domain.stagePriceChange({ productId: 'p01', newPrice: 80 });

    expect(result.validation).toMatchObject({ block: 1 });
    expect(domain.getProduct('p01').price).toBe(148);
    expect(domain.shadowProducts().find((product) => product.id === 'p01').price).toBe(80);
    expect(domain.getState().changeset.status).toBe('changes_requested');
  });

  test('binds approval to a revision and invalidates it when a human edits', async () => {
    const domain = await loadDomain();
    domain.resetDemo();
    domain.beginChangeset({ title: 'Revision test', goal: 'Verify approval binding.' });
    domain.stagePriceChange({ productId: 'p01', newPrice: 109 });
    domain.requestCommit();
    const approval = domain.approveChangeset();
    domain.stagePriceChange({ productId: 'p01', newPrice: 115 }, 'human');

    expect(approval.revision).toBe(2);
    expect(domain.getState().changeset).toMatchObject({ revision: 3, approval: null, lastEditedBy: 'human', status: 'ready_for_approval' });
    expect(domain.getProduct('p01').price).toBe(148);
  });

  test('commits only an approved revision and persists a reversible audit payload', async () => {
    const domain = await loadDomain();
    domain.resetDemo();
    domain.beginChangeset({ title: 'Commit test', goal: 'Create a reversible commit.' });
    domain.stagePriceChange({ productId: 'p01', newPrice: 109 });
    domain.stageFeaturedProduct({ productId: 'p01', featured: true });
    domain.stageCampaign({ name: 'Weekend test', starts: '2026-08-28', ends: '2026-08-31' });
    domain.requestCommit();
    domain.approveChangeset();
    const commit = domain.commitApprovedChanges();

    expect(domain.getProduct('p01')).toMatchObject({ price: 109, featured: true });
    expect(domain.getState().campaigns).toHaveLength(1);
    expect(domain.getState().history[0]).toMatchObject({ id: commit.id, reversibleChanges: expect.any(Array), reversed: false });
  });

  test('stages and commits a separate safe rollback for the latest reversible commit', async () => {
    const domain = await loadDomain();
    domain.resetDemo();
    domain.beginChangeset({ title: 'Rollback source', goal: 'Create state to reverse.' });
    domain.stagePriceChange({ productId: 'p01', newPrice: 109 });
    domain.stageFeaturedProduct({ productId: 'p01', featured: true });
    domain.stageCampaign({ name: 'Rollback test', starts: '2026-08-28', ends: '2026-08-31' });
    domain.requestCommit();
    domain.approveChangeset();
    const source = domain.commitApprovedChanges();
    const rollback = domain.beginRollback({ commitId: source.id });

    expect(rollback).toMatchObject({ rollbackOf: source.id, status: 'ready_for_approval' });
    expect(domain.getProduct('p01')).toMatchObject({ price: 109, featured: true });
    domain.approveChangeset();
    domain.commitApprovedChanges();

    expect(domain.getProduct('p01')).toMatchObject({ price: 148, featured: false });
    expect(domain.getState().campaigns).toEqual([]);
    expect(domain.getState().history.find((entry) => entry.id === source.id).reversed).toBe(true);
  });
});
