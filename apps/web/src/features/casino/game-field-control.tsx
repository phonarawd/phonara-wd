import { SegmentedControl } from '@phonara/ui';
import { useT } from '../../lib/i18n';
import { normalizeDecimalInput } from '../../lib/money-input';
import { cellsFromText, getSelectionValue } from './helpers';
import type { GameField } from './types';

export function GameFieldControl({
  field,
  selection,
  onChange,
}: {
  field: GameField;
  selection: Record<string, unknown>;
  onChange: (key: string, value: string) => void;
}) {
  const t = useT();
  const value = getSelectionValue(selection, field.key);

  if (field.kind === 'select') {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg">{t(field.labelKey)}</span>
        <SegmentedControl<string>
          value={String(value)}
          onChange={(next) => onChange(field.key, next)}
          options={field.options.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
        />
      </label>
    );
  }

  if (field.kind === 'cells') {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg">{t(field.labelKey)}</span>
        <input
          className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-fg"
          value={Array.isArray(value) ? value.join(',') : ''}
          onChange={(event) => onChange(field.key, cellsFromText(event.target.value, field.max).join(','))}
        />
        <span className="text-xs text-muted">{t('casino.field.cellsHint')}</span>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-fg">{t(field.labelKey)}</span>
      <input
        className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-right text-fg tabular-nums"
        inputMode={field.kind === 'number' ? 'numeric' : field.inputMode}
        min={field.kind === 'number' ? field.min : undefined}
        max={field.kind === 'number' ? field.max : undefined}
        step={field.kind === 'number' ? field.step : undefined}
        value={String(value)}
        onChange={(event) => {
          const next = field.kind === 'text' && field.inputMode === 'decimal'
            ? normalizeDecimalInput(event.target.value)
            : event.target.value;
          onChange(field.key, next);
        }}
      />
    </label>
  );
}
