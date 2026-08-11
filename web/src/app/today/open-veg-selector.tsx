'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FoodLite, VegSelection } from '@/lib/plan';
import { addVegSelection, removeVegSelection, updateVegSelection } from './actions';

type Props = {
  planItemId: string;
  targetGrams: number;
  selections: VegSelection[];
  allowedVegs: FoodLite[];
  logDate: string;
};

export function OpenVegSelector({
  planItemId,
  targetGrams,
  selections,
  allowedVegs,
  logDate,
}: Props) {
  const [addingOpen, setAddingOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const totalGrams = selections.reduce((s, sel) => s + sel.grams, 0);
  const remaining = Math.max(0, targetGrams - totalGrams);
  const over = totalGrams > targetGrams;
  const pct = Math.min(100, (totalGrams / targetGrams) * 100);

  const selectedFoodIds = new Set(selections.map((s) => s.food.id));
  const availableVegs = allowedVegs.filter((v) => !selectedFoodIds.has(v.id));

  const handleAdd = (foodId: string) => {
    // Default grams: remaining budget (or 30 if already at/over target)
    const defaultGrams = remaining > 0 ? Math.min(remaining, 60) : 30;
    startTransition(async () => {
      await addVegSelection(planItemId, foodId, defaultGrams, logDate);
    });
    setAddingOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs">
        <span className={cn('tabular-nums font-medium', over && 'text-red-600')}>
          {Math.round(totalGrams)} / {targetGrams} g
        </span>
        {over && (
          <span className="inline-flex items-center gap-0.5 text-red-600">
            <AlertTriangle className="h-3 w-3" />
            over
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            over ? 'bg-red-500' : pct >= 80 ? 'bg-emerald-500' : 'bg-emerald-400'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Selections */}
      {selections.length > 0 && (
        <div className="space-y-1.5">
          {selections.map((sel) => (
            <SelectionRow key={sel.id} selection={sel} disabled={pending} />
          ))}
        </div>
      )}

      {/* Add button + picker */}
      {addingOpen ? (
        <div className="rounded-xl border bg-muted/30 p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Add vegetable
            </span>
            <button
              type="button"
              onClick={() => setAddingOpen(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          {availableVegs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              All allowed vegetables already added.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availableVegs.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleAdd(v.id)}
                  disabled={pending}
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border bg-background hover:bg-background/60 border-border disabled:opacity-50"
                >
                  {v.enName}
                  {v.hiName && <span className="ml-1 opacity-70">· {v.hiName}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingOpen(true)}
          disabled={pending}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
            'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
            pending && 'opacity-50'
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {selections.length === 0 ? 'Add vegetable' : 'Add another'}
        </button>
      )}
    </div>
  );
}

function SelectionRow({
  selection,
  disabled,
}: {
  selection: VegSelection;
  disabled: boolean;
}) {
  const [value, setValue] = useState<string>(String(selection.grams));
  const [pending, startTransition] = useTransition();

  const commit = () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      // Treat as remove
      startTransition(async () => {
        await removeVegSelection(selection.id);
      });
      return;
    }
    if (n === selection.grams) return;
    startTransition(async () => {
      await updateVegSelection(selection.id, n);
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removeVegSelection(selection.id);
    });
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5 text-xs">
      <div className="flex-1 min-w-0 truncate">
        <span className="font-medium">{selection.food.enName}</span>
        {selection.food.hiName && (
          <span className="ml-1 text-muted-foreground">· {selection.food.hiName}</span>
        )}
      </div>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        value={value}
        disabled={disabled || pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-14 h-7 rounded-md border bg-background text-center tabular-nums"
      />
      <span className="text-muted-foreground">g</span>
      <button
        type="button"
        onClick={handleRemove}
        disabled={disabled || pending}
        aria-label="Remove"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center shrink-0 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
