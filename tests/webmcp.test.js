// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from 'vitest';

let domain;
let tools;

const payload = (result) => JSON.parse(result.content[0].text);

beforeEach(async () => {
  localStorage.clear();
  tools = [];
  document.modelContext = {
    registerTool: vi.fn((tool) => {
      tools.push(tool);
      return Promise.resolve();
    }),
  };
  vi.resetModules();
  domain = await import('../src/lib/domain.js');
});

describe('WebMCP browser tool layer', () => {
  test('registers the complete strict tool surface', () => {
    expect(domain.registerWebMCP()).toBe(true);
    expect(tools.map((tool) => tool.name)).toEqual([
      'get_store_summary', 'list_products', 'get_store_policies', 'begin_changeset',
      'stage_price_change', 'stage_featured_product', 'stage_campaign', 'list_campaigns',
      'get_changeset', 'validate_changeset', 'request_commit', 'commit_approved_changes',
      'get_commit_history', 'begin_rollback', 'reset_demo',
    ]);
    const priceTool = tools.find((tool) => tool.name === 'stage_price_change');
    expect(priceTool.inputSchema.required).toEqual(['productId', 'newPrice']);
    expect(priceTool.inputSchema.additionalProperties).toBe(false);
  });

  test('returns structured policy feedback and only commits an approved revision', () => {
    domain.registerWebMCP();
    const call = (name, input) => payload(tools.find((tool) => tool.name === name).execute(input));

    expect(call('begin_changeset', { title: 'Tool test', goal: 'Exercise the real callback layer.' }).status).toBe('draft');
    const blocked = call('stage_price_change', { productId: 'p01', newPrice: 80, reason: 'Deliberately unsafe test.' });
    expect(blocked.validation.block).toBe(1);
    expect(call('request_commit')).toMatchObject({ status: 'error', message: expect.stringMatching(/Correct blocked policy/) });

    const corrected = call('stage_price_change', { productId: 'p01', newPrice: 109, reason: 'Corrected to policy.' });
    expect(corrected.validation.block).toBe(0);
    expect(call('request_commit')).toMatchObject({ status: 'ready_for_approval', revision: 3 });
    expect(call('commit_approved_changes')).toMatchObject({ status: 'error', message: expect.stringMatching(/Human approval/) });

    domain.approveChangeset();
    expect(call('commit_approved_changes').id).toMatch(/^CMT_/);
    expect(domain.getProduct('p01').price).toBe(109);
  });
});
