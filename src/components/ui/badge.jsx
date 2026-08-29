import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]', {
  variants: { variant: { default: 'border-zinc-950 bg-zinc-950 text-white', outline: 'border-zinc-300 text-zinc-600', blocked: 'border-zinc-950 bg-white text-zinc-950' } },
  defaultVariants: { variant: 'outline' },
});
function Badge({ className, variant, ...props }) { return <div className={cn(badgeVariants({ variant }), className)} {...props} />; }
export { Badge };
