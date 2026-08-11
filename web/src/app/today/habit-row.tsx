'use client';

import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { Check, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Habit } from '@/lib/plan';
import { setHabitNumeric, toggleHabitBoolean } from './actions';

const AUTOSAVE_DEBOUNCE_MS = 900;

export function HabitRow({
  habit,
  weightKg,
  logDate,
}: {
  habit: Habit;
  weightKg: number | null;
  logDate: string;
}) {
  const [pending, startTransition] = useTransition();

  const serverDone = habit.tick?.done ?? false;
  const [optimisticDone, setOptimisticDone] = useOptimistic(serverDone);
  const done = optimisticDone;

  // Numeric-habit local state — the string in the input.
  const serverValue = habit.tick?.value != null ? String(habit.tick.value) : '';
  const [inputValue, setInputValue] = useState<string>(serverValue);
  const [savedFlash, setSavedFlash] = useState(false);

  // Track the last value we sent to the server so we can:
  //   1) skip redundant saves,
  //   2) know when server has caught up (drop the "Save" chip).
  const lastSavedRef = useRef<string>(serverValue);

  // When the server value updates (revalidation after our save, or another
  // device/tab changed it), reconcile the local state — but only if the user
  // has no unsaved edit in flight.
  useEffect(() => {
    if (inputValue === lastSavedRef.current) {
      // Not editing; safe to accept server value.
      if (serverValue !== inputValue) {
        setInputValue(serverValue);
        lastSavedRef.current = serverValue;
      }
    } else if (inputValue === serverValue) {
      // Our own save came back; sync bookkeeping.
      lastSavedRef.current = serverValue;
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 1400);
      return () => clearTimeout(t);
    }
  }, [serverValue, inputValue]);

  const isStepsHabit = habit.targetUnit === 'steps';
  const stepsValue = Number(inputValue || 0);
  const stepsBurnKcal =
    isStepsHabit && weightKg != null && stepsValue > 0
      ? Math.round(stepsValue * 0.0005 * weightKg)
      : null;

  const doSave = (value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return;
    if (value === lastSavedRef.current) return;
    lastSavedRef.current = value;
    startTransition(async () => {
      await setHabitNumeric(
        habit.id,
        n,
        habit.targetUnit ?? '',
        habit.targetValue ?? 0,
        logDate
      );
    });
  };

  // Debounced auto-save: whenever inputValue changes and differs from what
  // we last saved, schedule a save after AUTOSAVE_DEBOUNCE_MS.
  useEffect(() => {
    if (habit.isBoolean) return;
    if (inputValue === lastSavedRef.current) return;
    const t = setTimeout(() => doSave(inputValue), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, habit.isBoolean]);

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticDone(!serverDone);
      await toggleHabitBoolean(habit.id, serverDone, logDate);
    });
  };

  const stepBy = (delta: number) => {
    const cur = Number(inputValue || 0);
    const next = Math.max(0, cur + delta);
    setInputValue(String(next));
    // Instant save on tap so +/- feels responsive
    doSave(String(next));
  };

  const dirty = inputValue !== lastSavedRef.current;

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
            {done && <Check className="h-5 w-5" strokeWidth={3} />}
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
              onBlur={() => doSave(inputValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-16 h-9 rounded-md border bg-background text-center text-sm tabular-nums"
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

      {/* Status strip for numeric habits: dirty (unsaved) or saved-flash */}
      {!habit.isBoolean && (dirty || savedFlash || pending) && (
        <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
          {pending ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          ) : dirty ? (
            <button
              type="button"
              onClick={() => doSave(inputValue)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              <Check className="h-3 w-3" strokeWidth={3} /> Save
            </button>
          ) : savedFlash ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Check className="h-3 w-3" strokeWidth={3} /> Saved
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
