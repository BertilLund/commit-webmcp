import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, CircleAlert, FileCheck2, History, Package, Pencil, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { approveChangeset, beginRollback, commitApprovedChanges, fmt, getProduct, getState, grossMargin, pct, registerWebMCP, resetDemo, runGuidedDemo, shadowProducts, stagePriceChange, subscribe } from '@/lib/domain';

const pages = [['review', 'Review'], ['catalog', 'Catalog'], ['history', 'History']];

function Status({ value }) {
  const labels = { ready_for_approval: 'Ready to approve', changes_requested: 'Needs a fix', approved: 'Approved', committed: 'Committed', rolled_back: 'Rolled back' };
  return <Badge variant={value === 'approved' || value === 'committed' ? 'default' : value === 'changes_requested' ? 'blocked' : 'outline'}>{labels[value] || value?.replaceAll('_', ' ')}</Badge>;
}

function EditPrice({ change, open, onOpenChange }) {
  const [value, setValue] = useState(change?.after.price ?? '');
  useEffect(() => setValue(change?.after.price ?? ''), [change]);
  if (!change) return null;
  const save = (event) => {
    event.preventDefault();
    stagePriceChange({ productId: change.entityId, newPrice: Number(value), reason: 'Adjusted by the reviewer' }, 'human');
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={save}><DialogHeader><p className="eyebrow">HUMAN EDIT</p><DialogTitle>Change proposed price</DialogTitle><DialogDescription>This change stays staged. It will not affect the live catalog until you approve and commit it.</DialogDescription></DialogHeader><label className="mt-6 block text-sm font-medium" htmlFor="proposed-price">Proposed price</label><div className="mt-2 flex overflow-hidden rounded-md border border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-950"><span className="px-3 py-2 text-zinc-500">$</span><input aria-label="Proposed price" className="min-w-0 flex-1 border-l border-zinc-300 px-3 py-2 outline-none" id="proposed-price" min="1" required step="1" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></div><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save change</Button></DialogFooter></form></DialogContent></Dialog>;
}

function EmptyState({ onStart }) {
  return <section className="py-20 sm:py-28"><div className="max-w-2xl"><p className="eyebrow">COMMIT / HUMAN CONTROL FOR AGENT WORK</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">Review the outcome.<br />Not every action.</h1><p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">An agent can prepare a group of changes safely. You review one clear plan, make any edit you want, then decide whether it goes live.</p><div className="mt-9 flex flex-wrap gap-3"><Button size="lg" onClick={onStart}><Sparkles className="size-4" />Run the guided demo</Button><span className="flex items-center text-sm text-zinc-500">Nothing goes live in this step.</span></div></div><div className="mt-16 grid max-w-3xl divide-y divide-zinc-200 border-y border-zinc-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Explain number="1" title="Agent prepares" copy="Changes are staged, not live." /><Explain number="2" title="You review" copy="Edit anything in the plan." /><Explain number="3" title="You decide" copy="Approve, then commit." /></div></section>;
}

function Explain({ number, title, copy }) { return <div className="py-5 sm:px-5 first:pl-0 last:pr-0"><p className="text-xs font-medium text-zinc-400">{number}</p><p className="mt-2 text-sm font-semibold">{title}</p><p className="mt-1 text-sm leading-5 text-zinc-500">{copy}</p></div>; }

function Stepper({ status }) {
  const complete = status === 'approved' || status === 'committed';
  const live = status === 'committed';
  return <div className="flex items-center gap-2 text-xs"><Step complete label="Staged" /><span className="h-px w-6 bg-zinc-200" /><Step complete={complete} label="Approved" /><span className="h-px w-6 bg-zinc-200" /><Step complete={live} label="Live" /></div>;
}
function Step({ complete, label }) { return <span className={`flex items-center gap-1.5 ${complete ? 'text-zinc-950' : 'text-zinc-400'}`}><span className={`grid size-4 place-items-center rounded-full border text-[9px] ${complete ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300'}`}>{complete && <Check className="size-2.5" />}</span>{label}</span>; }

function ChangeSummary({ changeset }) {
  const prices = changeset.changes.filter((change) => change.type === 'price').length;
  const placements = changeset.changes.filter((change) => change.type === 'feature').length;
  const campaign = changeset.changes.some((change) => change.type === 'campaign');
  return <div className="grid divide-y divide-zinc-200 rounded-lg border border-zinc-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Summary label="Prices" value={`${prices} updates`} /><Summary label="Placement" value={`${placements} features`} /><Summary label="Campaign" value={campaign ? '1 scheduled' : 'None'} /></div>;
}
function Summary({ label, value }) { return <div className="p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1.5 text-sm font-semibold">{value}</p></div>; }

function ChangeList({ changes, onEdit }) {
  return <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">{changes.map((change) => {
    const product = change.type === 'price' ? getProduct(change.entityId) : null;
    const blocked = change.status === 'blocked';
    const detail = change.type === 'price' ? <><span className="text-zinc-400 line-through">{fmt(change.before.price)}</span><ArrowRight className="size-3 text-zinc-400" /><b>{fmt(change.after.price)}</b><span className="text-zinc-500">{pct(grossMargin(product, change.after.price))} margin</span></> : change.type === 'feature' ? <><span className="text-zinc-500">{change.after.featured ? 'Feature in clearance collection' : 'Remove from collection'}</span></> : <><span className="text-zinc-500">{change.after.removal ? 'Remove live campaign' : `${change.after.starts} → ${change.after.ends}`}</span></>;
    return <div className="flex items-center gap-3 px-4 py-3.5" key={change.id}><span className={`grid size-6 shrink-0 place-items-center rounded border text-[10px] ${blocked ? 'border-zinc-950' : 'border-zinc-200'}`}>{change.type === 'price' ? '$' : change.type === 'feature' ? 'F' : 'C'}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-medium">{change.entityLabel}</p>{blocked && <Status value="changes_requested" />}</div><div className="mt-1 flex flex-wrap items-center gap-2 text-xs">{detail}</div>{blocked && <p className="mt-2 text-xs leading-5 text-zinc-600">{change.policyResults.find((result) => result.status === 'block')?.message}</p>}</div>{change.type === 'price' && <Button aria-label={`Edit ${change.entityLabel}`} size="sm" variant="ghost" onClick={() => onEdit(change)}><Pencil className="size-3.5" />Edit</Button>}</div>;
  })}</div>;
}

