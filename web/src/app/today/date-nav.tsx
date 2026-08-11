'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  logDate: string;   // YYYY-MM-DD currently viewed
  today: string;     // YYYY-MM-DD "today" in member's timezone
  timezone: string;
};

// String-based date arithmetic to avoid DST/timezone bugs on YYYY-MM-DD strings.
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  // Anchor at UTC noon to skip midnight-DST edge cases.
  const t = Date.UTC(y, m - 1, d, 12, 0, 0) + days * 86400_000;
  const nd = new Date(t);
  const yy = nd.getUTCFullYear();
  const mm = String(nd.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nd.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatFriendly(iso: string, timezone: string, today: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  if (iso === today) return 'Today · आज';
  if (iso === yesterday) return 'Yesterday';
  if (iso === tomorrow) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: iso.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric',
  }).format(date);
}

export function DateNav({ logDate, today, timezone }: Props) {
  const router = useRouter();
  const prev = addDays(logDate, -1);
  const next = addDays(logDate, 1);
  const isToday = logDate === today;
  const canGoForward = logDate < today; // no future dates

  return (
    <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
      <NavButton
        aria-label="Previous day"
        href={hrefFor(prev)}
        onClickPrefetch={() => router.prefetch(hrefFor(prev))}
      >
        <ChevronLeft className="h-4 w-4" />
      </NavButton>

      <div className="flex-1 text-center">
        <p className="text-[15px] font-semibold tracking-tight tabular-nums leading-tight">
          {formatFriendly(logDate, timezone, today)}
        </p>
        {!isToday && (
          <Link
            href="/today"
            className="text-xs text-emerald-700 font-medium hover:underline"
          >
            Jump to today
          </Link>
        )}
      </div>

      <NavButton
        aria-label="Next day"
        href={canGoForward ? hrefFor(next) : undefined}
        disabled={!canGoForward}
      >
        <ChevronRight className="h-4 w-4" />
      </NavButton>
    </div>
  );
}

function hrefFor(iso: string): string {
  // If the target is "today", let the server resolve — cleaner URL for the
  // home-screen shortcut. Otherwise use ?d=.
  return `/today?d=${iso}`;
}

function NavButton({
  href,
  disabled,
  onClickPrefetch,
  children,
  ...rest
}: {
  href?: string;
  disabled?: boolean;
  onClickPrefetch?: () => void;
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  const className = cn(
    'h-10 w-10 rounded-full border flex items-center justify-center transition-colors shrink-0',
    disabled
      ? 'bg-muted/50 border-transparent text-muted-foreground/40 pointer-events-none'
      : 'bg-card border-border text-foreground/70 hover:bg-muted active:scale-95'
  );

  if (disabled || !href) {
    return (
      <span aria-disabled className={className} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      onMouseEnter={onClickPrefetch}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
