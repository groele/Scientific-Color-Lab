import { MoreHorizontal, Plus, Star } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ColorToken, CopyFormat } from '@/domain/models';
import { useColorActions } from '@/hooks/use-color-actions';

interface OverflowColorMenuProps {
  color: ColorToken;
  onInsert?: () => void;
}

const formats: CopyFormat[] = ['rgb', 'hsl', 'lab', 'oklch', 'css'];

export function OverflowColorMenu({ color, onInsert }: OverflowColorMenuProps) {
  const [open, setOpen] = useState(false);
  const { copyByFormat, favoriteColor } = useColorActions();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-full p-0"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className="absolute right-0 top-9 z-20 min-w-[180px] rounded-xl border border-border bg-panel p-1 shadow-panel"
          onClick={(event) => event.stopPropagation()}
        >
          {formats.map((format) => (
            <button
              key={format}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground/80 transition hover:bg-muted"
              onClick={(event) => {
                void copyByFormat(color, format, event.currentTarget);
                setOpen(false);
              }}
            >
              <span>Copy {format.toUpperCase()}</span>
            </button>
          ))}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 transition hover:bg-muted"
            onClick={() => {
              void favoriteColor(color);
              setOpen(false);
            }}
          >
            <Star className="h-4 w-4" />
            Favorite
          </button>
          {onInsert ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 transition hover:bg-muted"
              onClick={() => {
                onInsert();
                triggerRef.current?.focus();
                setOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              Add to palette
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
