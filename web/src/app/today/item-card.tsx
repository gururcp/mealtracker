'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Check, ChevronDown, Loader2, Pencil, Repeat, Salad, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  computeItemBreakdown,
  computeItemNutrition,
  isOpenVegItem,
  resolvePrimary,
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
  if (isOpenVegItem(item)) {
    return <OpenVegItemCard item={item} allowedVegs={allowedVegs} />;
  }
  return <SpecificItemCard item={item} allowedVegs={allowedVegs} />;
}

// ---------------------------------------------------------------------------
// Category → subtle color accent for the food dot
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<string, { dot: string; bg: string }> = {
  vegetable:  { dot: 'bg-emerald-500',  bg: 'bg-emerald-50/60' },
  fruit:      { dot: 'bg-rose-400',     bg: 'bg-rose-50/60' },
  protein:    { dot: 'bg-amber-500',    bg: 'bg-amber-50/60' },
  dairy:      { dot: 'bg-sky-400',      bg: 'bg-sky-50/60' },
  grain:      { dot: 'bg-yellow-500',   bg: 'bg-yellow-50/60' },
  oil:        { dot: 'bg-orange-400',   bg: 'bg-orange-50/60' },
  spice:      { dot: 'bg-red-400',      bg: 'bg-red-50/60' },
  beverage:   { dot: 'bg-stone-500',    bg: 'bg-stone-100' },
  supplement: { dot: 'bg-violet-400',   bg: 'bg-violet-50/60' },
  other:      { dot: 'bg-neutral-400',  bg: 'bg-neutral-50' },
};

function categoryStyle(cat?: string) {
  return CATEGORY_STYLES[cat ?? 'other'] ?? CATEGORY_STYLES.other;
}

// ---------------------------------------------------------------------------
// Open-veg item (multi-veg selector)
// ---------------------------------------------------------------------------

