import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, History, Pencil, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { approveChangeset, beginRollback, commitApprovedChanges, fmt, getProduct, getState, grossMargin, pct, registerWebMCP, resetDemo, runGuidedDemo, shadowProducts, stagePriceChange, subscribe } from '@/lib/domain';

function EditPrice({ change, open, onOpenChange }) {
  const [value, setValue] = useState(change?.after.price ?? '');
  useEffect(() => setValue(change?.after.price ?? ''), [change]);
  if (!change) return null;
  const save = (event) => { event.preventDefault(); stagePriceChange({ productId: change.entityId, newPrice: Number(value), reason: 'Changed by the reviewer' }, 'human'); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={save}><DialogHeader><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Edit the plan</p><DialogTitle>Choose a different price</DialogTitle><DialogDescription>This stays proposed. It will not change the store until you approve and apply the plan.</DialogDescription></DialogHeader><label className="mt-6 block text-sm font-medium" htmlFor="proposed-price">Proposed price</label><div className="mt-2 flex rounded-lg bg-zinc-100 px-3 focus-within:ring-2 focus-within:ring-zinc-950"><span className="py-2.5 text-zinc-500">$</span><input aria-label="New proposed price" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 outline-none" id="proposed-price" min="1" required step="1" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></div><DialogFooter className="mt-6"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="border-0" type="submit">Save price</Button></DialogFooter></form></DialogContent></Dialog>;
}

function EmptyState() {
  return <section className="py-20 sm:py-32"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Commit</p><h1 className="mt-5 max-w-2xl text-5xl font-medium leading-[0.98] tracking-[-0.065em] text-zinc-950 sm:text-7xl">Approve work before it changes your store.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-zinc-600">An agent can prepare many catalog actions at once. Commit turns them into one plan for you to review, edit, approve, and finally apply.</p><Button className="mt-10 h-12 rounded-xl border-0 px-5 focus-visible:ring-offset-2" onClick={runGuidedDemo}><Sparkles className="size-4" />Create a clearance plan</Button><p className="mt-4 text-sm text-zinc-500">Creates a safe proposal. No live changes.</p></section>;
}

function PlanList({ changes, onEdit }) {
  return <ol className="mt-7 space-y-5">{changes.map((change, index) => {
    const product = change.type === 'price' ? getProduct(change.entityId) : null;
    const blocked = change.status === 'blocked';
    let detail = null;
    if (change.type === 'price') detail = <><span className="line-through text-zinc-400">{fmt(change.before.price)}</span><ArrowRight className="size-3 text-zinc-400" /><strong>{fmt(change.after.price)}</strong><span className="text-zinc-500">{pct(grossMargin(product, change.after.price))} margin</span></>;
    if (change.type === 'feature') detail = <span className="text-zinc-600">Feature this product in the campaign.</span>;
    if (change.type === 'campaign') detail = <span className="text-zinc-600">{change.after.starts} to {change.after.ends}</span>;
    return <li className="flex gap-4" key={change.id}><span className="pt-0.5 font-mono text-xs text-zinc-400">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-sm font-medium">{change.entityLabel}</p>{blocked && <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">Needs a fix</span>}</div><div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">{detail}</div>{blocked && <p className="mt-2 text-sm text-zinc-700">{change.policyResults.find((result) => result.status === 'block')?.message}</p>}</div>{change.type === 'price' && <button aria-label={`Edit ${change.entityLabel}`} className="mt-0.5 text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950" onClick={() => onEdit(change)}><Pencil className="mr-1 inline size-3" />Edit</button>}</li>;
  })}</ol>;
}

function Activity({ activity }) {
  if (!activity.length) return null;
  return <details className="mt-14 text-sm"><summary className="cursor-pointer text-zinc-500 transition hover:text-zinc-950">Show actual agent activity <ChevronDown className="ml-1 inline size-3" /></summary><ol className="mt-4 space-y-2 font-mono text-xs text-zinc-500">{activity.map((item, index) => <li key={`${item.at}-${index}`}><span className="text-zinc-950">{item.tool}</span> · {item.detail}</li>)}</ol></details>;
}

