import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const uniqueTags = useMemo(() => Array.from(new Set(value.filter(Boolean))), [value]);

  const addDraft = () => {
    const next = draft
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (!next.length) {
      return;
    }

    onChange(Array.from(new Set([...uniqueTags, ...next])));
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {uniqueTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className="rounded-full border border-border bg-panel px-2.5 py-1 text-xs text-foreground/75 transition hover:bg-muted"
            onClick={() => onChange(uniqueTags.filter((entry) => entry !== tag))}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="tag-a, tag-b"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addDraft();
            }
          }}
        />
        <Button variant="outline" onClick={addDraft}>
          Add
        </Button>
      </div>
    </div>
  );
}
