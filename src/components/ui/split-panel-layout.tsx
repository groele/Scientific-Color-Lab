import { cn } from '@/lib/utils';

interface SplitPanelLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}

export function SplitPanelLayout({ left, center, right, className }: SplitPanelLayoutProps) {
  return (
    <div className={cn('grid gap-4 xl:items-start xl:grid-cols-[300px_minmax(0,1fr)_320px]', className)}>
      <aside className="space-y-4">{left}</aside>
      <main className="min-w-0 space-y-4">{center}</main>
      <aside className="space-y-4 xl:sticky xl:top-5">{right}</aside>
    </div>
  );
}
