import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SliderNumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  locked?: boolean;
  onChange: (value: number) => void;
  onNudge: (delta: number) => void;
  onCommit?: () => void;
  onToggleLock?: () => void;
}

export function SliderNumberField({
  label,
  value,
  min,
  max,
  step,
  locked = false,
  onChange,
  onNudge,
  onCommit,
  onToggleLock,
}: SliderNumberFieldProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border/80 bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="section-label">{label}</span>
        {onToggleLock ? (
          <button className="text-xs text-foreground/60 transition hover:text-foreground" type="button" onClick={onToggleLock}>
            {locked ? 'Locked' : 'Unlocked'}
          </button>
        ) : null}
      </div>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-accent-soft accent-[hsl(var(--accent))]"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onNudge(-step)}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          type="number"
          min={min}
          max={max}
          step={step}
          onBlur={onCommit}
        />
        <Button size="sm" variant="outline" onClick={() => onNudge(step)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
