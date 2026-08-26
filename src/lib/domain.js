const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const fmt = (value) => USD.format(value);
export const pct = (value) => `${Math.round(value * 100)}%`;
const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

const rows = [
  ['Aster Field Jacket', 'Outerwear', 148, 70, 34, 1.8, .029, 'slow'], ['Kite Trail Shell', 'Outerwear', 188, 96, 18, 1.2, .021, 'slow'], ['Mercer Wool Overshirt', 'Outerwear', 168, 76, 51, 4.7, .061, 'strong'], ['Northline Canvas Chore', 'Outerwear', 134, 54, 43, 2.1, .035, 'slow'], ['Tidal Cotton Tee', 'Essentials', 46, 12, 161, 7.4, .089, 'strong'], ['Sable Rib Tank', 'Essentials', 38, 10, 118, 3.3, .052, 'steady'], ['Morrow Oxford Shirt', 'Essentials', 94, 32, 69, 2.6, .044, 'slow'], ['Hearth Knit Polo', 'Essentials', 98, 38, 24, 1.5, .025, 'slow'], ['Silt Pleated Trouser', 'Bottoms', 124, 48, 56, 2.2, .032, 'slow'], ['Vela Utility Pant', 'Bottoms', 138, 62, 39, 3.9, .058, 'strong'], ['Dune Relaxed Short', 'Bottoms', 72, 26, 87, 3.4, .051, 'steady'], ['Arrow Denim', 'Bottoms', 118, 44, 44, 1.7, .028, 'slow'], ['Mica Carryall', 'Accessories', 96, 38, 21, 1.9, .031, 'slow'], ['Cedar Weekender', 'Accessories', 172, 80, 14, 1.3, .018, 'slow'], ['Orbit Cap', 'Accessories', 42, 11, 96, 4.8, .068, 'strong'], ['Alder Leather Belt', 'Accessories', 64, 22, 33, 2.5, .039, 'steady'], ['Harbor Everyday Sneaker', 'Footwear', 132, 61, 48, 3.6, .054, 'strong'], ['Tundra Suede Mule', 'Footwear', 118, 49, 16, 1.4, .022, 'slow'], ['Hollow Trail Sandal', 'Footwear', 86, 36, 29, 1.9, .031, 'slow'], ['Vesper Sock 3-Pack', 'Essentials', 28, 7, 203, 5.5, .074, 'strong'],
];
const seeds = rows.map((row, index) => ({ id: `p${String(index + 1).padStart(2, '0')}`, name: row[0], category: row[1], price: row[2], cost: row[3], inventory: row[4], velocity: row[5], conversion: row[6], seller: row[7], featured: false }));

export const fresh = () => ({
  version: 12,
  products: structuredClone(seeds),
  campaigns: [],
  changeset: null,
  activity: [],
  history: [{ id: 'CMT_7A92', title: 'August catalog tidy-up', actor: 'Maya Chen · Merchandising', at: '2026-08-24T10:20:00Z', changes: 3, revision: 4 }],
});

let state;
try { state = JSON.parse(localStorage.commitDemo) || fresh(); } catch { state = fresh(); }
if (!Array.isArray(state.campaigns)) state.campaigns = [];
const listeners = new Set();
const persist = () => { try { localStorage.commitDemo = JSON.stringify(state); } catch { /* demo remains usable when storage is unavailable */ } };
const emit = () => { persist(); listeners.forEach((listener) => listener()); };
export const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const getState = () => state;
export const getProduct = (id) => state.products.find((product) => product.id === id);
export const grossMargin = (product, price = product.price) => (price - product.cost) / price;

export function shadowProducts() {
  const products = structuredClone(state.products);
  for (const change of state.changeset?.changes || []) {
    const product = products.find((entry) => entry.id === change.entityId);
    if (product && change.type === 'price') product.price = change.after.price;
    if (product && change.type === 'feature') product.featured = change.after.featured;
  }
  return products;
}

export function resetDemo() { state = fresh(); emit(); return { status: 'reset', storeVersion: state.version }; }
export function audit(tool, kind, detail, outcome = 'success') {
  state.activity.unshift({ tool, kind, detail, outcome, at: now() });
  state.activity = state.activity.slice(0, 9);
  emit();
}

