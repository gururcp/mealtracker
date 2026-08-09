'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronRight, Loader2, Pencil, Repeat, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  computeItemBreakdown,
  computeItemNutrition,
  isOpenVegItem,
  resolvePrimary,
  scaleVegSelections,
  servingToGrams,
} from '@/lib/nutrition';
import type { Alternate, FoodLite, PlanItem, Unit } from '@/lib/plan';
import { NutritionPanel } from './nutrition-panel';
import { OpenVegSelector } from './open-veg-selector';
import { pickAlternate, setItemQuantity, toggleMealTick } from './actions';

type Props = {
  item: PlanItem;
  allowedVegs: FoodLite[];
};

export function ItemCard({ item, allowedVegs }: Props) {
  // Route to the open_veg variant if this is a sabziyaan slot
  if (isOpenVegItem(item)) {
    return <OpenVegItemCard item={item} allowedVegs={allowedVegs} />;
  }
  return <SpecificItemCard item={item} allowedVegs={allowedVegs} />;
}

// ---------------------------------------------------------------------------
// Open-veg item (multi-veg selector)
// ---------------------------------------------------------------------------

function OpenVegItemCard({ item, allowedVegs }: Props) {
  const [expanded, setExpanded] = useState(false);

  const openVegAlt = item.alternates.find((a) => a.kind === 'open_veg');
  const targetGrams = openVegAlt?.quantity ?? 0;
  const totalGrams = item.vegSelections.reduce((s, v) => s + v.grams, 0);
  const eaten = item.tick?.eaten ?? false;
  const nutrition = computeItemNutrition(item, allowedVegs);
  const hasSelections = item.vegSelections.length > 0;

  return (
    <div
      className={cn(
        'rounded-2xl border transition-colors overflow-hidden',
        eaten ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="w-full flex items-center gap-2 px-3 py-3 text-left"
      >
        <span
          className={cn(
            'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
            eaten
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-muted-foreground/30'
          )}
          aria-hidden
        >
          {eaten && <Check className="h-5 w-5" strokeWidth={3} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={cn('font-medium', eaten && 'line-through opacity-70')}>
              Sabziyaan
            </span>
            <span className="text-xs text-muted-foreground">सब्ज़ियाँ</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            <span className="tabular-nums">
              {Math.round(totalGrams)} / {targetGrams} g
            </span>
            {hasSelections && (
              <span className="ml-2">
                · {item.vegSelections.length} veg
                {item.vegSelections.length > 1 ? 's' : ''}
              </span>
            )}
            {item.note && <span className="ml-2">· {item.note}</span>}
          </div>
        </div>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform shrink-0',
            expanded && 'rotate-90'
          )}
        />
      </button>

      {/* Multi-veg selector — always visible so mom can add without expanding */}
      <div className="px-3 pb-3">
        <OpenVegSelector
          planItemId={item.id}
          targetGrams={targetGrams}
          selections={item.vegSelections}
          allowedVegs={allowedVegs}
        />
      </div>

      {expanded && hasSelections && (
        <div className="px-3 pb-3">
          <NutritionPanel nutrition={nutrition} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Specific / choice item (single-food picker + quantity edit)
// ---------------------------------------------------------------------------

function SpecificItemCard({ item, allowedVegs }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [pending, startTransition] = useTransition();

  const primary = resolvePrimary(item, allowedVegs);
  const breakdown = computeItemBreakdown(primary, item.ingredients);
  const eaten = item.tick?.eaten ?? false;

  const plannedAlt = pickPlannedAlternate(item);
  const plannedFood: FoodLite | null = plannedAlt?.food ?? null;

  const hasMultipleAlts = item.alternates.length > 1;

  const handleTick = () => {
    startTransition(async () => {
      const foodToRecord = eaten ? null : primary?.food.id ?? null;
      await toggleMealTick(item.id, eaten, foodToRecord);
    });
  };

  const handlePickAlt = (foodId: string) => {
    startTransition(async () => {
      await pickAlternate(item.id, foodId);
    });
    setShowPicker(false);
  };

  return (
    <div
      className={cn(
        'rounded-2xl border transition-colors overflow-hidden',
        eaten ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border'
      )}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={handleTick}
          disabled={pending}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          aria-label={eaten ? 'Mark as not eaten' : 'Mark as eaten'}
          className={cn(
            'shrink-0 w-14 flex items-center justify-center transition-colors',
            'active:bg-black/5',
            pending && 'opacity-50'
          )}
        >
          <span
            className={cn(
              'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all',
              eaten
                ? 'bg-emerald-500 border-emerald-500 text-white scale-105'
                : 'border-muted-foreground/30'
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : eaten ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : null}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="flex-1 flex items-center gap-2 py-3 pr-2 text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={cn('font-medium', eaten && 'line-through opacity-70')}>
                {primary ? primary.food.enName : '—'}
              </span>
              {primary?.food.hiName && (
                <span className="text-xs text-muted-foreground">{primary.food.hiName}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <QuantityLabel
                planned={plannedAlt}
                plannedFood={plannedFood}
                actualG={item.tick?.quantityEatenG ?? null}
              />
              {item.ingredients.length > 0 && (
                <span className="ml-1.5 text-muted-foreground/70">
                  + {item.ingredients.length}
                </span>
              )}
              {item.note && <span className="ml-2">· {item.note}</span>}
            </div>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0',
              expanded && 'rotate-90'
            )}
          />
        </button>
      </div>

      {(hasMultipleAlts || eaten) && (
        <div className="px-3 pb-3 flex items-center gap-3 flex-wrap">
          {hasMultipleAlts && (
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 -ml-2 rounded text-muted-foreground hover:text-foreground"
            >
              <Repeat className="h-3.5 w-3.5" />
              {showPicker ? 'Hide options' : 'Change'}
            </button>
          )}
          {eaten && primary && (
            <QuantityEditor
              itemId={item.id}
              food={primary.food}
              plannedQuantity={plannedAlt?.quantity ?? 0}
              plannedUnit={(plannedAlt?.unit ?? 'g') as Unit}
              actualG={item.tick?.quantityEatenG ?? null}
              editing={editingQty}
              setEditing={setEditingQty}
              disabled={pending}
            />
          )}
        </div>
      )}

      {showPicker && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-2">
            {item.alternates
              .filter((a): a is Alternate & { food: FoodLite } => a.kind === 'specific' && a.food != null)
              .map((a) => (
                <PickerChip
                  key={a.id}
                  label={a.food.enName}
                  subLabel={a.food.hiName ?? undefined}
                  selected={a.food.id === primary?.food.id}
                  disabled={pending}
                  onClick={() => handlePickAlt(a.food.id)}
                />
              ))}
          </div>
        </div>
      )}

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {item.ingredients.length > 0 && (
            <div className="rounded-xl bg-muted/30 border p-3 text-xs space-y-1.5">
              <p className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                Also includes
              </p>
              {breakdown.ingredients.map(({ ing }) => (
                <div key={ing.id} className="flex justify-between gap-2">
                  <span>
                    {ing.food.enName}
                    {ing.food.hiName && (
                      <span className="ml-1 text-muted-foreground">· {ing.food.hiName}</span>
                    )}
                    {ing.note && (
                      <span className="ml-1 text-muted-foreground/70">({ing.note})</span>
                    )}
                  </span>
                  <span className="tabular-nums text-muted-foreground shrink-0">
                    {trimZeros(ing.quantity)} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
          {primary && <NutritionPanel nutrition={breakdown.total} />}
        </div>
      )}
    </div>
  );
}

function pickPlannedAlternate(item: PlanItem): Alternate | null {
  return item.alternates.find((a) => a.isDefault) ?? item.alternates[0] ?? null;
}

function QuantityLabel({
  planned,
  plannedFood,
  actualG,
}: {
  planned: Alternate | null;
  plannedFood: FoodLite | null;
  actualG: number | null;
}) {
  if (!planned) return <span>—</span>;
  const plannedText = `${trimZeros(planned.quantity)} ${planned.unit}`;
  if (actualG == null) return <span className="tabular-nums">{plannedText}</span>;
  const plannedG =
    plannedFood != null ? servingToGrams(plannedFood, planned.quantity, planned.unit) : null;
  return (
    <span>
      <span className="tabular-nums font-medium text-foreground">{trimZeros(actualG)} g</span>
      {plannedG != null && actualG !== plannedG && (
        <span className="ml-1 text-muted-foreground line-through tabular-nums">
          {plannedText}
        </span>
      )}
    </span>
  );
}

function QuantityEditor({
  itemId,
  food,
  plannedQuantity,
  plannedUnit,
  actualG,
  editing,
  setEditing,
  disabled,
}: {
  itemId: string;
  food: FoodLite;
  plannedQuantity: number;
  plannedUnit: Unit;
  actualG: number | null;
  editing: boolean;
  setEditing: (v: boolean) => void;
  disabled: boolean;
}) {
  const unitPerServing =
    plannedUnit === 'piece'
      ? food.pieceGrams ?? 1
      : plannedUnit === 'tsp'
      ? food.tspGrams ?? 1
      : plannedUnit === 'tbsp'
      ? food.tbspGrams ?? 1
      : 1;

  const currentInPlannedUnit =
    actualG != null && unitPerServing > 0 ? actualG / unitPerServing : plannedQuantity;

  const [value, setValue] = useState<string>(trimZeros(currentInPlannedUnit));
  const [pending, startTransition] = useTransition();

  const save = () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      setEditing(false);
      return;
    }
    const grams = n * unitPerServing;
    startTransition(async () => {
      await setItemQuantity(itemId, grams);
    });
    setEditing(false);
  };

  const reset = () => {
    startTransition(async () => {
      await setItemQuantity(itemId, null);
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={disabled}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded"
      >
        <Pencil className="h-3 w-3" />
        {actualG != null ? 'Edit actual' : 'Log actual'}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-16 h-8 rounded-md border bg-background text-center tabular-nums"
      />
      <span className="text-muted-foreground">{plannedUnit}</span>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="h-8 px-3 rounded-md bg-foreground text-background text-xs font-medium disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
      </button>
      {actualG != null && (
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          aria-label="Reset to planned"
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function PickerChip({
  label,
  subLabel,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  subLabel?: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        selected
          ? 'bg-foreground text-background border-foreground'
          : 'bg-background hover:bg-muted border-border',
        disabled && 'opacity-50'
      )}
    >
      {label}
      {subLabel && <span className="ml-1 opacity-70">· {subLabel}</span>}
    </button>
  );
}

function trimZeros(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100).replace(/\.?0+$/, '');
}