function Activity({ activity, ready }) {
  return <details className="mt-8 border-t border-zinc-200 pt-5"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">Agent activity <span className="text-xs font-normal text-zinc-500">{activity.length ? `${activity.length} real calls` : ready ? 'Waiting for an agent' : 'Open in a WebMCP browser'} <ChevronDown className="ml-1 inline size-3.5" /></span></summary>{activity.length ? <ol className="mt-4 divide-y divide-zinc-100 rounded-lg border border-zinc-200">{activity.map((item, index) => <li className="flex gap-3 px-4 py-3 text-xs" key={`${item.at}-${index}`}><span>{item.kind === 'read' ? 'Read' : 'Stage'}</span><span className="flex-1 font-medium">{item.tool}</span><span className="text-zinc-500">{item.detail}</span></li>)}</ol> : <p className="mt-3 text-sm leading-6 text-zinc-500">This stays empty during the guided demo. It only records calls made by a compatible WebMCP agent.</p>}</details>;
}

function NextAction({ changeset, onEdit, onHistory }) {
  const blocked = changeset.validation.block > 0;
  const firstBlocked = changeset.changes.find((change) => change.status === 'blocked');
  let title = 'Your next action'; let copy = 'Review the plan, then decide when it should go live.'; let label = `Approve ${changeset.changes.length} changes`; let action = approveChangeset; let disabled = false;
  if (blocked) { title = 'Fix one blocked change'; copy = 'The plan cannot be approved until the price meets the 25% margin policy.'; label = 'Edit blocked price'; action = () => onEdit(firstBlocked); }
  if (changeset.status === 'approved') { title = 'You approved this plan'; copy = 'The next click applies all approved changes together to the live catalog.'; label = `Commit ${changeset.changes.length} changes`; action = commitApprovedChanges; }
  if (changeset.status === 'committed') { title = 'Changes are live'; copy = `Commit ${changeset.commit.id} updated the canonical store together.`; label = 'View the audit record'; action = onHistory; }
  return <div className="sticky top-3 z-10 mt-7 rounded-lg bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-950/10"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 max-w-xl text-sm leading-5 text-zinc-400">{copy}</p></div><Button className="shrink-0 bg-white text-zinc-950 hover:bg-zinc-200" disabled={disabled} variant="outline" onClick={action}>{changeset.status === 'committed' ? <History className="size-4" /> : changeset.status === 'approved' ? <Check className="size-4" /> : <FileCheck2 className="size-4" />}{label}</Button></div></div>;
}

function Review({ changeset, onEdit, onHistory, ready }) {
  const [details, setDetails] = useState(false);
  if (!changeset) return <EmptyState onStart={runGuidedDemo} />;
  const showDetails = details || changeset.validation.block > 0;
  return <section className="py-10 sm:py-14"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">STAGED PLAN / REVISION {changeset.revision}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{changeset.title}</h1></div><div className="flex items-center gap-3"><Status value={changeset.status} /><Stepper status={changeset.status} /></div></div><p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">{changeset.goal}</p><NextAction changeset={changeset} onEdit={onEdit} onHistory={onHistory} /><div className="mt-8"><div className="mb-3 flex items-end justify-between"><div><p className="text-sm font-semibold">What will change</p><p className="mt-1 text-sm text-zinc-500">{changeset.changes.length} changes are staged. None are live yet.</p></div><button className="flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-950" onClick={() => setDetails((open) => !open)}>{showDetails ? 'Hide details' : 'View details'} {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}</button></div><ChangeSummary changeset={changeset} />{showDetails && <div className="mt-3"><ChangeList changes={changeset.changes} onEdit={onEdit} /></div>}</div><Activity activity={getState().activity} ready={ready} /></section>;
}