function OpenVegItemCard({ item, allowedVegs }: Props) {
  const [expanded, setExpanded] = useState(false);

  const openVegAlt = item.alternates.find((a) => a.kind === 'open_veg');
  const targetGrams = openVegAlt?.quantity ?? 0;
  const eaten = item.tick?.eaten ?? false;
  const nutrition = computeItemNutrition(item, allowedVegs);
  const hasSelections = item.vegSelections.length > 0;

  return (
    <div
      className={cn(
        'rounded-3xl border transition-colors overflow-hidden',
        eaten ? 'bg-emerald-50/50 border-emerald-200/70' : 'bg-card border-border'
      )}
    >
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center',
            eaten ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'
          )}
        >
          {eaten ? (
            <Check className="h-5 w-5" strokeWidth={2.5} />
          ) : (
            <Salad className="h-5 w-5" strokeWidth={1.75} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className={cn('font-semibold tracking-tight', eaten && 'line-through opacity-70')}>
              Sabziyaan
            </h3>
            <span className="text-xs text-muted-foreground">सब्ज़ियाँ</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {item.vegSelections.reduce((s, v) => s + v.grams, 0)} / {targetGrams} g
          </p>
          {item.note && (
            <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1">{item.note}</p>
          )}
        </div>
      </div>

      {/* Multi-veg selector — always visible so mom can add without expanding */}
      <div className="px-4 pb-3">
        <OpenVegSelector
          planItemId={item.id}
          targetGrams={targetGrams}
          selections={item.vegSelections}
          allowedVegs={allowedVegs}
        />
      </div>

      {hasSelections && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className="w-full px-4 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border-t border-dashed border-border/70"
          >
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'Hide nutrition' : 'See combined nutrition'}
          </button>
          {expanded && (
            <div className="px-4 pb-4">
              <NutritionPanel nutrition={nutrition} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Specific / choice item
// ---------------------------------------------------------------------------

function SpecificItemCard({ item, allowedVegs }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [pending, startTransition] = useTransition();

  const primary = resolvePrimary(item, allowedVegs);
  const breakdown = computeItemBreakdown(primary, item.ingredients);
  const serverEaten = item.tick?.eaten ?? false;
  // Optimistic tick state — flips immediately on tap without waiting for the
  // server round-trip. Reconciles when the server response lands (item prop
  // updates via revalidatePath and useOptimistic drops the override).
  const [optimisticEaten, setOptimisticEaten] = useOptimistic(serverEaten);
  const eaten = optimisticEaten;
  const catStyle = categoryStyle(primary?.food.category);

  const plannedAlt = pickPlannedAlternate(item);
  const plannedFood: FoodLite | null = plannedAlt?.food ?? null;
  const hasMultipleAlts = item.alternates.length > 1;

  const handleTick = () => {
    startTransition(async () => {
      setOptimisticEaten(!serverEaten);
      const foodToRecord = serverEaten ? null : primary?.food.id ?? null;
      await toggleMealTick(item.id, serverEaten, foodToRecord);
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
        'rounded-3xl border transition-all overflow-hidden',
        eaten
          ? 'bg-emerald-50/50 border-emerald-200/70'
          : 'bg-card border-border shadow-[0_1px_0_rgba(0,0,0,0.02)]'
      )}
    >
      <div className="flex items-stretch">
        {/* Tick button — big tap zone */}
        <button
          type="button"
          onClick={handleTick}
          disabled={pending}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          aria-label={eaten ? 'Mark as not eaten' : 'Mark as eaten'}
          className={cn(
            'shrink-0 pl-4 pr-3 flex items-center justify-center transition-colors',
            'active:scale-95',
            pending && 'opacity-50'
          )}
        >
          <span
            className={cn(
              'h-10 w-10 rounded-2xl flex items-center justify-center transition-all',
              eaten
                ? 'bg-emerald-500 text-white shadow-sm'
                : cn(catStyle.bg, 'border border-border')
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : eaten ? (
              <Check className="h-5 w-5" strokeWidth={2.75} />
            ) : (
              <span className={cn('h-2 w-2 rounded-full', catStyle.dot)} />
            )}
          </span>
        </button>

        {/* Body */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="flex-1 flex items-center gap-2 py-3.5 pr-3 text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3
                className={cn(
                  'font-semibold text-[15px] tracking-tight leading-tight',
                  eaten && 'line-through opacity-70'
                )}
              >
                {primary ? primary.food.enName : '—'}
              </h3>
              {primary?.food.hiName && (
                <span className="text-xs text-muted-foreground">{primary.food.hiName}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <QuantityLabel
                planned={plannedAlt}
                plannedFood={plannedFood}
                actualG={item.tick?.quantityEatenG ?? null}
              />
              {item.ingredients.length > 0 && (
                <span className="inline-flex items-center gap-1 text-muted-foreground/70">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  +{item.ingredients.length}
                </span>
              )}
              {breakdown.total.cal > 0 && (
                <span className="text-[11px] text-muted-foreground/80 tabular-nums">
                  · {Math.round(breakdown.total.cal)} kcal
                </span>
              )}
            </div>
            {item.note && (
              <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1">
                {item.note}
              </p>
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground/60 transition-transform shrink-0',
              expanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      {(hasMultipleAlts || eaten) && (
        <div className="px-4 pb-3 pt-1 flex items-center gap-2 flex-wrap">
          {hasMultipleAlts && (
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors"
            >
              <Repeat className="h-3 w-3" />
              {showPicker ? 'Close' : 'Change'}
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
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
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
        <div className="px-4 pb-4 space-y-2 border-t border-dashed border-border/50 pt-3">
          {item.ingredients.length > 0 && (
            <div className="rounded-2xl bg-muted/40 p-3 text-xs space-y-1.5">
              <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-widest">
                Also includes
              </p>
              {breakdown.ingredients.map(({ ing }) => (
                <div key={ing.id} className="flex justify-between gap-2">
                  <span className="truncate">
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
        <span className="ml-1 text-muted-foreground line-through tabular-nums">{plannedText}</span>
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
        className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors"
      >
        <Pencil className="h-3 w-3" />
        {actualG != null ? 'Edit actual' : 'Log actual'}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
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
        className="w-14 h-7 rounded-lg border bg-background text-center tabular-nums text-xs"
      />
      <span className="text-muted-foreground text-xs">{plannedUnit}</span>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="h-7 px-2.5 rounded-full bg-emerald-500 text-white text-[11px] font-medium disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
      </button>
      {actualG != null && (
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          aria-label="Reset to planned"
          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
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
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        selected
          ? 'bg-foreground text-background border-foreground shadow-sm'
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
