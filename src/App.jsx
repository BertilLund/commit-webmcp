import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, Pencil, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { approveChangeset, beginRollback, commitApprovedChanges, fmt, getProduct, getState, grossMargin, pct, registerWebMCP, resetDemo, runGuidedDemo, shadowProducts, stagePriceChange, subscribe } from '@/lib/domain';

function EditPrice({ change, open, onOpenChange }) {
  const [value, setValue] = useState(change?.after.price ?? '');
  useEffect(() => setValue(change?.after.price ?? ''), [change]);
  if (!change) return null;
  const save = (event) => { event.preventDefault(); stagePriceChange({ productId: change.entityId, newPrice: Number(value), reason: 'Changed by the reviewer' }, 'human'); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={save}><DialogHeader><p className="spx-micro text-zinc-500">Edit the plan</p><DialogTitle className="uppercase tracking-wide">Choose a different price</DialogTitle><DialogDescription>This stays proposed. It will not change the store until you approve and apply the plan.</DialogDescription></DialogHeader><label className="mt-6 block text-sm font-medium" htmlFor="proposed-price">Proposed price</label><div className="mt-2 flex rounded-sm border border-zinc-300 bg-white px-3 focus-within:ring-2 focus-within:ring-zinc-950"><span className="py-2.5 text-zinc-500">$</span><input aria-label="New proposed price" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 outline-none" id="proposed-price" min="1" required step="1" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></div><DialogFooter className="mt-6"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save price</Button></DialogFooter></form></DialogContent></Dialog>;
}

function EmptyState() {
  return <section className="spx-enter py-20 sm:py-32"><p className="spx-micro text-white/60">Human control for agent work</p><h1 className="spx-display mt-5 max-w-3xl">Approve work before it changes your store.</h1><p className="spx-body mt-8 max-w-xl text-[#f0f0fa]/75">An agent can prepare many catalog actions at once. Commit turns them into one plan for you to review, edit, approve, and finally apply.</p><Button className="spx-ghost mt-10" onClick={runGuidedDemo}>Create a clearance plan <ArrowRight className="size-4" /></Button><p className="mt-5 text-[13px] text-white/55">Creates a safe proposal. No live changes.</p></section>;
}

function PlanList({ changes, onEdit }) {
  return <ol className="mt-7 space-y-5">{changes.map((change, index) => {
    const product = change.type === 'price' ? getProduct(change.entityId) : null;
    const blocked = change.status === 'blocked';
    let detail = null;
    if (change.type === 'price') detail = <><span className="line-through text-white/40">{fmt(change.before.price)}</span><ArrowRight className="size-3 text-white/40" /><strong className="text-white">{fmt(change.after.price)}</strong><span className="text-white/55">{pct(grossMargin(product, change.after.price))} margin</span></>;
    if (change.type === 'feature') detail = <span className="text-white/65">Feature this product in the campaign.</span>;
    if (change.type === 'campaign') detail = <span className="text-white/65">{change.after.starts} to {change.after.ends}</span>;
    return <li className="flex gap-4" key={change.id}><span className="spx-micro w-6 shrink-0 text-white/35">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-sm font-bold uppercase tracking-[0.06em] text-white">{change.entityLabel}</p>{blocked && <span className="rounded-full border border-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">Needs a fix</span>}</div><div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">{detail}</div>{blocked && <p className="mt-2 text-sm text-white/75">{change.policyResults.find((result) => result.status === 'block')?.message}</p>}</div>{change.type === 'price' && <button aria-label={`Edit ${change.entityLabel}`} className="spx-link mt-0.5 text-xs" onClick={() => onEdit(change)}><Pencil className="mr-1 inline size-3" />Edit</button>}</li>;
  })}</ol>;
}

function Activity({ activity }) {
  if (!activity.length) return null;
  return <details className="mt-14 text-sm"><summary className="cursor-pointer text-white/55 transition-colors hover:text-white">Show actual agent activity <ChevronDown className="ml-1 inline size-3" /></summary><ol className="mt-4 space-y-2 text-xs text-white/55">{activity.map((item, index) => <li key={`${item.at}-${index}`}><span className="font-bold uppercase tracking-[0.06em] text-white">{item.tool}</span> · {item.detail}</li>)}</ol></details>;
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
  if (changeset.status === 'committed') return <section className="spx-enter py-16 sm:py-24"><p className="spx-micro text-white/60">Live</p><h1 className="spx-display mt-4">Your store is updated.</h1><p className="spx-body mt-7 max-w-xl text-[#f0f0fa]/75">All {changeset.changes.length} approved changes were applied together. Commit {changeset.commit.id} is saved in the audit record.</p><div className="mt-10"><Button className="spx-ghost" onClick={onCatalog}>See the updated catalog <ArrowRight className="size-4" /></Button><button className="spx-link mt-6 block text-[13px]" onClick={onHistory}>See the audit record</button></div></section>;
  return <section className="spx-enter py-16 sm:py-24"><p className="spx-micro text-white/60">{state}</p><h1 className="spx-display mt-4">{headline}</h1><p aria-live="polite" className="spx-body mt-7 max-w-xl text-[#f0f0fa]/75">{copy}</p><div className="mt-12"><p className="spx-micro text-white/55">If you apply it, the store will</p><ul className="mt-4 space-y-3 text-base uppercase tracking-[0.06em] text-white"><li>Lower {prices} clearance prices</li><li>Feature {features} products</li>{campaign && <li>Schedule one weekend campaign</li>}</ul></div><button className="mt-9 flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white" onClick={() => setDetails((open) => !open)}>{details ? 'Hide the individual changes' : `See all ${changeset.changes.length} individual changes`}{details ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</button>{details && <PlanList changes={changeset.changes} onEdit={onEdit} />}<div className="mt-12"><Button className="spx-ghost" onClick={action}>{changeset.status === 'approved' && <Check className="size-4" />}{label} <ArrowRight className="size-4" /></Button><p className="mt-5 text-[13px] text-white/55">{changeset.status === 'approved' ? 'This is the moment the proposed changes become live.' : 'You can inspect or edit the plan before approving it.'}</p></div><Activity activity={getState().activity} /></section>;
}

function Catalog({ onBack }) {
  const proposed = shadowProducts();
  return <section className="spx-enter py-16 sm:py-24"><button className="spx-link text-sm" onClick={onBack}>← Back to the plan</button><h1 className="spx-display mt-10">What is live now.</h1><p className="spx-body mt-7 text-[#f0f0fa]/75">These are the current store prices after the approved plan was applied.</p><div className="mt-12 overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="spx-micro text-white/40"><tr><th className="pb-4 font-normal">Product</th><th className="pb-4 font-normal">Price</th><th className="pb-4 font-normal">Margin</th><th className="pb-4 font-normal">Stock</th></tr></thead><tbody>{getState().products.map((product) => { const current = proposed.find((item) => item.id === product.id); return <tr key={product.id}><td className="py-3"><p className="font-bold uppercase tracking-[0.05em] text-white">{product.name}</p><p className="mt-0.5 text-xs text-white/45">{product.category}</p></td><td className="py-3 font-bold text-white">{fmt(current.price)}</td><td className="py-3 text-white/65">{pct(grossMargin(product, current.price))}</td><td className="py-3 text-white/65">{product.inventory}</td></tr>; })}</tbody></table></div></section>;
}

function Audit({ onBack }) {
  const history = getState().history;
  const stageRollback = (item) => { try { beginRollback({ commitId: item.id }); onBack(); } catch (error) { window.alert(error.message); } };
  return <section className="spx-enter py-16 sm:py-24"><button className="spx-link text-sm" onClick={onBack}>← Back to the plan</button><h1 className="spx-display mt-10">What happened.</h1><p className="spx-body mt-7 max-w-xl text-[#f0f0fa]/75">Every live plan leaves a record. A rollback is another plan for you to approve, never an instant undo.</p><ol className="mt-12 space-y-9">{history.map((item, index) => { const reversible = index === 0 && item.reversibleChanges?.length && !item.reversed; return <li key={item.id}><p className="font-bold uppercase tracking-[0.06em] text-white">{item.title}</p><p className="mt-2 text-sm text-white/50">{item.actor} · {item.changes} changes · {item.id}</p>{reversible && <button className="spx-link mt-4 text-sm" onClick={() => stageRollback(item)}><RotateCcw className="mr-1 inline size-3" />Create a rollback plan</button>}</li>; })}</ol></section>;
}

export default function App() {
  const [, refresh] = useState(0);
  const [screen, setScreen] = useState('plan');
  const [editing, setEditing] = useState(null);
  useEffect(() => subscribe(() => refresh((version) => version + 1)), []);
  useEffect(() => { registerWebMCP(); }, []);
  const changeset = getState().changeset;
  const view = screen === 'catalog' ? <Catalog onBack={() => setScreen('plan')} /> : screen === 'audit' ? <Audit onBack={() => setScreen('plan')} /> : changeset ? <PlanScreen changeset={changeset} onEdit={setEditing} onCatalog={() => setScreen('catalog')} onHistory={() => setScreen('audit')} /> : <EmptyState />;
  return <div className="min-h-screen bg-black text-white"><header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-7 sm:px-8"><button className="spx-micro font-bold text-white" onClick={() => setScreen('plan')}>Commit</button>{changeset && <button aria-label="Reset demo" className="spx-micro text-white/50 transition-colors hover:text-white" onClick={() => { resetDemo(); setScreen('plan'); }}>Reset</button>}</header><main className="mx-auto max-w-4xl px-6 sm:px-8">{view}</main><EditPrice change={editing} open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} /></div>;
}
