import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SliderNumberField } from '@/components/ui/slider-number-field';
import { useWorkspaceHistory } from '@/hooks/use-workspace-history';
import { useColorActions } from '@/hooks/use-color-actions';
import { nudgeAdjustment } from '@/domain/color/adjustment';
import type { AdjustmentState, ColorToken } from '@/domain/models';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function HighFrequencyAdjustmentPanel() {
  const { t } = useTranslation(['workspace']);
  const selectedColor = useWorkspaceStore((state) => state.getSelectedColor());
  const adjustmentContextVersion = useWorkspaceStore((state) => state.adjustmentContextVersion);
  const adjustment = useWorkspaceStore((state) => state.adjustment);
  const updateAdjustment = useWorkspaceStore((state) => state.updateAdjustment);
  const selectColor = useWorkspaceStore((state) => state.selectedColorId);
  const { canUndo, canRedo, undo, redo } = useWorkspaceHistory();
  const { copyHex } = useColorActions();
  const [comparisonBaseline, setComparisonBaseline] = useState<ColorToken | null>(null);
  const [comparisonAnchorId, setComparisonAnchorId] = useState<string | null>(null);
  const isAdjustingRef = useRef(false);
  const previousColor = comparisonBaseline && comparisonAnchorId === selectedColor.id ? comparisonBaseline : selectedColor;

  useEffect(() => {
    void selectColor;
  }, [selectColor]);

  useEffect(() => {
    isAdjustingRef.current = false;
    setComparisonBaseline(null);
    setComparisonAnchorId(null);
  }, [adjustmentContextVersion]);

  const beginComparisonSessionIfNeeded = (color: ColorToken) => {
    if (isAdjustingRef.current) {
      return;
    }

    isAdjustingRef.current = true;
    setComparisonBaseline(color);
    setComparisonAnchorId(color.id);
  };

  const markSessionComplete = () => {
    isAdjustingRef.current = false;
  };

  const applyAdjustment = (nextAdjustment: AdjustmentState) => {
    beginComparisonSessionIfNeeded(selectedColor);
    updateAdjustment(nextAdjustment);
  };

  const applyNudge = (nextAdjustment: AdjustmentState) => {
    beginComparisonSessionIfNeeded(selectedColor);
    updateAdjustment(nextAdjustment);
    markSessionComplete();
  };

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
          onChange={(value) => applyAdjustment({ ...adjustment, hue: value })}
          onNudge={(delta) => applyNudge(nudgeAdjustment(adjustment, 'hue', delta))}
          onCommit={markSessionComplete}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, hue: !adjustment.locks.hue } })}
        />
        <SliderNumberField
          label={t('workspace:lightness')}
          value={adjustment.lightness}
          min={0}
          max={1}
          step={0.01}
          locked={adjustment.locks.lightness}
          onChange={(value) => applyAdjustment({ ...adjustment, lightness: value })}
          onNudge={(delta) => applyNudge(nudgeAdjustment(adjustment, 'lightness', delta))}
          onCommit={markSessionComplete}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, lightness: !adjustment.locks.lightness } })}
        />
        <SliderNumberField
          label={t('workspace:chroma')}
          value={adjustment.chroma}
          min={0}
          max={0.28}
          step={0.005}
          locked={adjustment.locks.chroma}
          onChange={(value) => applyAdjustment({ ...adjustment, chroma: value })}
          onNudge={(delta) => applyNudge(nudgeAdjustment(adjustment, 'chroma', delta))}
          onCommit={markSessionComplete}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, chroma: !adjustment.locks.chroma } })}
        />
        <SliderNumberField
          label={t('workspace:alpha')}
          value={adjustment.alpha}
          min={0}
          max={1}
          step={0.05}
          locked={adjustment.locks.alpha}
          onChange={(value) => applyAdjustment({ ...adjustment, alpha: value })}
          onNudge={(delta) => applyNudge(nudgeAdjustment(adjustment, 'alpha', delta))}
          onCommit={markSessionComplete}
          onToggleLock={() => updateAdjustment({ ...adjustment, locks: { ...adjustment.locks, alpha: !adjustment.locks.alpha } })}
        />
      </CardContent>
    </Card>
  );
}
