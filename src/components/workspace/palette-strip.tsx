import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorSwatchButton } from '@/components/color/color-swatch-button';
import type { Palette } from '@/domain/models';

function SortableSwatch({
  color,
  selected,
  onSelect,
  onSetMainColor,
  onDelete,
  removeLabel,
}: {
  color: Palette['colors'][number];
  selected: boolean;
  onSelect: () => void;
  onSetMainColor: () => void;
  onDelete: () => void;
  removeLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: color.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="min-w-[180px] space-y-2"
    >
      <div {...attributes} {...listeners}>
        <ColorSwatchButton color={color} selected={selected} onSelect={onSelect} onSetMainColor={onSetMainColor} />
      </div>
      <Button className="w-full" size="sm" variant="outline" onClick={onDelete}>
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        {removeLabel}
      </Button>
    </div>
  );
}

interface PaletteStripProps {
  palette: Palette;
  selectedColorId: string;
  onSelect: (colorId: string) => void;
  onSetMainColor: (colorId: string) => void;
  onDelete: (colorId: string) => void;
  onReorder: (from: number, to: number) => void;
}

export function PaletteStrip({
  palette,
  selectedColorId,
  onSelect,
  onSetMainColor,
  onDelete,
  onReorder,
}: PaletteStripProps) {
  const { t } = useTranslation(['workspace']);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    const ids = palette.colors.map((color) => color.id);
    const from = ids.indexOf(String(event.active.id));
    const to = ids.indexOf(String(event.over.id));
    if (from >= 0 && to >= 0) {
      onReorder(from, to);
    }
  };

  const orderedColors = arrayMove(palette.colors, 0, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('workspace:paletteCanvas')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/65">{t('workspace:dragHint')}</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedColors.map((color) => color.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {orderedColors.map((color) => (
                <SortableSwatch
                  key={color.id}
                  color={color}
                  selected={selectedColorId === color.id}
                  onSelect={() => onSelect(color.id)}
                  onSetMainColor={() => onSetMainColor(color.id)}
                  onDelete={() => onDelete(color.id)}
                  removeLabel={t('workspace:remove')}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
