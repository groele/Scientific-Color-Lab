import { cn } from '@/lib/utils';

export function Badge({
  className,
  tone = 'default',
  children,
}: {
  className?: string;
  tone?: 'default' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em]',
        tone === 'default' && 'bg-muted text-foreground/70',
        tone === 'warning' && 'bg-amber-100 text-amber-800',
        tone === 'error' && 'bg-rose-100 text-rose-800',
        tone === 'success' && 'bg-emerald-100 text-emerald-800',
        className,
      )}
    >
      {children}
    </span>
  );
}
