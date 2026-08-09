'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Habit } from '@/lib/plan';
import { setHabitNumeric, toggleHabitBoolean } from './actions';

export function HabitRow({
  habit,
  weightKg,
}: {
  habit: Habit;
  weightKg: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState<string>(
    habit.tick?.value != null ? String(habit.tick.value) : ''
  );

  const done = habit.tick?.done ?? false;
  const isStepsHabit = habit.targetUnit === 'steps';
  const stepsValue = Number(inputValue || 0);
  // Very rough estimate: MET ≈ 3.5 for moderate walking; each step ≈ 0.75 m;
  // simplified: kcal ≈ steps × 0.0005 × weight_kg  (≈0.04 kcal/step at ~80kg).
  const stepsBurnKcal =
    isStepsHabit && weightKg != null && stepsValue > 0
      ? Math.round(stepsValue * 0.0005 * weightKg)
      : null;

  const handleToggle = () => {
    startTransition(async () => {
      await toggleHabitBoolean(habit.id, done);
    });
  };

  const handleNumericSubmit = () => {
    const v = Number(inputValue);
    if (!Number.isFinite(v) || v < 0) return;
    startTransition(async () => {
      await setHabitNumeric(
        habit.id,
        v,
        habit.targetUnit ?? '',
        habit.targetValue ?? 0
      );
    });
  };

  const stepBy = (delta: number) => {
    const cur = Number(inputValue || 0);
    const next = Math.max(0, cur + delta);
    setInputValue(String(next));
    startTransition(async () => {
      await setHabitNumeric(
        habit.id,
        next,
        habit.targetUnit ?? '',
        habit.targetValue ?? 0
      );
    });
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-3 transition-colors',
        done ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', done && 'line-through opacity-70')}>
            {habit.enLabel}
          </p>
          {habit.hiLabel && (
            <p className="text-xs text-muted-foreground truncate">{habit.hiLabel}</p>
          )}
          {!habit.isBoolean && habit.targetValue != null && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Target: {habit.targetValue}
              {habit.targetMaxValue != null ? `–${habit.targetMaxValue}` : ''} {habit.targetUnit}
              {stepsBurnKcal != null && (
                <span className="ml-2 text-emerald-700">· ~{stepsBurnKcal} kcal burnt</span>
              )}
            </p>
          )}
        </div>

        {habit.isBoolean ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={pending}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            aria-label={done ? 'Undo' : 'Mark as done'}
            className={cn(
              'h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
              done
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-muted-foreground/30'
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : done ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : null}
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => stepBy(-1)}
              disabled={pending || Number(inputValue || 0) <= 0}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              className="h-9 w-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 active:scale-95"
              aria-label="Decrease"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleNumericSubmit}
              className="w-14 h-9 rounded-md border bg-background text-center text-sm tabular-nums"
              placeholder="0"
            />
            <button
              type="button"
              onClick={() => stepBy(1)}
              disabled={pending}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              className="h-9 w-9 rounded-full bg-muted flex items-center justify-center active:scale-95"
              aria-label="Increase"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