export function policyFor(change) {
  const outcomes = [];
  if (change.type === 'price') {
    const product = getProduct(change.entityId);
    const newMargin = grossMargin(product, change.after.price);
    const reduction = 1 - change.after.price / product.price;
    if (change.after.price <= 0) outcomes.push({ status: 'block', message: 'Proposed price must be positive.' });
    outcomes.push(newMargin < .25 ? { status: 'block', message: `${product.name} would land at ${pct(newMargin)} gross margin; policy minimum is 25%.` } : { status: 'pass', message: `${pct(newMargin)} gross margin meets the 25% minimum.` });
    outcomes.push(reduction > .5 ? { status: 'warn', message: `${pct(reduction)} reduction exceeds the review threshold.` } : { status: 'pass', message: 'Reduction is within the review threshold.' });
    if (product.seller === 'strong' && reduction > 0) outcomes.push({ status: 'block', message: `${product.name} is a strong seller and cannot be discounted.` });
  }
  if (change.type === 'campaign') outcomes.push(change.after.starts < change.after.ends ? { status: 'pass', message: 'Campaign dates are valid.' } : { status: 'block', message: 'Campaign must end after it starts.' });
  return outcomes;
}

export function validateChangeset({ notify = true } = {}) {
  const changeset = state.changeset;
  if (!changeset) return {};
  const results = changeset.changes.flatMap((change) => {
    change.policyResults = policyFor(change);
    change.status = change.policyResults.some((item) => item.status === 'block') ? 'blocked' : 'valid';
    return change.policyResults;
  });
  changeset.validation = { pass: results.filter((item) => item.status === 'pass').length, warn: results.filter((item) => item.status === 'warn').length, block: results.filter((item) => item.status === 'block').length };
  changeset.status = changeset.validation.block ? 'changes_requested' : 'ready_for_approval';
  if (notify) emit();
  return changeset.validation;
}

export function beginChangeset({ title = 'Weekend Clearance', goal = 'Clear slow-moving inventory while protecting gross margin' }) {
  if (state.changeset && !['committed', 'rolled_back'].includes(state.changeset.status)) throw new Error('An active change set already exists.');
  state.changeset = { id: uid('cs'), title, goal, status: 'draft', baseVersion: state.version, revision: 1, changes: [], validation: { pass: 0, warn: 0, block: 0 }, approval: null };
  emit();
  return state.changeset;
}
function revise(source) { state.changeset.revision += 1; state.changeset.approval = null; state.changeset.status = 'staging'; state.changeset.lastEditedBy = source; }

