import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, ExternalLink, History, Pencil, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { approveChangeset, beginRollback, commitApprovedChanges, fmt, getProduct, getState, grossMargin, pct, registerWebMCP, resetDemo, runGuidedDemo, shadowProducts, stagePriceChange, subscribe } from '@/lib/domain';

const pages = [['review', 'Review'], ['catalog', 'Catalog'], ['history', 'History']];

function StatusLine({ status }) {
  const copy = { ready_for_approval: 'Staged — nothing is live', changes_requested: 'A change needs attention', approved: 'Approved — ready to apply', committed: 'Live — applied together', rolled_back: 'Rollback staged' };
  const isLive = status === 'committed';
  return <p aria-live="polite" className="flex items-center gap-2 text-sm text-zinc-400"><span className={`size-2 rounded-full ${isLive ? 'bg-white' : 'border border-zinc-500'}`} />{copy[status] || status}</p>;
}

function EditPrice({ change, open, onOpenChange }) {
  const [value, setValue] = useState(change?.after.price ?? '');
  useEffect(() => setValue(change?.after.price ?? ''), [change]);
  if (!change) return null;
  const save = (event) => { event.preventDefault(); stagePriceChange({ productId: change.entityId, newPrice: Number(value), reason: 'Changed by the reviewer' }, 'human'); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={save}><DialogHeader><p className="eyebrow">EDIT THE PLAN</p><DialogTitle>Set a different price</DialogTitle><DialogDescription>This only changes the staged plan. The catalog stays untouched until you approve and apply it.</DialogDescription></DialogHeader><label className="mt-6 block text-sm font-medium" htmlFor="proposed-price">New proposed price</label><div className="mt-2 flex border border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-950"><span className="px-3 py-2 text-zinc-500">$</span><input aria-label="New proposed price" className="min-w-0 flex-1 border-l border-zinc-300 px-3 py-2 outline-none" id="proposed-price" min="1" required step="1" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></div><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save to plan</Button></DialogFooter></form></DialogContent></Dialog>;
}

function EmptyReview() {
  return <section className="py-20 sm:py-32"><p className="eyebrow">COMMIT / HUMAN CONTROL FOR AGENTS</p><h1 className="mt-5 max-w-3xl text-5xl font-medium leading-[0.98] tracking-[-0.06em] text-white sm:text-7xl">An agent prepares.<br />You decide.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">Commit is a safety layer for real agent work. It lets an agent prepare a complete plan, but it cannot make that plan live.</p><div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3"><Button className="h-11 rounded-none border-white bg-white px-5 text-zinc-950 hover:bg-zinc-200" onClick={runGuidedDemo}><Sparkles className="size-4" />Show me a working plan</Button><p className="text-sm text-zinc-500">Starts safely — no catalog changes.</p></div><div className="mt-20 max-w-2xl border-t border-zinc-800 pt-5 text-sm leading-7 text-zinc-400"><span className="mr-3 font-mono text-xs text-zinc-600">01</span>In the sample, the agent stages clearance pricing and a campaign. You can inspect or edit it, then explicitly approve and apply it.</div></section>;
}

function PlanAtAGlance({ changeset }) {
  const prices = changeset.changes.filter((change) => change.type === 'price').length;
  const features = changeset.changes.filter((change) => change.type === 'feature').length;
  const campaign = changeset.changes.some((change) => change.type === 'campaign');
  return <div className="border-y border-zinc-800 py-6"><p className="eyebrow">THE AGENT PLANS TO</p><ul className="mt-4 space-y-3 text-lg leading-7 text-zinc-200"><li><span className="mr-3 text-zinc-600">—</span>Update {prices} clearance prices</li><li><span className="mr-3 text-zinc-600">—</span>Feature {features} selected products</li>{campaign && <li><span className="mr-3 text-zinc-600">—</span>Schedule one campaign</li>}</ul></div>;
}

function ChangeList({ changes, onEdit }) {
  return <ol className="divide-y divide-zinc-800 border-t border-zinc-800">{changes.map((change, index) => {
    const product = change.type === 'price' ? getProduct(change.entityId) : null;
    const isBlocked = change.status === 'blocked';
    let detail = null;
    if (change.type === 'price') detail = <><span className="line-through text-zinc-600">{fmt(change.before.price)}</span><ArrowRight className="size-3 text-zinc-600" /><strong className="font-medium text-white">{fmt(change.after.price)}</strong><span className="text-zinc-500">{pct(grossMargin(product, change.after.price))} margin</span></>;
    if (change.type === 'feature') detail = <span className="text-zinc-400">{change.after.featured ? 'Add to the clearance collection' : 'Remove from collection'}</span>;
    if (change.type === 'campaign') detail = <span className="text-zinc-400">{change.after.removal ? 'Remove the campaign' : `${change.after.starts} to ${change.after.ends}`}</span>;
    return <li className="flex gap-4 py-4" key={change.id}><span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-zinc-600">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-sm font-medium text-white">{change.entityLabel}</p>{isBlocked && <span className="border border-white px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white">Needs edit</span>}</div><div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">{detail}</div>{isBlocked && <p className="mt-2 text-sm text-zinc-300">{change.policyResults.find((result) => result.status === 'block')?.message}</p>}</div>{change.type === 'price' && <button aria-label={`Edit ${change.entityLabel}`} className="flex h-7 items-center gap-1 self-center border-b border-zinc-600 text-xs text-zinc-300 transition hover:border-white hover:text-white" onClick={() => onEdit(change)}><Pencil className="size-3" />Edit</button>}</li>;
  })}</ol>;
}

function DecisionBar({ changeset, onEdit, onHistory }) {
  const isBlocked = changeset.validation.block > 0;
  const blockedChange = changeset.changes.find((change) => change.status === 'blocked');
  if (changeset.status === 'committed') return <div className="mt-9 border-t border-white pt-5 sm:flex sm:items-center sm:justify-between"><div><p className="text-lg font-medium text-white">Changes applied.</p><p className="mt-1 text-sm text-zinc-400">Commit {changeset.commit.id} changed the live catalog as one transaction.</p></div><Button className="mt-4 rounded-none border-white bg-white text-zinc-950 hover:bg-zinc-200 sm:mt-0" variant="outline" onClick={onHistory}><History className="size-4" />View the audit record</Button></div>;
  let title = 'Nothing happens until you say so.';
  let copy = 'Approval locks this exact version of the plan. You can still inspect or edit it first.';
  let label = 'Approve this plan';
  let action = approveChangeset;
  if (isBlocked) { title = 'One change needs a fix.'; copy = 'The proposed price must meet the 25% margin policy before the plan can be approved.'; label = 'Edit the blocked price'; action = () => onEdit(blockedChange); }
  if (changeset.status === 'approved') { title = 'This exact plan is approved.'; copy = 'Apply it to make every approved change live together. Any edit will require a new approval.'; label = 'Commit this plan'; action = commitApprovedChanges; }
  return <div className="mt-9 border-t border-zinc-700 pt-5 sm:flex sm:items-end sm:justify-between"><div><p className="text-lg font-medium text-white">{title}</p><p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">{copy}</p></div><Button className="mt-5 h-11 rounded-none border-white bg-white px-5 text-zinc-950 hover:bg-zinc-200 sm:mt-0" variant="outline" onClick={action}>{changeset.status === 'approved' && <Check className="size-4" />}{label}</Button></div>;
}

function AgentActivity({ activity, ready }) {
  return <details className="mt-12 border-t border-zinc-800 py-5"><summary className="flex cursor-pointer list-none items-center justify-between text-sm text-zinc-400"><span>Actual agent activity</span><span className="flex items-center gap-2 font-mono text-xs text-zinc-600">{activity.length ? `${activity.length} calls` : ready ? 'ready for an agent' : 'WebMCP unavailable'}<ChevronDown className="size-3" /></span></summary>{activity.length ? <ol className="mt-4 space-y-2 font-mono text-xs text-zinc-500">{activity.map((item, index) => <li key={`${item.at}-${index}`}>{item.tool} <span className="text-zinc-700">/</span> {item.detail}</li>)}</ol> : <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">The guided plan is a local sample. This area records tool calls when a compatible WebMCP agent uses the real tools.</p>}</details>;
}

function Review({ changeset, onEdit, onHistory, ready }) {
  const [showChanges, setShowChanges] = useState(false);
  if (!changeset) return <EmptyReview />;
  const expanded = showChanges || changeset.validation.block > 0;
  return <section className="py-12 sm:py-20"><div className="flex flex-wrap items-center justify-between gap-4"><p className="eyebrow">AGENT PLAN / REVISION {changeset.revision}</p><StatusLine status={changeset.status} /></div><h1 className="mt-5 max-w-3xl text-4xl font-medium leading-tight tracking-[-0.05em] text-white sm:text-6xl">{changeset.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">{changeset.goal}</p><div className="mt-12"><PlanAtAGlance changeset={changeset} /></div><div className="mt-7"><button className="flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white" onClick={() => setShowChanges((value) => !value)}>{expanded ? 'Hide all changes' : `Review all ${changeset.changes.length} changes`}{expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</button>{expanded && <ChangeList changes={changeset.changes} onEdit={onEdit} />}</div><DecisionBar changeset={changeset} onEdit={onEdit} onHistory={onHistory} /><AgentActivity activity={getState().activity} ready={ready} /></section>;
}

function Catalog() {
  const proposed = shadowProducts();
  const changeset = getState().changeset;
  const hasPlan = changeset && changeset.status !== 'committed';
  return <section className="py-12 sm:py-20"><p className="eyebrow">CATALOG</p><h1 className="mt-5 text-4xl font-medium tracking-[-0.05em] text-white sm:text-6xl">What is live{hasPlan ? ', and what is proposed' : ''}.</h1><p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">{hasPlan ? 'Crossed-out prices are live. The bright price is still only in the plan.' : 'This is the current canonical catalog.'}</p><div className="mt-12 overflow-x-auto border-y border-zinc-800"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-zinc-800 font-mono text-[11px] uppercase tracking-wide text-zinc-600"><tr><th className="px-0 py-4 font-medium">Product</th><th className="py-4 font-medium">Price</th><th className="py-4 font-medium">Margin</th><th className="py-4 font-medium">Stock</th><th className="py-4 font-medium">Signal</th></tr></thead><tbody>{getState().products.map((product) => { const current = proposed.find((item) => item.id === product.id); return <tr className="border-b border-zinc-900 last:border-0" key={product.id}><td className="py-4"><p className="font-medium text-white">{product.name}</p><p className="mt-1 text-xs text-zinc-600">{product.category}</p></td><td className="py-4">{product.price !== current.price && <span className="mr-2 text-zinc-600 line-through">{fmt(product.price)}</span>}<strong className="font-medium text-white">{fmt(current.price)}</strong></td><td className="py-4 text-zinc-400">{pct(grossMargin(product, current.price))}</td><td className="py-4 text-zinc-400">{product.inventory}</td><td className="py-4 text-zinc-500">{product.seller === 'strong' ? 'Protected' : product.seller === 'slow' ? 'Clearance fit' : 'Steady'}</td></tr>; })}</tbody></table></div></section>;
}

function CommitHistory({ onReview }) {
  const history = getState().history;
  const stageRollback = (item) => { try { beginRollback({ commitId: item.id }); onReview(); } catch (error) { window.alert(error.message); } };
  return <section className="py-12 sm:py-20"><p className="eyebrow">AUDIT LOG</p><h1 className="mt-5 text-4xl font-medium tracking-[-0.05em] text-white sm:text-6xl">Everything live is explainable.</h1><p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">A rollback is always another staged plan. It never undoes live work immediately.</p><ol className="mt-12 divide-y divide-zinc-800 border-y border-zinc-800">{history.map((item, index) => { const rollback = index === 0 && item.reversibleChanges?.length && !item.reversed; return <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between" key={item.id}><div><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="font-medium text-white">{item.title}</p><span className="font-mono text-[10px] uppercase tracking-wide text-zinc-600">{item.reversed ? 'Reversed' : 'Committed'}</span></div><p className="mt-2 text-sm text-zinc-500">{item.actor} · {item.changes} changes · {item.id}</p></div>{rollback && <button className="flex w-fit items-center gap-2 border-b border-zinc-600 pb-1 text-sm text-zinc-300 transition hover:border-white hover:text-white" onClick={() => stageRollback(item)}><RotateCcw className="size-3.5" />Stage a rollback</button>}</li>; })}</ol></section>;
}

