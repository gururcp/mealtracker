'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Scale, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeightReading } from '@/lib/weight';
import { saveWeightReading, type SaveWeightState } from './actions';

type Props = {
  todayISO: string;
  initialDate: string;
  existing: WeightReading | null;
};

const INITIAL_STATE: SaveWeightState = {};

// Small helpers so we can format numbers as fixed strings without ".00" clutter.
function displayNum(v: number | null): string {
  if (v == null) return '';
  return String(v).replace(/\.0+$/, '');
}

export function WeightForm({ todayISO, initialDate, existing }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveWeightReading, INITIAL_STATE);

  // On success, briefly show the "Saved" state; then reset by re-navigating so
  // the form loads the latest saved values.
  useEffect(() => {
    if (state.savedFor) {
      const t = setTimeout(() => {
        router.replace(`/weight?date=${state.savedFor}`);
        router.refresh();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [state.savedFor, router]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Date */}
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          Date
        </span>
        <input
          type="date"
          name="reading_date"
          defaultValue={initialDate}
          max={todayISO}
          required
          className="w-full h-12 px-4 rounded-2xl border bg-card text-base font-medium tabular-nums"
        />
      </label>

      {/* Weight — hero input */}
      <label className="block rounded-3xl border-2 border-emerald-200 bg-emerald-50/40 p-4">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-800 mb-2">
          <Scale className="h-3.5 w-3.5" />
          Weight (kg)
        </span>
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            name="weight_kg"
            defaultValue={displayNum(existing?.weightKg ?? null)}
            step="0.1"
            min="1"
            max="500"
            required
            inputMode="decimal"
            placeholder="0.0"
            className="w-full font-display text-5xl leading-none tabular-nums bg-transparent focus:outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-base text-muted-foreground">kg</span>
        </div>
      </label>

      {/* Body composition */}
      <FieldGroup title="Body composition · from smart scale">
        <NumField label="Body Fat" name="body_fat_pct" unit="%" step="0.1" value={existing?.bodyFatPct} />
        <NumField label="Subcut. Fat" name="subcutaneous_fat_pct" unit="%" step="0.1" value={existing?.subcutaneousFatPct} />
        <NumField label="Fat Mass" name="fat_mass_kg" unit="kg" step="0.1" value={existing?.fatMassKg} />
        <NumField label="Lean Mass" name="lean_mass_kg" unit="kg" step="0.1" value={existing?.leanMassKg} />
        <NumField label="Muscle Mass" name="muscle_mass_kg" unit="kg" step="0.1" value={existing?.muscleMassKg} />
        <NumField label="Bone Mass" name="bone_mass_kg" unit="kg" step="0.01" value={existing?.boneMassKg} />
      </FieldGroup>

      {/* Metabolic */}
      <FieldGroup title="Metabolic">
        <NumField label="Visceral Fat" name="visceral_fat" unit="" step="1" value={existing?.visceralFat} />
        <NumField label="BMR" name="bmr_kcal" unit="kcal" step="1" value={existing?.bmrKcal} />
        <NumField label="Metabolic Age" name="metabolic_age" unit="yrs" step="1" value={existing?.metabolicAge} />
        <NumField label="BMI" name="bmi" unit="" step="0.1" value={existing?.bmi} />
        <NumField label="Protein" name="protein_pct" unit="%" step="0.1" value={existing?.proteinPct} />
      </FieldGroup>

      {/* Note */}
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
          Note (optional)
        </span>
        <textarea
          name="note"
          defaultValue={existing?.note ?? ''}
          rows={2}
          placeholder="e.g. morning, empty stomach"
          className="w-full px-4 py-3 rounded-2xl border bg-card text-base"
        />
      </label>

      {/* Error / success feedback */}
      {state.error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5">
          {state.error}
        </div>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={pending}
        style={{ touchAction: 'manipulation' }}
        className={cn(
          'w-full h-14 rounded-2xl font-semibold text-base transition-all shadow-sm',
          state.savedFor
            ? 'bg-emerald-500 text-white'
            : 'bg-foreground text-background hover:opacity-90',
          pending && 'opacity-70'
        )}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </span>
        ) : state.savedFor ? (
          <span className="inline-flex items-center gap-2">
            <Check className="h-5 w-5" strokeWidth={3} /> Saved
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Save className="h-4 w-4" />
            {existing ? 'Update reading' : 'Save reading'}
          </span>
        )}
      </button>
    </form>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-3xl border bg-card p-4">
      <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        {title}
      </legend>
      <div className="grid grid-cols-2 gap-3 mt-2">{children}</div>
    </fieldset>
  );
}

function NumField({
  label,
  name,
  unit,
  step,
  value,
}: {
  label: string;
  name: string;
  unit: string;
  step: string;
  value: number | null | undefined;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-muted-foreground mb-1">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <input
          type="number"
          name={name}
          step={step}
          defaultValue={displayNum(value ?? null)}
          inputMode="decimal"
          placeholder="—"
          className="w-full h-11 px-3 rounded-xl border bg-background text-lg font-medium tabular-nums placeholder:text-muted-foreground/30"
        />
        {unit && <span className="text-xs text-muted-foreground shrink-0">{unit}</span>}
      </div>
    </label>
  );
}
