import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface WorkspaceTabsProps<T extends string> {
  items: readonly { id: T; label: string }[];
  active: T;
  to: (id: T) => string;
}

export function WorkspaceTabs<T extends string>({ items, active, to }: WorkspaceTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={to(item.id)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm transition-colors',
            active === item.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-panel text-foreground/70 hover:bg-muted',
          )}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
