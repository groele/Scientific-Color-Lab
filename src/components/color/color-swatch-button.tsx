import * as Popover from '@radix-ui/react-popover';
import { MoreHorizontal } from 'lucide-react';
import { Suspense, lazy, memo, useEffect, useRef, useState } from 'react';
import type { ColorToken } from '@/domain/models';
import { cn } from '@/lib/utils';
import { useColorActions } from '@/hooks/use-color-actions';

interface ColorSwatchButtonProps {
  color: ColorToken;
  selected?: boolean;
  compact?: boolean;
  onSelect?: () => void;
  onSetMainColor?: () => void;
  onInsert?: () => void;
}

const OverflowColorMenu = lazy(() =>
  import('@/components/color/overflow-color-menu').then((module) => ({ default: module.OverflowColorMenu })),
);

export const ColorSwatchButton = memo(function ColorSwatchButton({
  color,
  selected = false,
  compact = false,
  onSelect,
  onSetMainColor,
  onInsert,
}: ColorSwatchButtonProps) {
  const { handleSwatchClick, handleSwatchDoubleClick } = useColorActions();
  const clickTimeoutRef = useRef<number | null>(null);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      title={`${color.name}\n${color.hex}\nRGB ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}\nOKLCH ${color.oklch.l} / ${color.oklch.c} / ${color.oklch.h}`}
      className={cn(
        'group relative overflow-visible rounded-2xl border text-left transition focus-within:z-20 focus-visible:outline-none',
        selected ? 'border-foreground shadow-panel' : 'border-border/80 hover:border-foreground/35 hover:shadow-panel',
      )}
    >
      <button
        type="button"
        className="w-full overflow-hidden rounded-[inherit] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={(event) => {
          const anchor = event.currentTarget;
          const shiftKey = event.shiftKey;
          if (clickTimeoutRef.current) {
            window.clearTimeout(clickTimeoutRef.current);
          }

          clickTimeoutRef.current = window.setTimeout(() => {
            clickTimeoutRef.current = null;
            void handleSwatchClick(color, { onSelect, anchor, shiftKey });
          }, 180);
        }}
        onDoubleClick={(event) => {
          if (clickTimeoutRef.current) {
            window.clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }

          handleSwatchDoubleClick(color, { onSetMainColor, anchor: event.currentTarget });
        }}
      >
        <div className={cn('h-24 w-full', compact ? 'h-16' : 'h-24')} style={{ backgroundColor: color.hex }} />
        <div className="space-y-1 bg-panel/90 p-3 pr-12">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{color.name}</div>
            <div className="truncate font-mono text-xs text-foreground/60">{color.hex}</div>
          </div>
        </div>
      </button>
      <div className="absolute right-3 top-3 z-10 opacity-100 lg:opacity-0 lg:transition group-hover:lg:opacity-100 group-focus-within:opacity-100">
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Open color menu"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-panel/85 text-foreground/70 shadow-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onPointerEnter={() => setMenuLoaded(true)}
              onFocus={() => setMenuLoaded(true)}
              onPointerDown={(event) => {
                event.stopPropagation();
                setMenuLoaded(true);
              }}
              onClick={(event) => {
                event.stopPropagation();
                setMenuLoaded(true);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="z-[120] min-w-[220px] rounded-xl border border-border bg-panel p-1 text-foreground shadow-panel"
              onClick={(event) => event.stopPropagation()}
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <Suspense fallback={<div className="px-3 py-2 text-sm text-foreground/65">Loading menu...</div>}>
                {menuLoaded ? <OverflowColorMenu color={color} onInsert={onInsert} onRequestClose={() => setMenuOpen(false)} /> : null}
              </Suspense>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
});
