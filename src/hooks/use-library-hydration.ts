import { useEffect } from 'react';
import { useLibraryStore } from '@/stores/library-store';

export function useLibraryHydration() {
  const hydrated = useLibraryStore((state) => state.hydrated);
  const hydrate = useLibraryStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [hydrate, hydrated]);

  return hydrated;
}
