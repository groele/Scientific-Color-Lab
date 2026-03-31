import { Button } from '@/components/ui/button';
import type { ScientificColor } from '@/domain/models';
import { useColorActions } from '@/hooks/use-color-actions';

const formats = ['hex', 'rgb', 'hsl', 'lab', 'oklch', 'css'] as const;

export function CopyFormatMenu({ color }: { color: ScientificColor }) {
  const { copyByFormat } = useColorActions();

  return (
    <div className="grid grid-cols-2 gap-2">
      {formats.map((format) => (
        <Button key={format} size="sm" variant="outline" onClick={(event) => void copyByFormat(color, format, event.currentTarget)}>
          {format.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
