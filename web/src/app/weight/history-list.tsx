'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeightReading } from '@/lib/weight';
import { deleteWeightReading } from './actions';

type Props = {
  readings: WeightReading[];
  currentEditingDate?: string;
  timezone: string;
};

export function HistoryList({ readings, currentEditingDate, timezone }: Props) {
  if (readings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No readings yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {readings.map((r, i) => (
        <ReadingRow
          key={r.id}
          reading={r}
          prev={readings[i + 1] ?? null}
          isEditing={r.readingDate === currentEditingDate}
          timezone={timezone}
        />
      ))}
    </ul>
  );
}

function ReadingRow({
  reading,
  prev,
  isEditing,
  timezone,
}: {
  reading: WeightReading;
  prev: WeightReading | null;
  isEditing: boolean;
  timezone: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const delta = prev ? reading.weightKg - prev.weightKg : null;

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (!confirm(`Delete the reading from ${formatDate(reading.readingDate, timezone)}?`)) return;
    startTransition(async () => {
      await deleteWeightReading(reading.id);
    });
  };

  return (
    <li
      className={cn(
        'rounded-2xl border bg-card p-3 flex items-center gap-3',
        isEditing && 'ring-2 ring-emerald-300 border-emerald-200'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-semibold tabular-nums">
            {reading.weightKg.toFixed(1)} kg
          </span>
          {delta != null && Math.abs(delta) >= 0.05 && (
            <span
              className={cn(
                'text-xs font-medium tabular-nums',
                delta < 0 ? 'text-emerald-700' : 'text-red-700'
              )}
            >
              {delta < 0 ? '−' : '+'}
              {Math.abs(delta).toFixed(1)} kg
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(reading.readingDate, timezone)}
          {reading.bodyFatPct != null && (
            <>
              <span className="mx-1.5">·</span>
              {reading.bodyFatPct.toFixed(1)}% fat
            </>
          )}
          {reading.bmrKcal != null && (
            <>
              <span className="mx-1.5">·</span>
              BMR {Math.round(reading.bmrKcal)}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/weight?date=${reading.readingDate}`}
          onClick={() => router.refresh()}
          aria-label="Edit reading"
          className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Delete reading"
          className="h-9 w-9 rounded-full hover:bg-red-50 flex items-center justify-center text-muted-foreground hover:text-red-600 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </li>
  );
}

function formatDate(iso: string, tz: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
