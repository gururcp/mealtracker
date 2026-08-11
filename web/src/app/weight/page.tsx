import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  getRecentWeightReadings,
  getWeightReadingByDate,
} from '@/lib/weight';
import { WeightForm } from './weight-form';
import { HistoryList } from './history-list';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Weight · वज़न',
};

function todayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default async function WeightPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const supabase = getServerSupabase();
  const { data: member } = await supabase
    .from('members')
    .select('id, name, timezone')
    .eq('id', session.memberId)
    .single();
  if (!member) redirect('/login');

  const params = await searchParams;
  const todayISO = todayInTimezone(member.timezone);

  // Resolve target date (default: today). Clamp future dates to today.
  let targetDate = todayISO;
  if (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) && params.date <= todayISO) {
    targetDate = params.date;
  }

  const [existing, recent] = await Promise.all([
    getWeightReadingByDate(member.id, targetDate),
    getRecentWeightReadings(member.id, 30),
  ]);

  return (
    <main className="min-h-dvh bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/today"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Today
          </Link>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Weight</p>
            <p className="text-base font-semibold tracking-tight">वज़न</p>
          </div>
          <div className="w-16" aria-hidden />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        <section>
          <h2 className="text-sm font-semibold tracking-tight mb-3 px-1">
            {existing ? 'Update reading' : 'Log new reading'}
          </h2>
          <WeightForm
            todayISO={todayISO}
            initialDate={targetDate}
            existing={existing}
          />
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold tracking-tight mb-3 px-1">
              Recent readings
            </h2>
            <HistoryList
              readings={recent}
              currentEditingDate={existing ? targetDate : undefined}
              timezone={member.timezone}
            />
          </section>
        )}
      </div>
    </main>
  );
}
