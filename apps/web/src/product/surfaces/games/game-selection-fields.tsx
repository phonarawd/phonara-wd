import { useId } from 'react';

import type { GameConfig, GameField } from '@/features/casino/types';
import { getSelectionValue } from '@/features/casino/helpers';
import { useT } from '@/product/i18n';
import { HelpTip } from '@/product/primitives/help-tip';
import { CASINO_CRASH_AUTOCASHOUT_HELP_KEY } from '@/domain/casino-games-batch-a-display-contract';
import { CASINO_MINES_CASHOUT_HELP_KEY } from '@/domain/casino-games-batch-b-display-contract';
import { CASINO_MOMENTUM_CASHOUT_HELP_KEY } from '@/domain/casino-games-batch-c-display-contract';
import { CASINO_DEEPSHAFT_DEPTH_HELP_KEY } from '@/domain/casino-games-batch-d-display-contract';
import type { MessageKey } from '@phonara/i18n';

export type GameSelectionFieldsProps = {
  config: GameConfig;
  selection: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
};

function fieldValue(selection: Record<string, unknown>, key: string): string {
  const raw = getSelectionValue(selection, key);
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return raw ? 'true' : 'false';
  return String(raw);
}

function FieldControl({
  field,
  value,
  disabled,
  onValue,
  help,
}: {
  field: GameField;
  value: string;
  disabled?: boolean;
  onValue: (next: string) => void;
  help?: { bodyKey: MessageKey };
}) {
  const t = useT();
  const id = useId();

  if (field.kind === 'cells') {
    return null;
  }

  const label = t(field.labelKey);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-foreground-muted text-xs font-medium" htmlFor={id}>
        {help ? <HelpTip label={label} bodyKey={help.bodyKey} /> : label}
      </label>
      {field.kind === 'select' ? (
        <select
          id={id}
          className="border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-3"
          value={value}
          disabled={disabled}
          data-testid={`casino-selection-${field.key}`}
          onChange={(e) => onValue(e.target.value)}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          inputMode={field.kind === 'text' ? (field.inputMode ?? 'decimal') : 'numeric'}
          className="border-line bg-surface-raised text-foreground min-h-12 rounded-md border px-3 tabular-nums"
          value={value}
          disabled={disabled}
          data-testid={`casino-selection-${field.key}`}
          onChange={(e) => onValue(e.target.value)}
        />
      )}
    </div>
  );
}

/** Pre-bet selection — crash/limbo/dice fields · mines mineCount · hilo firstGuess. Cells live on stage. */
export function GameSelectionFields({
  config,
  selection,
  onChange,
  disabled,
}: GameSelectionFieldsProps) {
  if (config.fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-3" data-testid="casino-game-selection-fields">
      {config.fields.map((field) => {
        if (field.kind === 'cells') return null;
        const help =
          config.code === 'crash' && field.key === 'autoCashout'
            ? { bodyKey: CASINO_CRASH_AUTOCASHOUT_HELP_KEY }
            : config.code === 'mines' && field.key === 'mineCount'
              ? { bodyKey: CASINO_MINES_CASHOUT_HELP_KEY }
              : config.code === 'momentum' && field.key === 'cashOut'
                ? { bodyKey: CASINO_MOMENTUM_CASHOUT_HELP_KEY }
                : config.code === 'deepshaft' &&
                    (field.key === 'targetDepth' || field.key === 'riskTier')
                  ? { bodyKey: CASINO_DEEPSHAFT_DEPTH_HELP_KEY }
                  : undefined;
        return (
          <FieldControl
            key={field.key}
            field={field}
            value={fieldValue(selection, field.key)}
            disabled={disabled}
            help={help}
            onValue={(next) => {
              if (field.key === 'guesses.0') {
                const guesses = Array.isArray(selection['guesses'])
                  ? [...(selection['guesses'] as unknown[])]
                  : [];
                guesses[0] = next;
                onChange({ ...selection, guesses });
                return;
              }
              if (config.code === 'momentum' && field.key === 'cashOut') {
                onChange({ ...selection, cashOut: next === 'true' });
                return;
              }
              if (field.kind === 'number') {
                const n = Number(next);
                onChange({ ...selection, [field.key]: Number.isFinite(n) ? n : next });
                return;
              }
              onChange({ ...selection, [field.key]: next });
            }}
          />
        );
      })}
    </div>
  );
}
