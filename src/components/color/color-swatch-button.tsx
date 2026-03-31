import { useEffect, useRef } from 'react';
import type { ColorToken } from '@/domain/models';
import { cn } from '@/lib/utils';
import { useColorActions } from '@/hooks/use-color-actions';
import { OverflowColorMenu } from '@/components/color/overflow-color-menu';

interface ColorSwatchButtonProps {
  color: ColorToken;
  selected?: boolean;
  compact?: boolean;
  onSelect?: () => void;
  onSetMainColor?: () => void;
  onInsert?: () => void;
}

export function ColorSwatchButton({
  color,
  selected = false,
  compact = false,
  onSelect,
  onSetMainColor,
  onInsert,
}: ColorSwatchButtonProps) {
  const { handleSwatchClick, handleSwatchDoubleClick } = useColorActions();
  const clickTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      title={`${color.name}\n${color.hex}\nRGB ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}\nOKLCH ${color.oklch.l} / ${color.oklch.c} / ${color.oklch.h}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        selected ? 'border-foreground shadow-panel' : 'border-border/80 hover:border-foreground/35 hover:shadow-panel',
      )}
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
      <div className="space-y-1 bg-panel/90 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{color.name}</div>
            <div className="truncate font-mono text-xs text-foreground/60">{color.hex}</div>
          </div>
          <div className="opacity-100 lg:opacity-0 lg:transition group-hover:lg:opacity-100">
            <OverflowColorMenu color={color} onInsert={onInsert} />
          </div>
        </div>
      </div>
    </button>
  );
}
