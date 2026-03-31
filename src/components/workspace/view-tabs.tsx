import { cn } from '@/lib/utils';
import type { WorkspaceView } from '@/domain/models';

interface ViewTabsProps {
  items: ReadonlyArray<{ id: WorkspaceView; label: string }>;
  active: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}

export function ViewTabs({ items, active, onChange }: ViewTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm transition-colors',
            active === item.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-panel text-foreground/70 hover:bg-muted',
          )}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
