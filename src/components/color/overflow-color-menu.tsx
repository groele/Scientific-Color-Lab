import { Plus, Star } from 'lucide-react';
import type { ColorToken, CopyFormat } from '@/domain/models';
import { useColorActions } from '@/hooks/use-color-actions';

interface OverflowColorMenuProps {
  color: ColorToken;
  onInsert?: () => void;
  onRequestClose: () => void;
}

const formats: CopyFormat[] = ['rgb', 'hsl', 'lab', 'oklch', 'css'];

export function OverflowColorMenu({ color, onInsert, onRequestClose }: OverflowColorMenuProps) {
  const { copyByFormat, favoriteColor } = useColorActions();

  return (
    <>
      {formats.map((format) => (
        <button
          key={format}
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground/85 transition hover:bg-muted"
          onClick={(event) => {
            event.stopPropagation();
            void copyByFormat(color, format, event.currentTarget);
            onRequestClose();
          }}
        >
          <span>Copy {format.toUpperCase()}</span>
        </button>
      ))}
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground/85 transition hover:bg-muted"
        onClick={(event) => {
          event.stopPropagation();
          void favoriteColor(color);
          onRequestClose();
        }}
      >
        <Star className="h-4 w-4" />
        Favorite
      </button>
      {onInsert ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground/85 transition hover:bg-muted"
          onClick={(event) => {
            event.stopPropagation();
            onInsert();
            onRequestClose();
          }}
        >
          <Plus className="h-4 w-4" />
          Add to palette
        </button>
      ) : null}
    </>
  );
}