export function stagePriceChange({ productId, newPrice, reason = 'Clear slow-moving inventory' }, source = 'agent') {
  const changeset = state.changeset;
  const product = getProduct(productId);
  if (!changeset) throw new Error('Start a change set first.');
  if (!product) throw new Error(`Unknown product: ${productId}`);
  if (!Number.isFinite(newPrice)) throw new Error('New price must be a number.');
  const existing = changeset.changes.find((change) => change.type === 'price' && change.entityId === productId);
  if (existing) { existing.after.price = newPrice; existing.reason = reason; existing.source = source; }
  else changeset.changes.push({ id: uid('chg'), type: 'price', entityId: productId, entityLabel: product.name, before: { price: product.price }, after: { price: newPrice }, reason, source, policyResults: [] });
  revise(source); const validation = validateChangeset({ notify: false }); emit(); return { validation };
}
export function stageFeaturedProduct({ productId, featured = true, reason = 'Feature a clearance opportunity' }, source = 'agent') {
  const changeset = state.changeset; const product = getProduct(productId);
  if (!changeset || !product) throw new Error('Start a change set and use a valid product.');
  const existing = changeset.changes.find((change) => change.type === 'feature' && change.entityId === productId);
  if (existing) existing.after.featured = featured;
  else changeset.changes.push({ id: uid('chg'), type: 'feature', entityId: productId, entityLabel: product.name, before: { featured: product.featured }, after: { featured }, reason, source, policyResults: [] });
  revise(source); validateChangeset({ notify: false }); emit(); return changeset;
}
export function stageCampaign({ name, starts, ends, reason = 'Coordinate the clearance window' }) {
  const changeset = state.changeset; if (!changeset) throw new Error('Start a change set first.');
  const existing = changeset.changes.find((change) => change.type === 'campaign');
  if (existing) { existing.entityLabel = name; existing.after = { name, starts, ends }; }
  else changeset.changes.push({ id: uid('chg'), type: 'campaign', entityId: 'campaign', entityLabel: name, before: {}, after: { name, starts, ends }, reason, source: 'agent', policyResults: [] });
  revise('agent'); validateChangeset({ notify: false }); emit(); return changeset;
}
const contentHash = (changeset) => `revision-${changeset.revision}-${changeset.changes.length}-${JSON.stringify(changeset.changes).length}`;
export function requestCommit() {
  const changeset = state.changeset; if (!changeset) throw new Error('No active change set.');
  const validation = validateChangeset({ notify: false });
  if (validation.block) { emit(); throw new Error('Correct blocked policy results before approval.'); }
  changeset.status = 'ready_for_approval'; emit(); return { status: changeset.status, revision: changeset.revision, contentHash: contentHash(changeset) };
}
export function approveChangeset() {
  const changeset = state.changeset;
  if (changeset?.status !== 'ready_for_approval') throw new Error('This revision is not ready for approval.');
  changeset.approval = { revision: changeset.revision, contentHash: contentHash(changeset), approvedAt: now(), approvedBy: 'human' };
  changeset.status = 'approved'; emit(); return changeset.approval;
}
export function commitApprovedChanges() {
  const changeset = state.changeset;
  if (!changeset?.approval) throw new Error('Human approval is required.');
  if (changeset.approval.revision !== changeset.revision || changeset.approval.contentHash !== contentHash(changeset)) throw new Error('Approval is stale.');
  if (changeset.baseVersion !== state.version) throw new Error('Store changed; recreate this change set.');
  if (validateChangeset({ notify: false }).block) { emit(); throw new Error('Blocked policy result.'); }
  changeset.changes.forEach((change) => {
    const product = getProduct(change.entityId);
    if (product && change.type === 'price') product.price = change.after.price;
    if (product && change.type === 'feature') product.featured = change.after.featured;
    if (change.type === 'campaign' && change.after.removal) state.campaigns = state.campaigns.filter((campaign) => campaign.name !== change.after.name);
    if (change.type === 'campaign' && !change.after.removal) state.campaigns = [...state.campaigns.filter((campaign) => campaign.name !== change.after.name), { ...change.after, sourceChange: change.id }];
  });
  state.version += 1; changeset.status = 'committed'; changeset.commit = { id: uid('cmt').toUpperCase(), at: now() };
  state.history.unshift({ id: changeset.commit.id, title: changeset.title, actor: 'Human approval · agent staged', at: changeset.commit.at, changes: changeset.changes.length, revision: changeset.revision, reversibleChanges: structuredClone(changeset.changes), reversed: false });
  if (changeset.rollbackOf) { const original = state.history.find((item) => item.id === changeset.rollbackOf); if (original) original.reversed = true; }
  emit(); return changeset.commit;
}

export function beginRollback({ commitId }) {
  const record = state.history.find((item) => item.id === commitId);
  if (!record?.reversibleChanges?.length) throw new Error('This legacy audit entry does not retain a reversible payload.');
  if (record !== state.history[0]) throw new Error('Only the most recent commit can be safely rolled back.');
  if (record.reversed) throw new Error('This commit has already been reversed.');
  if (state.changeset && !['committed', 'rolled_back'].includes(state.changeset.status)) throw new Error('Finish or reset the active change set before staging a rollback.');
  const changes = record.reversibleChanges.flatMap((change) => {
    const product = getProduct(change.entityId);
    if (change.type === 'price' && product) return [{ id: uid('chg'), type: 'price', entityId: product.id, entityLabel: product.name, before: { price: product.price }, after: { price: change.before.price }, reason: `Safe reversal of ${record.id}.`, source: 'agent', policyResults: [] }];
    if (change.type === 'feature' && product) return [{ id: uid('chg'), type: 'feature', entityId: product.id, entityLabel: product.name, before: { featured: product.featured }, after: { featured: change.before.featured }, reason: `Safe reversal of ${record.id}.`, source: 'agent', policyResults: [] }];
    if (change.type === 'campaign') return [{ id: uid('chg'), type: 'campaign', entityId: 'campaign', entityLabel: `End ${change.after.name}`, before: { ...change.after }, after: { ...change.after, removal: true }, reason: `Safe reversal of ${record.id}.`, source: 'agent', policyResults: [] }];
    return [];
  });
  state.changeset = { id: uid('cs'), title: `Rollback ${record.id}`, goal: `Safely reverse the latest committed change set, ${record.title}.`, status: 'staging', baseVersion: state.version, revision: 1, changes, validation: { pass: 0, warn: 0, block: 0 }, approval: null, rollbackOf: record.id };
  validateChangeset({ notify: false }); emit(); return state.changeset;
}
export function runGuidedDemo() {
  beginChangeset({ title: 'Weekend Clearance', goal: 'Clear slow-moving inventory and maximize expected revenue while protecting gross margin.' });
  [['p01', 109], ['p04', 99], ['p07', 69], ['p09', 89], ['p12', 82], ['p13', 72], ['p18', 82]].forEach(([productId, newPrice]) => stagePriceChange({ productId, newPrice, reason: 'Slow velocity and aged inventory justify this measured clearance action.' }));
  ['p01', 'p04', 'p07', 'p09', 'p18'].forEach((productId) => stageFeaturedProduct({ productId }));
  stageCampaign({ name: 'Weekend Field Clearance', starts: '2026-08-28', ends: '2026-08-31' });
}

