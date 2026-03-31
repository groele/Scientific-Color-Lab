import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SliderNumberField } from '@/components/ui/slider-number-field';
import { useWorkspaceHistory } from '@/hooks/use-workspace-history';
import { useColorActions } from '@/hooks/use-color-actions';
import { nudgeAdjustment } from '@/domain/color/adjustment';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function HighFrequencyAdjustmentPanel() {
  const { t } = useTranslation(['workspace']);
  const selectedColor = useWorkspaceStore((state) => state.getSelectedColor());
  const previousColorState = useWorkspaceStore((state) => state.previousColor);
  const adjustment = useWorkspaceStore((state) => state.adjustment);
  const updateAdjustment = useWorkspaceStore((state) => state.updateAdjustment);
  const selectColor = useWorkspaceStore((state) => state.selectedColorId);
  const { canUndo, canRedo, undo, redo } = useWorkspaceHistory();
  const { copyHex } = useColorActions();
  const previousColor = previousColorState ?? selectedColor;

  useEffect(() => {
    void selectColor;
  }, [selectColor]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('workspace:adjustmentPanel')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-3">
            <div className="section-label">{t('workspace:previousCurrent')}</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <button
                  type="button"
                  className="h-16 w-full rounded-xl border border-border/70 bg-muted transition hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  style={{ backgroundColor: selectedColor.hex }}
                  onClick={(event) => void copyHex(selectedColor, event.currentTarget)}
                  title={`${t('workspace:currentColor')} ${selectedColor.hex}`}
                />
                <div className="font-mono text-xs text-foreground/55">{selectedColor.hex}</div>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  className="h-16 w-full rounded-xl border border-border/70 bg-muted transition hover:border-foreground/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  style={{ backgroundColor: previousColor.hex }}
                  onClick={(event) => void copyHex(previousColor, event.currentTarget)}
                  title={`${t('workspace:previousColor')} ${previousColor.hex}`}
                />
                <div className="font-mono text-xs text-foreground/55">{previousColor.hex}</div>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <button type="button" className="rounded-xl border border-border/80 bg-panel px-3 py-2 text-sm text-left" onClick={undo} disabled={!canUndo}>
              {t('workspace:undoAdjustment')}
            </button>
            <button type="button" className="rounded-xl border border-border/80 bg-panel px-3 py-2 text-sm text-left" onClick={redo} disabled={!canRedo}>
              {t('workspace:redoAdjustment')}
            </button>
          </div>
        </div>

        <SliderNumberField
          label={t('workspace:hue')}
          value={adjustment.hue}
          min={0}
          max={360}
          step={1}
          locked={adjustment.locks.hue}
          onChange={(value) => updateAdjustment({ ...adjustment, hue: value })}
          onNudge={(delta) => updateAdjustment(nudgeAdjustment(adjustment, 'hue', delta))}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, hue: !adjustment.locks.hue } })}
        />
        <SliderNumberField
          label={t('workspace:lightness')}
          value={adjustment.lightness}
          min={0}
          max={1}
          step={0.01}
          locked={adjustment.locks.lightness}
          onChange={(value) => updateAdjustment({ ...adjustment, lightness: value })}
          onNudge={(delta) => updateAdjustment(nudgeAdjustment(adjustment, 'lightness', delta))}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, lightness: !adjustment.locks.lightness } })}
        />
        <SliderNumberField
          label={t('workspace:chroma')}
          value={adjustment.chroma}
          min={0}
          max={0.28}
          step={0.005}
          locked={adjustment.locks.chroma}
          onChange={(value) => updateAdjustment({ ...adjustment, chroma: value })}
          onNudge={(delta) => updateAdjustment(nudgeAdjustment(adjustment, 'chroma', delta))}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, chroma: !adjustment.locks.chroma } })}
        />
        <SliderNumberField
          label={t('workspace:alpha')}
          value={adjustment.alpha}
          min={0}
          max={1}
          step={0.05}
          locked={adjustment.locks.alpha}
          onChange={(value) => updateAdjustment({ ...adjustment, alpha: value })}
          onNudge={(delta) => updateAdjustment(nudgeAdjustment(adjustment, 'alpha', delta))}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, alpha: !adjustment.locks.alpha } })}
        />
      </CardContent>
    </Card>
  );
}