export default function App() {
  const [, refresh] = useState(0);
  const [page, setPage] = useState('review');
  const [editing, setEditing] = useState(null);
  const [registered, setRegistered] = useState(false);
  useEffect(() => subscribe(() => refresh((version) => version + 1)), []);
  useEffect(() => setRegistered(registerWebMCP()), []);
  const state = getState();
  const ready = registered || Boolean(document.modelContext?.registerTool);
  const view = page === 'catalog' ? <Catalog /> : page === 'history' ? <CommitHistory onReview={() => setPage('review')} /> : <Review changeset={state.changeset} onEdit={setEditing} onHistory={() => setPage('history')} ready={ready} />;
  return <div className="min-h-screen bg-[#0a0a0a] text-zinc-100"><header className="border-b border-zinc-800"><div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-0"><button className="flex items-center gap-2.5 font-medium tracking-[-0.03em] text-white" onClick={() => setPage('review')}><span className="grid size-6 place-items-center border border-zinc-600 font-mono text-[10px]">C</span>Commit</button><div className="flex items-center gap-5"><span className="hidden font-mono text-[10px] uppercase tracking-wide text-zinc-600 sm:inline">{ready ? 'WebMCP ready' : 'WebMCP standby'}</span><button aria-label="Reset demo" className="text-xs text-zinc-500 transition hover:text-white" onClick={() => { resetDemo(); setPage('review'); }}><RotateCcw className="mr-1 inline size-3" />Reset</button></div></div></header><main className="mx-auto max-w-3xl px-5 sm:px-0"><nav aria-label="Workspace" className="flex gap-5 py-4 font-mono text-[11px] uppercase tracking-wide">{pages.map(([id, label]) => <button className={page === id ? 'text-white' : 'text-zinc-600 transition hover:text-zinc-300'} key={id} onClick={() => setPage(id)}>{label}</button>)}</nav>{view}</main><footer className="mx-auto flex max-w-3xl items-center justify-between border-t border-zinc-800 px-5 py-6 text-xs text-zinc-600 sm:px-0"><span>Human approval for agent actions.</span><span className="flex items-center gap-1">WebMCP demo <ExternalLink className="size-3" /></span></footer><EditPrice change={editing} open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} /></div>;
}
