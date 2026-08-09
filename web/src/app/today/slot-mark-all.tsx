'use client';

import { useState, useTransition } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markSlotEaten } from './actions';

export function SlotMarkAll({
  mealSlotId,
  allDone,
}: {
  mealSlotId: string;
  allDone: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  if (allDone) return null;

  const handleMarkAll = () => {
    setNotice(null);
    startTransition(async () => {
      const { skippedOpenVeg } = await markSlotEaten(mealSlotId);
      if (skippedOpenVeg > 0) {
        setNotice(`${skippedOpenVeg} veg item skipped — pick a vegetable first`);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleMarkAll}
        disabled={pending}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className={cn(
          'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full',
          'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100',
          pending && 'opacity-50'
        )}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <CheckCheck className="h-3 w-3" />
        )}
        Mark all done
      </button>
      {notice && <span className="text-[10px] text-muted-foreground">{notice}</span>}
    </div>
  );
}