function Catalog() {
  const proposed = shadowProducts(); const active = getState().changeset?.status !== 'committed';
  return <section className="py-10 sm:py-14"><p className="eyebrow">CATALOG</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Live products{active && getState().changeset ? ', with staged changes' : ''}.</h1><p className="mt-3 text-sm leading-6 text-zinc-600">A crossed-out price is the live value. The bold value is proposed and will only apply after commit.</p><div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500"><tr><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Margin</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Signal</th></tr></thead><tbody>{getState().products.map((product) => { const current = proposed.find((item) => item.id === product.id); return <tr className="border-b border-zinc-100 last:border-0" key={product.id}><td className="px-4 py-3"><p className="font-medium">{product.name}</p><p className="text-xs text-zinc-500">{product.category}</p></td><td className="px-4 py-3">{product.price !== current.price && <span className="mr-2 text-zinc-400 line-through">{fmt(product.price)}</span>}<b>{fmt(current.price)}</b></td><td className="px-4 py-3">{pct(grossMargin(product, current.price))}</td><td className="px-4 py-3">{product.inventory}</td><td className="px-4 py-3 text-xs">{product.seller === 'strong' ? 'Protected' : product.seller === 'slow' ? 'Clearance fit' : 'Steady'}</td></tr>; })}</tbody></table></div></section>;
}

function CommitHistory({ onReview }) {
  const history = getState().history;
  const stageRollback = (item) => { try { beginRollback({ commitId: item.id }); onReview(); } catch (error) { window.alert(error.message); } };
  return <section className="py-10 sm:py-14"><p className="eyebrow">HISTORY</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">A clear record of what went live.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">The latest reversible commit can be staged as a fresh plan. A rollback never applies immediately.</p><div className="mt-8 divide-y divide-zinc-100 rounded-lg border border-zinc-200">{history.map((item, index) => { const rollback = index === 0 && item.reversibleChanges?.length && !item.reversed; return <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" key={item.id}><div><div className="flex items-center gap-2"><p className="font-medium">{item.title}</p><Status value={item.reversed ? 'rolled_back' : index === 0 && getState().changeset?.status === 'committed' ? 'committed' : 'archived'} /></div><p className="mt-1 text-sm text-zinc-500">{item.actor} · {item.changes} changes</p><p className="mt-2 text-xs text-zinc-500">{item.id} · revision {item.revision} · {new Date(item.at).toLocaleString()}</p></div>{rollback && <Button variant="outline" onClick={() => stageRollback(item)}><RotateCcw className="size-4" />Stage rollback</Button>}</div>; })}</div></section>;
}

export default function App() {
  const [, refresh] = useState(0); const [page, setPage] = useState('review'); const [editing, setEditing] = useState(null); const [registered, setRegistered] = useState(false);
  useEffect(() => subscribe(() => refresh((version) => version + 1)), []);
  useEffect(() => setRegistered(registerWebMCP()), []);
  const state = getState(); const ready = registered || Boolean(document.modelContext?.registerTool);
  const view = page === 'catalog' ? <Catalog /> : page === 'history' ? <CommitHistory onReview={() => setPage('review')} /> : <Review changeset={state.changeset} onEdit={setEditing} onHistory={() => setPage('history')} ready={ready} />;
  return <div className="min-h-screen bg-white"><header className="border-b border-zinc-200"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-7"><button className="flex items-center gap-2 font-semibold tracking-tight" onClick={() => setPage('review')}><span className="grid size-6 place-items-center rounded-sm bg-zinc-950 text-[10px] text-white">C</span>Commit</button><div className="flex items-center gap-4"><span className="hidden text-xs text-zinc-500 sm:inline">{ready ? 'WebMCP ready' : 'WebMCP standby'}</span><Button aria-label="Reset demo" size="sm" variant="ghost" onClick={() => { resetDemo(); setPage('review'); }}><RotateCcw className="size-3.5" />Reset</Button></div></div></header><main className="mx-auto max-w-5xl px-5 sm:px-7"><nav className="flex gap-5 border-b border-zinc-200 py-3" aria-label="Workspace">{pages.map(([id, label]) => <button className={`text-sm ${page === id ? 'font-semibold text-zinc-950' : 'text-zinc-500 hover:text-zinc-950'}`} key={id} onClick={() => setPage(id)}>{label}</button>)}</nav>{view}</main><EditPrice change={editing} open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} /></div>;
}
