import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyToastProps {
  message: string;
  variant?: 'global' | 'local';
  className?: string;
  style?: CSSProperties;
}

export function CopyToast({ message, variant = 'global', className, style }: CopyToastProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border text-foreground shadow-panel',
        variant === 'global'
          ? 'border-success/20 bg-panel px-3 py-2 text-sm'
          : 'border-success/25 bg-panel/95 px-2.5 py-1.5 text-xs backdrop-blur',
        className,
      )}
      style={style}
    >
      <Check className="h-4 w-4 text-success" />
      <span>{message}</span>
    </div>
  );
}
