import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleAlert, CircleCheck, FileCheck2, GitCommitHorizontal, History, Layers3, PackageSearch, Pencil, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { approveChangeset, beginRollback, commitApprovedChanges, fmt, getProduct, getState, grossMargin, pct, registerWebMCP, resetDemo, runGuidedDemo, shadowProducts, stagePriceChange, subscribe } from '@/lib/domain';

const nav = [
  ['review', 'Review', Layers3],
  ['catalog', 'Catalog', PackageSearch],
  ['history', 'History', History],
];

function StatusBadge({ status }) {
  const label = (status || 'draft').replaceAll('_', ' ');
  const variant = status === 'approved' || status === 'committed' ? 'default' : status === 'changes_requested' ? 'blocked' : 'outline';
  return <Badge variant={variant}>{label}</Badge>;
}

function PolicyLine({ outcome }) {
  const Icon = outcome.status === 'pass' ? CircleCheck : outcome.status === 'warn' ? CircleAlert : CircleAlert;
  return <li className="flex items-start gap-2 text-xs leading-5 text-zinc-600"><Icon className="mt-0.5 size-3.5 shrink-0 text-zinc-950" />{outcome.message}</li>;
}

function EditPriceDialog({ change, open, onOpenChange }) {
  const [value, setValue] = useState(change?.after.price ?? '');
  useEffect(() => setValue(change?.after.price ?? ''), [change]);
  if (!change) return null;
  const save = (event) => {
    event.preventDefault();
    stagePriceChange({ productId: change.entityId, newPrice: Number(value), reason: 'Adjusted manually by human reviewer' }, 'human');
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <form onSubmit={save}>
        <DialogHeader>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500">HUMAN REVIEW</p>
          <DialogTitle>Adjust proposed price</DialogTitle>
          <DialogDescription>{change.entityLabel} remains in shadow state until this exact revision is approved and committed.</DialogDescription>
        </DialogHeader>
        <label className="mt-6 block text-xs font-medium text-zinc-700" htmlFor="price">Proposed price</label>
        <div className="mt-2 flex overflow-hidden rounded-md border border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-950"><span className="flex items-center border-r border-zinc-300 px-3 text-sm text-zinc-500">$</span><input aria-label="Proposed price" id="price" className="min-w-0 flex-1 bg-white px-3 py-2 text-sm outline-none" min="1" required step="1" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></div>
        <DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save staged edit <ArrowRight className="size-3.5" /></Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function Activity({ activity, webMCP }) {
  return <Card className="h-fit">
    <CardHeader className="border-b border-zinc-200 pb-4">
      <div className="flex items-center justify-between"><CardTitle>Agent activity</CardTitle><span className={`size-2 rounded-full ${webMCP ? 'bg-zinc-950' : 'bg-zinc-300'}`} /></div>
      <CardDescription>{webMCP ? 'Only real WebMCP calls appear here.' : 'Open in a compatible browser to connect an agent.'}</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      {activity.length ? <ol className="divide-y divide-zinc-100">{activity.map((item, index) => <li className="flex gap-3 px-5 py-3" key={`${item.at}-${index}`}><span className="mt-0.5 text-xs">{item.kind === 'read' ? '↓' : '↑'}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-zinc-900">{item.tool}</p><p className="mt-1 text-[11px] leading-4 text-zinc-500">{item.detail}</p></div><time className="text-[10px] text-zinc-400">{new Date(item.at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</time></li>)}</ol> : <p className="p-5 text-xs leading-5 text-zinc-500">No calls yet. The trail is intentionally blank until an agent uses a registered browser tool.</p>}
    </CardContent>
  </Card>;
}

function EmptyReview() {
  return <div className="grid min-h-[65vh] place-items-center border-t border-zinc-200">
    <div className="max-w-xl py-16 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-full border border-zinc-300"><GitCommitHorizontal className="size-5" /></div>
      <p className="mt-7 text-[10px] font-semibold tracking-[0.2em] text-zinc-500">NO ACTIVE CHANGE SET</p>
      <h1 className="display mt-3 text-5xl leading-[0.9] sm:text-6xl">Review once.<br /><i>Commit with confidence.</i></h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-600">An agent can safely stage many actions. You see one small, reviewable diff before anything becomes live.</p>
      <Button className="mt-8" size="lg" onClick={runGuidedDemo}>Run guided clearance set <ArrowRight className="size-4" /></Button>
      <div className="mt-10 grid grid-cols-3 border-y border-zinc-200 text-left"><div className="p-3 text-[10px] text-zinc-500"><b className="block text-zinc-900">01 / stage</b>Nothing live</div><div className="border-x border-zinc-200 p-3 text-[10px] text-zinc-500"><b className="block text-zinc-900">02 / review</b>Policy checked</div><div className="p-3 text-[10px] text-zinc-500"><b className="block text-zinc-900">03 / commit</b>Human bound</div></div>
    </div>
  </div>;
}

function ChangeRow({ change, onEdit }) {
  const product = change.type === 'price' ? getProduct(change.entityId) : null;
  const blocked = change.status === 'blocked';
  const type = change.type === 'price' ? 'Price' : change.type === 'campaign' && change.after.removal ? 'Campaign removal' : change.type === 'campaign' ? 'Campaign' : 'Placement';
  return <Card className={blocked ? 'border-zinc-950' : ''}>
    <CardContent className="p-0">
      <div className="flex items-start gap-4 p-5">
        <div className="grid size-8 shrink-0 place-items-center rounded border border-zinc-200 text-xs font-semibold">{type.slice(0, 1)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">{change.entityLabel}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{type} · {change.source === 'human' ? 'human edited' : 'agent staged'}</p></div><StatusBadge status={change.status} /></div>
          {change.type === 'price' && <div className="mt-5 flex items-end gap-3 text-sm"><span className="text-zinc-400 line-through">{fmt(change.before.price)}</span><ArrowRight className="mb-0.5 size-3.5 text-zinc-400" /><strong className="text-lg">{fmt(change.after.price)}</strong><span className="mb-0.5 text-xs text-zinc-500">{pct(grossMargin(product, change.after.price))} margin</span></div>}
          {change.type === 'feature' && <p className="mt-5 text-sm"><span className="text-zinc-400">{change.before.featured ? 'Featured' : 'Not featured'}</span> <ArrowRight className="mx-2 inline size-3.5 text-zinc-400" /> <strong>{change.after.featured ? 'Featured' : 'Not featured'}</strong></p>}
          {change.type === 'campaign' && <p className="mt-5 text-sm">{change.after.removal ? <><span className="text-zinc-400">Live campaign</span> <ArrowRight className="mx-2 inline size-3.5 text-zinc-400" /> <strong>Removed after commit</strong></> : <><strong>{change.after.starts}</strong> <ArrowRight className="mx-2 inline size-3.5 text-zinc-400" /> <strong>{change.after.ends}</strong></>}</p>}
          <p className="mt-4 text-xs leading-5 text-zinc-500">{change.reason}</p>
          {change.policyResults.length > 0 && <ul className="mt-4 space-y-1.5 border-t border-zinc-100 pt-4">{change.policyResults.map((outcome, index) => <PolicyLine key={index} outcome={outcome} />)}</ul>}
        </div>
        {change.type === 'price' && <Button aria-label={`Edit ${change.entityLabel}`} className="shrink-0" variant="ghost" size="sm" onClick={() => onEdit(change)}><Pencil className="size-3.5" /><span className="hidden sm:inline">Edit</span></Button>}
      </div>
    </CardContent>
  </Card>;
}

function Review({ changeset, onEdit }) {
  if (!changeset) return <EmptyReview />;
  const { validation } = changeset;
  const hasBlock = validation.block > 0;
  const action = () => { if (changeset.status === 'approved') return commitApprovedChanges(); if (!hasBlock) return approveChangeset(); };
  const actionLabel = changeset.status === 'committed' ? 'Committed' : changeset.status === 'approved' ? `Commit ${changeset.changes.length} changes` : hasBlock ? 'Correct blocked changes' : `Approve revision ${changeset.revision}`;
  return <div className="border-t border-zinc-200 py-8">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500">SHADOW STATE / REVISION {changeset.revision}</p><h1 className="display mt-3 text-5xl leading-[0.9] sm:text-6xl">{changeset.title}<br /><i>ready for review.</i></h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">{changeset.goal}</p></div><StatusBadge status={changeset.status} /></div>
    <div className="mt-9 grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-3"><Metric label="Proposed changes" value={changeset.changes.length} detail="Still not live" /><Metric label="Policy checks" value={hasBlock ? `${validation.block} blocked` : validation.warn ? `${validation.warn} review` : 'All clear'} detail={`${validation.pass} passing checks`} /><Metric label="Approval binding" value={`r${changeset.revision}`} detail="Any edit invalidates approval" /></div>
    <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1fr)_290px]"><div><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500">PROPOSED DIFF</p><h2 className="mt-1 text-lg font-semibold">One set of changes</h2></div><span className="text-[10px] text-zinc-500">{changeset.id}</span></div><div className="space-y-3">{changeset.changes.map((change) => <ChangeRow change={change} key={change.id} onEdit={onEdit} />)}</div>
      <Card className="mt-5 border-zinc-950 bg-zinc-950 text-white"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{changeset.status === 'committed' ? 'Committed atomically' : hasBlock ? 'Blocked changes need correction' : changeset.status === 'approved' ? 'This exact revision has human approval' : 'Ready for a human decision'}</p><p className="mt-1 text-xs text-zinc-400">{changeset.status === 'committed' ? `${changeset.commit.id} · canonical store v${getState().version}` : 'Approval is revision-bound and any human edit starts a fresh review.'}</p></div><Button disabled={hasBlock || changeset.status === 'committed'} variant="outline" className="border-white bg-white text-zinc-950 hover:bg-zinc-200" onClick={action}>{changeset.status === 'committed' ? <Check className="size-4" /> : <FileCheck2 className="size-4" />}{actionLabel}</Button></CardContent></Card>
    </div><Activity activity={getState().activity} webMCP={Boolean(document.modelContext?.registerTool)} /></div>
  </div>;
}

function Metric({ label, value, detail }) { return <div className="bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p><p className="mt-3 text-lg font-semibold">{value}</p><p className="mt-1 text-[11px] text-zinc-500">{detail}</p></div>; }

function Catalog() {
  const changeset = getState().changeset; const proposed = shadowProducts();
  return <div className="border-t border-zinc-200 py-8"><p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500">CATALOG / {proposed.length} PRODUCTS</p><h1 className="display mt-3 text-5xl leading-[0.9] sm:text-6xl">The live store,<br /><i>with context.</i></h1><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">Proposed prices are shown only while you are reviewing a staged change set.</p>
    <Card className="mt-9 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-xs"><thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-[0.14em] text-zinc-500"><tr><th className="px-5 py-3 font-medium">Product</th><th className="px-5 py-3 font-medium">Price</th><th className="px-5 py-3 font-medium">Margin</th><th className="px-5 py-3 font-medium">On hand</th><th className="px-5 py-3 font-medium">Signal</th></tr></thead><tbody>{getState().products.map((product) => { const current = proposed.find((item) => item.id === product.id); const isProposed = product.price !== current.price; return <tr className="border-b border-zinc-100 last:border-0" key={product.id}><td className="px-5 py-4"><p className="font-semibold">{product.name}</p><p className="mt-1 text-[10px] text-zinc-500">{product.category}</p></td><td className="px-5 py-4">{isProposed && <span className="mr-2 text-zinc-400 line-through">{fmt(product.price)}</span>}<strong>{fmt(current.price)}</strong></td><td className="px-5 py-4">{pct(grossMargin(product, current.price))}</td><td className="px-5 py-4">{product.inventory}</td><td className="px-5 py-4"><Badge variant={product.seller === 'strong' ? 'default' : 'outline'}>{product.seller === 'strong' ? 'Protected' : product.seller === 'slow' ? 'Clearance fit' : 'Steady'}</Badge></td></tr>; })}</tbody></table></div></Card>
    {changeset && <p className="mt-4 text-xs text-zinc-500">Shadow state is active for change set {changeset.id}. Nothing in this table is live until commit.</p>}
  </div>;
}

function CommitHistory({ onReview }) {
  const history = getState().history;
  const stageRollback = (item) => { try { beginRollback({ commitId: item.id }); onReview(); } catch (error) { window.alert(error.message); } };
  return <div className="border-t border-zinc-200 py-8"><p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500">CANONICAL HISTORY</p><h1 className="display mt-3 text-5xl leading-[0.9] sm:text-6xl">Every commit<br /><i>has a receipt.</i></h1><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">The audit trail captures the actor, bound revision, and timestamp for every committed change set. The latest reversible commit can be staged for a separate human-approved rollback.</p><div className="mt-9 space-y-3">{history.map((item, index) => { const canRollback = index === 0 && item.reversibleChanges?.length && !item.reversed; return <Card key={item.id}><CardContent className="flex items-start gap-4 p-5"><span className="mt-1 grid size-7 place-items-center rounded-full border border-zinc-200 text-[10px]">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-zinc-500">{item.actor} · {item.changes} changes</p></div><div className="flex items-center gap-2"><StatusBadge status={item.reversed ? 'rolled_back' : index === 0 && getState().changeset?.status === 'committed' ? 'committed' : 'archived'} />{canRollback && <Button size="sm" variant="outline" onClick={() => stageRollback(item)}><RotateCcw className="size-3.5" />Stage rollback</Button>}</div></div><p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-zinc-500">{item.id} · revision {item.revision} · {new Date(item.at).toLocaleString()}</p></div></CardContent></Card>; })}</div></div>;
}

export default function App() {
  const [, refresh] = useState(0);
  const [page, setPage] = useState('review');
  const [editing, setEditing] = useState(null);
  const [registered, setRegistered] = useState(false);
  useEffect(() => subscribe(() => refresh((version) => version + 1)), []);
  useEffect(() => { setRegistered(registerWebMCP()); }, []);
  const state = getState();
  const pageView = page === 'catalog' ? <Catalog /> : page === 'history' ? <CommitHistory onReview={() => setPage('review')} /> : <Review changeset={state.changeset} onEdit={setEditing} />;
  return <div className="min-h-screen bg-white"><header className="fine-rule border-b border-zinc-200"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8"><button className="flex items-center gap-2" onClick={() => setPage('review')}><span className="grid size-7 place-items-center bg-zinc-950 text-xs text-white">C</span><span className="text-sm font-semibold tracking-tight">commit</span></button><div className="flex items-center gap-3"><span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 sm:inline">Northline Goods</span><span className="hidden h-4 w-px bg-zinc-200 sm:inline" /><span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><span className={`size-1.5 rounded-full ${registered || document.modelContext?.registerTool ? 'bg-zinc-950' : 'bg-zinc-300'}`} />WebMCP {registered || document.modelContext?.registerTool ? 'ready' : 'standby'}</span><Button aria-label="Reset demo" variant="ghost" size="sm" onClick={resetDemo}><RotateCcw className="size-3.5" /><span className="hidden sm:inline">Reset</span></Button></div></div></header><div className="mx-auto grid max-w-7xl lg:grid-cols-[190px_minmax(0,1fr)]"><aside className="border-b border-zinc-200 px-5 py-3 lg:min-h-[calc(100vh-57px)] lg:border-b-0 lg:border-r lg:px-0 lg:py-8"><nav className="flex gap-1 lg:flex-col lg:px-4">{nav.map(([id, label, Icon]) => <button className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${page === id ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950'}`} key={id} onClick={() => setPage(id)}><Icon className="size-3.5" />{label}</button>)}</nav><div className="mt-8 hidden px-7 lg:block"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Hard policy</p><p className="mt-2 text-xs leading-5 text-zinc-600">25% minimum margin. Strong sellers cannot be discounted.</p></div></aside><main className="min-w-0 px-5 sm:px-8">{pageView}</main></div><EditPriceDialog change={editing} open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} /></div>;
}