let registered = false;
export function registerWebMCP() {
  const modelContext = document.modelContext;
  if (registered) return true;
  if (!modelContext?.registerTool) return false;
  registered = true;
  const response = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
  const register = (name, description, inputSchema, kind, action) => modelContext.registerTool({ name, description, inputSchema, execute(input) { try { const result = action(input || {}); audit(name, kind, kind === 'read' ? 'Read canonical/shared state' : 'Updated staged change set'); return response(result); } catch (error) { audit(name, kind, error.message, 'error'); return response({ status: 'error', message: error.message }); } } }).catch(() => {});
  const none = { type: 'object', properties: {}, additionalProperties: false };
  register('get_store_summary', 'Read canonical store health, current version, active change-set state, and high-level merchandising signals.', none, 'read', () => ({ storeVersion: state.version, products: state.products.length, campaigns: state.campaigns.length, activeChangeSet: state.changeset && { id: state.changeset.id, status: state.changeset.status, revision: state.changeset.revision } }));
  register('list_products', 'Read product metrics needed to identify clearance opportunities.', { type: 'object', properties: { seller: { type: 'string', enum: ['slow', 'steady', 'strong'] } }, additionalProperties: false }, 'read', ({ seller }) => ({ products: state.products.filter((product) => !seller || product.seller === seller).map((product) => ({ ...product, margin: grossMargin(product) })) }));
  register('get_store_policies', 'Read deterministic guardrails applied to every staged change and atomic commit.', none, 'read', () => ({ minimumGrossMargin: .25, maximumReduction: .5, strongSellerDiscounts: 'blocked', invalidPrices: 'blocked' }));
  register('begin_changeset', 'Create a new isolated change set. This never mutates canonical store.', { type: 'object', properties: { title: { type: 'string' }, goal: { type: 'string' } }, required: ['title', 'goal'], additionalProperties: false }, 'stage', beginChangeset);
  register('stage_price_change', 'Stage a product price in shadow state until human approval and commit.', { type: 'object', properties: { productId: { type: 'string' }, newPrice: { type: 'number' }, reason: { type: 'string' } }, required: ['productId', 'newPrice'], additionalProperties: false }, 'stage', stagePriceChange);
  register('stage_featured_product', 'Stage a clearance collection placement without changing the live storefront.', { type: 'object', properties: { productId: { type: 'string' }, featured: { type: 'boolean' } }, required: ['productId'], additionalProperties: false }, 'stage', stageFeaturedProduct);
  register('stage_campaign', 'Stage a new campaign with valid ISO dates.', { type: 'object', properties: { name: { type: 'string' }, starts: { type: 'string' }, ends: { type: 'string' } }, required: ['name', 'starts', 'ends'], additionalProperties: false }, 'stage', stageCampaign);
  register('list_campaigns', 'Read the canonical campaigns that are already live.', none, 'read', () => ({ campaigns: state.campaigns }));
  register('get_changeset', 'Read the shared change set, human edits, revision, validation, and approval state.', none, 'read', () => state.changeset || { status: 'none' });
  register('validate_changeset', 'Run deterministic policy validation against staged changes.', none, 'stage', validateChangeset);
  register('request_commit', 'Request human approval for the exact validated revision; this never commits.', none, 'stage', requestCommit);
  register('commit_approved_changes', 'Atomically commit only after human approval of the unchanged revision.', none, 'commit', commitApprovedChanges);
  register('get_commit_history', 'Read immutable audit records for committed change sets.', none, 'read', () => state.history);
  register('begin_rollback', 'Stage a safe, reviewable reversal of the latest reversible commit. This never mutates canonical store directly.', { type: 'object', properties: { commitId: { type: 'string' } }, required: ['commitId'], additionalProperties: false }, 'stage', beginRollback);
  register('reset_demo', 'Restore deterministic demo data in the local workspace.', none, 'stage', resetDemo);
  return true;
}
