import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-provider';
import { serializeColorByFormat } from '@/domain/color/convert';
import type { ColorToken, CopyFormat } from '@/domain/models';
import { copyTextToClipboard } from '@/services/clipboard-service';
import { useLibraryStore } from '@/stores/library-store';

interface SwatchActionOptions {
  onSelect?: () => void;
  onSetMainColor?: () => void;
  anchor?: Element | null;
  shiftKey?: boolean;
}

export function useColorActions() {
  const { t } = useTranslation();
  const { pushToast, pushCopyFeedback } = useToast();
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);

  const copyHex = async (color: ColorToken, anchor?: Element | null) => {
    await copyTextToClipboard(color.hex);
    pushCopyFeedback(t('common.copiedHex', { hex: color.hex }), anchor);
  };

  const copyByFormat = async (color: ColorToken, format: CopyFormat, anchor?: Element | null) => {
    const value = serializeColorByFormat(color, format);
    await copyTextToClipboard(value);
    pushCopyFeedback(t('common.copiedValue', { value }), anchor);
  };

  const favoriteColor = async (color: ColorToken) => {
    await toggleFavorite('color', color.id, color.name);
    pushToast(t('common.favorited', { name: color.name }));
  };

  const handleSwatchClick = async (color: ColorToken, options: SwatchActionOptions = {}) => {
    if (options.shiftKey) {
      await favoriteColor(color);
      return;
    }

    options.onSelect?.();
    await copyHex(color, options.anchor);
  };

  const handleSwatchDoubleClick = (color: ColorToken, options: SwatchActionOptions = {}) => {
    options.onSetMainColor?.();
    void copyHex(color, options.anchor);
  };

  return {
    copyHex,
    copyByFormat,
    favoriteColor,
    handleSwatchClick,
    handleSwatchDoubleClick,
  };
}
