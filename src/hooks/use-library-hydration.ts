import { useEffect } from 'react';
import { useLibraryStore } from '@/stores/library-store';

type LibraryHydrationLevel = Parameters<ReturnType<typeof useLibraryStore.getState>['hydrate']>[0];

export function useLibraryHydration(level: LibraryHydrationLevel = 'full') {
  const hydrated = useLibraryStore((state) => state.hydrated);
  const coreHydrated = useLibraryStore((state) => state.coreHydrated);
  const hydrate = useLibraryStore((state) => state.hydrate);

  useEffect(() => {
    const ready = level === 'core' ? coreHydrated : hydrated;
    if (!ready) {
      void hydrate(level);
    }
  }, [coreHydrated, hydrate, hydrated, level]);

  return level === 'core' ? coreHydrated : hydrated;
}