function PlanScreen({ changeset, onEdit, onCatalog, onHistory }) {
  const [details, setDetails] = useState(false);
  const blocked = changeset.validation.block > 0;
  const firstBlocked = changeset.changes.find((change) => change.status === 'blocked');
  const prices = changeset.changes.filter((change) => change.type === 'price').length;
  const features = changeset.changes.filter((change) => change.type === 'feature').length;
  const campaign = changeset.changes.some((change) => change.type === 'campaign');
  let state = 'Not live';
  let headline = 'Ready for your decision.';
  let copy = 'These changes are proposed only. Your store has not changed.';
  let action = approveChangeset;
  let label = 'Approve this plan';
  if (blocked) { state = 'Needs attention'; headline = 'One proposed change needs a fix.'; copy = 'The plan cannot be approved until that price meets the margin policy.'; action = () => onEdit(firstBlocked); label = 'Fix the price'; }
  if (changeset.status === 'approved') { state = 'Approved'; headline = 'You approved this exact plan.'; copy = `Apply all ${changeset.changes.length} changes to the store at once.`; action = commitApprovedChanges; label = 'Apply these changes'; }
  if (changeset.status === 'committed') return <section className="py-16 sm:py-24"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Live</p><h1 className="mt-4 text-5xl font-medium tracking-[-0.06em] sm:text-7xl">Your store is updated.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">All {changeset.changes.length} approved changes were applied together. Commit {changeset.commit.id} is saved in the audit record.</p><div className="mt-10 flex flex-wrap gap-3"><Button className="h-11 rounded-xl border-0" onClick={onCatalog}>See the updated catalog</Button><Button className="h-11 rounded-xl" variant="outline" onClick={onHistory}><History className="size-4" />See the audit record</Button></div></section>;
  return <section className="py-16 sm:py-24"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">{state}</p><h1 className="mt-4 text-5xl font-medium tracking-[-0.06em] sm:text-7xl">{headline}</h1><p aria-live="polite" className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">{copy}</p><div className="mt-12"><p className="text-sm font-medium">If you apply it, the store will:</p><ul className="mt-4 space-y-2.5 text-base text-zinc-700"><li>Lower {prices} clearance prices</li><li>Feature {features} products</li>{campaign && <li>Schedule one weekend campaign</li>}</ul></div><button className="mt-8 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-950" onClick={() => setDetails((open) => !open)}>{details ? 'Hide the individual changes' : `See all ${changeset.changes.length} individual changes`}{details ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</button>{details && <PlanList changes={changeset.changes} onEdit={onEdit} />}<div className="mt-12"><Button className="h-12 rounded-xl border-0 px-5 focus-visible:ring-offset-2" onClick={action}>{changeset.status === 'approved' && <Check className="size-4" />}{label}</Button><p className="mt-4 text-sm text-zinc-500">{changeset.status === 'approved' ? 'This is the moment the proposed changes become live.' : 'You can inspect or edit the plan before approving it.'}</p></div><Activity activity={getState().activity} /></section>;
}

function Catalog({ onBack }) {
  const proposed = shadowProducts();
  return <section className="py-16 sm:py-24"><button className="text-sm text-zinc-500 transition hover:text-zinc-950" onClick={onBack}>← Back to the plan</button><h1 className="mt-8 text-5xl font-medium tracking-[-0.06em] sm:text-7xl">What is live now.</h1><p className="mt-6 text-lg text-zinc-600">These are the current store prices after the approved plan was applied.</p><div className="mt-12 overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="font-mono text-[11px] uppercase tracking-wide text-zinc-400"><tr><th className="pb-4 font-medium">Product</th><th className="pb-4 font-medium">Price</th><th className="pb-4 font-medium">Margin</th><th className="pb-4 font-medium">Stock</th></tr></thead><tbody>{getState().products.map((product) => { const current = proposed.find((item) => item.id === product.id); return <tr key={product.id}><td className="py-3"><p className="font-medium">{product.name}</p><p className="mt-0.5 text-xs text-zinc-500">{product.category}</p></td><td className="py-3 font-medium">{fmt(current.price)}</td><td className="py-3 text-zinc-600">{pct(grossMargin(product, current.price))}</td><td className="py-3 text-zinc-600">{product.inventory}</td></tr>; })}</tbody></table></div></section>;
}

function Audit({ onBack }) {
  const history = getState().history;
  const stageRollback = (item) => { try { beginRollback({ commitId: item.id }); onBack(); } catch (error) { window.alert(error.message); } };
  return <section className="py-16 sm:py-24"><button className="text-sm text-zinc-500 transition hover:text-zinc-950" onClick={onBack}>← Back to the plan</button><h1 className="mt-8 text-5xl font-medium tracking-[-0.06em] sm:text-7xl">What happened.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">Every live plan leaves a record. A rollback is another plan for you to approve, never an instant undo.</p><ol className="mt-12 space-y-8">{history.map((item, index) => { const reversible = index === 0 && item.reversibleChanges?.length && !item.reversed; return <li key={item.id}><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-zinc-500">{item.actor} · {item.changes} changes · {item.id}</p>{reversible && <button className="mt-3 text-sm text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950" onClick={() => stageRollback(item)}><RotateCcw className="mr-1 inline size-3" />Create a rollback plan</button>}</li>; })}</ol></section>;
}

export default function App() {
  const [, refresh] = useState(0);
  const [screen, setScreen] = useState('plan');
  const [editing, setEditing] = useState(null);
  useEffect(() => subscribe(() => refresh((version) => version + 1)), []);
  useEffect(() => { registerWebMCP(); }, []);
  const changeset = getState().changeset;
  const view = screen === 'catalog' ? <Catalog onBack={() => setScreen('plan')} /> : screen === 'audit' ? <Audit onBack={() => setScreen('plan')} /> : changeset ? <PlanScreen changeset={changeset} onEdit={setEditing} onCatalog={() => setScreen('catalog')} onHistory={() => setScreen('audit')} /> : <EmptyState />;
  return <div className="min-h-screen bg-white text-zinc-950"><header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-6 sm:px-0"><button className="font-medium tracking-[-0.04em]" onClick={() => setScreen('plan')}>Commit</button>{changeset && <button aria-label="Reset demo" className="text-xs text-zinc-400 transition hover:text-zinc-950" onClick={() => { resetDemo(); setScreen('plan'); }}>Reset</button>}</header><main className="mx-auto max-w-2xl px-5 sm:px-0">{view}</main><EditPrice change={editing} open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} /></div>;
}
