import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';

interface InspectorFieldProps {
  label: string;
  value: string;
  onCopy?: (anchor?: HTMLElement | null) => void;
  className?: string;
}

export function InspectorField({ label, value, onCopy, className }: InspectorFieldProps) {
  const { setCopyAnchor } = useToast();

  return (
    <div className={cn('rounded-xl border border-border/80 bg-muted/45 p-3', className)}>
      <div className="section-label">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <code className="min-w-0 truncate font-mono text-xs text-foreground">{value}</code>
        {onCopy ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => {
              setCopyAnchor(event.currentTarget);
              onCopy(event.currentTarget);
            }}
          >
            Copy
          </Button>
        ) : null}
      </div>
    </div>
  );
}
