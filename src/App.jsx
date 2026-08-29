import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, CircleAlert, Database, GitCommitHorizontal, Pencil, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { WEBMCP_TOOL_COUNT, approveChangeset, beginRollback, commitApprovedChanges, completeGuidedDemo, fmt, getProduct, getState, grossMargin, pct, registerWebMCP, resetDemo, shadowProducts, stagePriceChange, startGuidedDemo, subscribe } from '@/lib/domain';

function EditPrice({ change, open, onOpenChange }) {
  const [value, setValue] = useState(change?.after.price ?? '');
  if (!change) return null;
  const save = (event) => { event.preventDefault(); stagePriceChange({ productId: change.entityId, newPrice: Number(value), reason: 'Changed by the reviewer' }, 'human'); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={save}><DialogHeader><p className="spx-micro text-zinc-500">Edit the plan</p><DialogTitle className="uppercase tracking-wide">Choose a different price</DialogTitle><DialogDescription>This stays proposed. It will not change the store until you approve and apply the plan.</DialogDescription></DialogHeader><label className="mt-6 block text-sm font-medium" htmlFor="proposed-price">Proposed price</label><div className="mt-2 flex rounded-sm border border-zinc-300 bg-white px-3 focus-within:ring-2 focus-within:ring-zinc-950"><span className="py-2.5 text-zinc-500">$</span><input aria-label="New proposed price" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 outline-none" id="proposed-price" min="1" required step="1" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></div><DialogFooter className="mt-6"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save price</Button></DialogFooter></form></DialogContent></Dialog>;
}

const sequence = [
  ['01', 'Agent', 'Prepares'],
  ['02', 'Plan', 'Staged'],
  ['03', 'Human', 'Approves'],
  ['04', 'Store', 'Updates'],
];

function CommitSequence({ status = 'empty' }) {
  const active = status === 'committed' ? 3 : status === 'approved' ? 2 : status === 'empty' ? 0 : 1;
  const progress = [8, 38, 68, 100][active];
  return <div className="relative mt-12" aria-label="Commit workflow"><Progress aria-label={`${progress}% through the commit workflow`} className="spx-progress absolute left-5 right-5 top-[22px] w-auto" value={progress} /><ol className="relative grid grid-cols-4 gap-2">{sequence.map(([number, title, detail], index) => { const reached = index <= active; return <li className="min-w-0" key={title}><span className={`grid size-11 place-items-center rounded-full border text-xs font-bold transition-colors duration-300 ${reached ? 'border-white bg-white text-black' : 'border-[#3a3a3f] bg-black text-white/35'}`}>{index < active ? <Check className="size-4" /> : number}</span><p className={`mt-4 text-xs font-bold uppercase tracking-[0.08em] ${reached ? 'text-white' : 'text-white/35'}`}>{title}</p><p className={`mt-1 text-[11px] uppercase tracking-[0.06em] ${reached ? 'text-white/55' : 'text-white/25'}`}>{detail}</p></li>; })}</ol></div>;
}

function Telemetry({ changeset }) {
  const prices = changeset.changes.filter((change) => change.type === 'price').length;
  const features = changeset.changes.filter((change) => change.type === 'feature').length;
  const campaigns = changeset.changes.filter((change) => change.type === 'campaign').length;
  return <div className="mt-12 grid grid-cols-3 gap-3" aria-label="Plan impact"><Metric value={prices} label="Prices" /><Metric value={features} label="Featured" /><Metric value={campaigns} label="Campaign" /></div>;
}

function Metric({ value, label }) {
  return <Card className="rounded-sm border-[#3a3a3f] bg-[#0a0a0a] text-white shadow-none"><CardContent className="p-4 sm:p-5"><p className="text-3xl font-bold leading-none sm:text-5xl">{String(value).padStart(2, '0')}</p><p className="spx-micro mt-3 text-white/45">{label}</p></CardContent></Card>;
}

function PriceVectors({ changes }) {
  const priceChanges = changes.filter((change) => change.type === 'price').slice(0, 3);
  return <div className="mt-10 space-y-5" aria-label="Live and proposed price comparison">{priceChanges.map((change) => { const ratio = Math.round((change.after.price / change.before.price) * 100); return <div key={change.id}><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.07em] text-white">{change.entityLabel}</p><p className="mt-1 text-xs text-white/45">Live {fmt(change.before.price)}</p></div><p className="text-xl font-bold text-white">{fmt(change.after.price)}</p></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${ratio}%` }} /></div></div>; })}</div>;
}

function TransactionProof({ changeset }) {
  const staged = changeset?.changes.length || 0;
  const blocked = changeset?.validation.block || 0;
  const committed = changeset?.status === 'committed';
  const version = getState().version;
  const states = [
    { icon: Database, label: 'Live store', value: `v${version}`, detail: committed ? 'Updated atomically' : 'Untouched' },
    { icon: GitCommitHorizontal, label: 'Shadow state', value: String(staged).padStart(2, '0'), detail: staged === 1 ? 'Change staged' : 'Changes staged' },
    { icon: blocked ? CircleAlert : ShieldCheck, label: 'Policy engine', value: blocked ? 'Block' : staged ? 'Pass' : 'Ready', detail: blocked ? 'Commit disabled' : 'Deterministic checks' },
  ];
  return <div className="grid gap-px overflow-hidden rounded-sm bg-[#3a3a3f] sm:grid-cols-3" aria-label="Live transaction state">{states.map(({ icon: Icon, label, value, detail }) => <div className="bg-[#0a0a0a] p-5" key={label}><div className="flex items-center justify-between"><p className="spx-micro text-white/45">{label}</p><Icon className="size-4 text-white/45" aria-hidden="true" /></div><p className="mt-5 text-3xl font-bold uppercase tracking-tight text-white">{value}</p><p className="mt-2 text-xs text-white/45">{detail}</p></div>)}</div>;
}

function PolicyStop({ change }) {
  const product = getProduct(change.entityId);
  const margin = pct(grossMargin(product, change.after.price));
  return <Card className="mt-9 overflow-hidden rounded-sm border-white bg-white text-black shadow-none"><CardContent className="p-0"><div className="grid sm:grid-cols-[1fr_auto_1fr_auto_1fr]"><div className="p-5 sm:p-6"><p className="spx-micro text-black/45">Agent proposed</p><p className="mt-3 text-4xl font-bold">{fmt(change.after.price)}</p></div><div className="hidden place-items-center px-2 text-black/25 sm:grid"><ArrowRight className="size-5" /></div><div className="border-y border-black/15 p-5 sm:border-x sm:border-y-0 sm:p-6"><p className="spx-micro text-black/45">Calculated margin</p><p className="mt-3 text-4xl font-bold">{margin}</p></div><div className="hidden place-items-center px-2 text-black/25 sm:grid"><ArrowRight className="size-5" /></div><div className="p-5 sm:p-6"><p className="spx-micro text-black/45">Policy result</p><p className="mt-3 flex items-center gap-2 text-2xl font-bold uppercase"><CircleAlert className="size-5" /> Blocked</p></div></div><p className="border-t border-black/15 px-5 py-4 text-sm font-medium sm:px-6">{change.policyResults.find((result) => result.status === 'block')?.message}</p></CardContent></Card>;
}

function WebMCPState({ ready }) {
  return <div className="mt-8 flex max-w-lg items-start gap-3"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${ready ? 'bg-white' : 'border border-white/45'}`} aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-[0.08em] text-white">{ready ? `WebMCP connected · ${WEBMCP_TOOL_COUNT} tools registered` : 'Browser walkthrough · WebMCP not exposed here'}</p><p className="mt-1 text-xs leading-5 text-white/45">{ready ? 'A compatible agent can now inspect, stage, validate, request approval, commit, and begin rollback directly through this page.' : 'The transaction still works manually. Open the page in a compatible WebMCP client to let an external agent discover the same operations.'}</p></div></div>;
}

function EmptyState({ webmcpReady }) {
  return <section className="spx-enter py-14 sm:py-24"><div className="grid items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]"><div><Badge className="rounded-full border-white/30 bg-black px-3 py-1 text-white/70" variant="outline">Working transaction demo</Badge><h1 className="spx-display mt-7">Watch the guardrail work.</h1><p className="spx-body mt-7 max-w-lg text-[#f0f0fa]/70">Stage an unsafe store change. The policy engine will stop it before anything goes live.</p><Button className="spx-ghost mt-10" onClick={startGuidedDemo}>Stage an unsafe price <ArrowRight className="size-4" /></Button><WebMCPState ready={webmcpReady} /></div><Card className="rounded-sm border-[#3a3a3f] bg-[#0a0a0a] text-white shadow-none"><CardContent className="p-6 sm:p-8"><div className="flex items-center justify-between"><p className="spx-micro text-white/45">Before the first action</p><Badge className="rounded-full border-white/25 bg-transparent text-white/55" variant="outline">Store safe</Badge></div><div className="mt-8"><TransactionProof /></div><CommitSequence /><div className="mt-10 grid grid-cols-3 gap-3"><Metric value={0} label="Staged" /><Metric value={0} label="Approved" /><Metric value={0} label="Live" /></div></CardContent></Card></div></section>;
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
  return <details className="mt-14 text-sm"><summary className="cursor-pointer text-white/55 transition-colors hover:text-white">Real WebMCP calls only <ChevronDown className="ml-1 inline size-3" /></summary><ol className="mt-4 space-y-2 text-xs text-white/55">{activity.map((item) => <li key={item.id}><span className="font-bold uppercase tracking-[0.06em] text-white">{item.tool}</span> · {item.detail}</li>)}</ol></details>;
}

function PlanScreen({ changeset, onEdit, onCatalog, onHistory, webmcpReady }) {
  const [details, setDetails] = useState(false);
  const blocked = changeset.validation.block > 0;
  const firstBlocked = changeset.changes.find((change) => change.status === 'blocked');
  let state = 'Not live';
  let copy = 'Staged safely. The live store is unchanged.';
  let action = approveChangeset;
  let label = 'Approve this plan';
  const walkthroughBlock = blocked && changeset.changes.length === 1 && firstBlocked?.entityId === 'p01' && firstBlocked?.after.price === 80;
  if (blocked) { state = 'Blocked by policy'; copy = 'The $80 proposal would leave only 13% margin. The live price is still $148.'; action = walkthroughBlock ? completeGuidedDemo : () => onEdit(firstBlocked); label = walkthroughBlock ? 'Correct to $109 and build the plan' : 'Fix the blocked price'; }
  if (changeset.status === 'approved') { state = 'Approved'; copy = `Revision ${changeset.revision} is locked and ready to apply.`; action = commitApprovedChanges; label = 'Apply these changes'; }
  if (changeset.status === 'committed') return <section className="spx-enter py-12 sm:py-20"><div className="flex flex-wrap items-center justify-between gap-3"><Badge className="rounded-full border-white bg-white px-3 py-1 text-black" variant="outline">Live</Badge><p className="spx-micro text-white/45">Commit {changeset.commit.id}</p></div><h1 className="mt-7 text-3xl font-bold uppercase tracking-[0.04em] sm:text-5xl">Commit complete</h1><Card className="mt-10 rounded-sm border-[#3a3a3f] bg-[#0a0a0a] text-white shadow-none"><CardContent className="p-6 sm:p-8"><CommitSequence status="committed" /><Telemetry changeset={changeset} /><div className="mt-10 grid gap-3 sm:grid-cols-2"><Card className="rounded-sm border-[#3a3a3f] bg-black text-white shadow-none"><CardContent className="p-5"><p className="spx-micro text-white/45">Canonical store</p><p className="mt-3 text-2xl font-bold uppercase">Updated</p></CardContent></Card><Card className="rounded-sm border-[#3a3a3f] bg-black text-white shadow-none"><CardContent className="p-5"><p className="spx-micro text-white/45">Audit record</p><p className="mt-3 text-2xl font-bold uppercase">Saved</p></CardContent></Card></div></CardContent></Card><div className="mt-10"><Button className="spx-ghost" onClick={onCatalog}>See the updated catalog <ArrowRight className="size-4" /></Button><button className="spx-link mt-6 block text-[13px]" onClick={onHistory}>See the audit record</button></div></section>;
  return <section className="spx-enter py-12 sm:py-20"><div className="flex flex-wrap items-center justify-between gap-3"><Badge className={`rounded-full px-3 py-1 ${changeset.status === 'approved' ? 'border-white bg-white text-black' : 'border-white/30 bg-black text-white/70'}`} variant="outline">{state}</Badge><p className="spx-micro text-white/45">Revision {changeset.revision}</p></div><h1 className="mt-7 text-3xl font-bold uppercase tracking-[0.04em] sm:text-5xl">{changeset.title}</h1><div className="mt-5 flex max-w-2xl gap-4 border-l-2 border-white pl-4"><p className="spx-micro shrink-0 text-white/40">Intent</p><p className="text-sm leading-6 text-white/75">{changeset.goal}</p></div><p aria-live="polite" className="mt-4 text-sm text-white/55">{copy}</p>{blocked && <PolicyStop change={firstBlocked} />}<div className="mt-9"><TransactionProof changeset={changeset} /></div><Card className="mt-3 rounded-sm border-[#3a3a3f] bg-[#0a0a0a] text-white shadow-none"><CardContent className="p-6 sm:p-8"><CommitSequence status={changeset.status} /><Telemetry changeset={changeset} /><PriceVectors changes={changeset.changes} /><Collapsible className="mt-9" open={details} onOpenChange={setDetails}><CollapsibleTrigger asChild><Button className="h-auto border-white/25 bg-transparent px-0 text-sm text-white/60 hover:bg-transparent hover:text-white" variant="ghost">{details ? 'Hide individual changes' : `Inspect ${changeset.changes.length} changes`}{details ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</Button></CollapsibleTrigger><CollapsibleContent>{<PlanList changes={changeset.changes} onEdit={onEdit} />}</CollapsibleContent></Collapsible></CardContent></Card><div className="mt-10"><Button className="spx-ghost" onClick={action}>{changeset.status === 'approved' && <Check className="size-4" />}{label} <ArrowRight className="size-4" /></Button><p className="mt-5 text-[13px] text-white/50">{blocked ? 'This button runs the correction through the same staged-state engine used by WebMCP.' : changeset.status === 'approved' ? 'This applies the approved revision to the live store.' : 'Approval never changes the live store.'}</p></div><WebMCPState ready={webmcpReady} /><Activity activity={getState().activity} /></section>;
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
  const [webmcpReady, setWebmcpReady] = useState(false);
  useEffect(() => subscribe(() => refresh((version) => version + 1)), []);
  useEffect(() => {
    let active = true;
    Promise.resolve(registerWebMCP()).then((ready) => { if (active) setWebmcpReady(ready); });
    return () => { active = false; };
  }, []);
  const changeset = getState().changeset;
  const view = screen === 'catalog' ? <Catalog onBack={() => setScreen('plan')} /> : screen === 'audit' ? <Audit onBack={() => setScreen('plan')} /> : changeset ? <PlanScreen changeset={changeset} onEdit={setEditing} onCatalog={() => setScreen('catalog')} onHistory={() => setScreen('audit')} webmcpReady={webmcpReady} /> : <EmptyState webmcpReady={webmcpReady} />;
  return <div className="min-h-screen bg-black text-white"><header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-7 sm:px-8"><button className="spx-micro font-bold text-white" onClick={() => setScreen('plan')}>Commit</button>{changeset && <button aria-label="Reset demo" className="spx-micro text-white/50 transition-colors hover:text-white" onClick={() => { resetDemo(); setScreen('plan'); }}>Reset</button>}</header><main className="mx-auto max-w-4xl px-6 sm:px-8">{view}</main><EditPrice key={editing?.id || 'closed'} change={editing} open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} /></div>;
}
