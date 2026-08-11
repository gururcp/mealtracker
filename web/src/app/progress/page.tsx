import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flame, Scale } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getProgress, summariseDays, type DaySummary } from '@/lib/progress';
import { BarChart, type BarPoint } from './bar-chart';
import { LineChart } from './line-chart';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Progress · प्रगति',
};

const DEFAULT_DAYS = 7;

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const range = params.days === '30' ? 30 : DEFAULT_DAYS;
  const data = await getProgress(session.memberId, range);

  const kcalPoints = toKcalBars(data.days, data.member.timezone);
  const deficitPoints = toDeficitBars(data.days, data.member.timezone);
  const itemsPoints = toItemsBars(data.days, data.member.timezone);

  const weekAvgs = summariseDays(data.days);

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
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Progress
            </p>
            <p className="text-base font-semibold tracking-tight">प्रगति</p>
          </div>
          <RangeToggle current={range} />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Weekly summary strip */}
        <section className="rounded-3xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              Last {range} days
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {weekAvgs.daysWithData} of {range} logged · avg {Math.round(weekAvgs.avgKcalEaten)}/{Math.round(weekAvgs.avgKcalPlanned)} kcal
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <SummaryTile
              label="Avg deficit"
              value={weekAvgs.avgDeficit > 0 ? `−${Math.round(weekAvgs.avgDeficit)}` : `+${Math.round(-weekAvgs.avgDeficit)}`}
              unit="kcal/day"
              tone={weekAvgs.avgDeficit > 0 ? 'positive' : 'negative'}
            />
            <SummaryTile
              label="Weight change"
              value={formatWeightDelta(weekAvgs.weightDeltaKg)}
              unit=""
              tone={
                weekAvgs.weightDeltaKg == null
                  ? 'neutral'
                  : weekAvgs.weightDeltaKg <= 0
                  ? 'positive'
                  : 'negative'
              }
            />
            <SummaryTile
              label="Adherence"
              value={`${Math.round(weekAvgs.avgAdherencePct)}%`}
              unit={weekAvgs.avgAdherencePct >= 80 ? 'excellent' : weekAvgs.avgAdherencePct >= 60 ? 'good' : 'building'}
              tone={weekAvgs.avgAdherencePct >= 60 ? 'positive' : 'neutral'}
            />
          </div>
        </section>

        {/* Kcal chart */}
        <ChartCard
          title="Kcal eaten"
          subtitle={`vs planned (dashed) · avg ${Math.round(weekAvgs.avgKcalEaten)} of ${Math.round(weekAvgs.avgKcalPlanned)}`}
        >
          <BarChart
            points={kcalPoints}
            emphasisIndex={kcalPoints.length - 1}
            colorClass="text-emerald-500"
          />
        </ChartCard>

        {/* Deficit chart */}
        <ChartCard
          title="Net kcal deficit"
          subtitle={`burnt − eaten · positive is weight-loss direction`}
        >
          <BarChart
            points={deficitPoints}
            emphasisIndex={deficitPoints.length - 1}
            colorClass="text-emerald-600"
          />
        </ChartCard>

        {/* Adherence chart */}
        <ChartCard
          title="Items logged"
          subtitle="% of the day's plan ticked"
        >
          <BarChart
            points={itemsPoints}
            emphasisIndex={itemsPoints.length - 1}
            colorClass="text-emerald-400"
            maxOverride={100}
            showTargetLine={false}
            formatValue={(v) => `${Math.round(v)}%`}
          />
        </ChartCard>

        {/* Weight chart */}
        <ChartCard title="Weight" subtitle="last 90 days">
          <LineChart
            points={data.weightSeries.map((r) => ({ date: r.date, value: r.weightKg }))}
            formatY={(v) => `${v.toFixed(1)} kg`}
          />
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            {data.weightSeries.length < 2 && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground max-w-[16rem]">
                <Flame className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" />
                <span>Log Fitelo readings regularly and the line will build itself.</span>
              </p>
            )}
            <Link
              href="/weight"
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              <Scale className="h-3.5 w-3.5" />
              Log new reading
            </Link>
          </div>
        </ChartCard>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWeightDelta(kg: number | null): string {
  if (kg == null) return '—';
  if (Math.abs(kg) < 0.05) return '±0.0 kg';
  return `${kg > 0 ? '+' : '−'}${Math.abs(kg).toFixed(1)} kg`;
}

function weekdayLabel(iso: string, tz: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-IN', { timeZone: tz, weekday: 'narrow' }).format(date);
}

function toKcalBars(days: DaySummary[], tz: string): BarPoint[] {
  return days.map((d) => ({
    label: weekdayLabel(d.date, tz),
    value: d.kcalEaten,
    target: d.kcalPlanned,
    hint: d.itemsDone > 0 ? `${d.kcalEaten}` : 'no data',
  }));
}

function toDeficitBars(days: DaySummary[], tz: string): BarPoint[] {
  return days.map((d) => ({
    label: weekdayLabel(d.date, tz),
    value: Math.max(0, d.netDeficit), // only show deficit height
    hint: d.itemsDone > 0 ? `${Math.round(d.netDeficit)}` : 'no data',
  }));
}

function toItemsBars(days: DaySummary[], tz: string): BarPoint[] {
  return days.map((d) => {
    const pct = d.itemsTotal > 0 ? (d.itemsDone / d.itemsTotal) * 100 : 0;
    return {
      label: weekdayLabel(d.date, tz),
      value: pct,
      hint: d.itemsTotal > 0 ? `${d.itemsDone}/${d.itemsTotal}` : '—',
    };
  });
}

// ---------------------------------------------------------------------------
// Small presentation components
// ---------------------------------------------------------------------------

function SummaryTile({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone: 'positive' | 'negative' | 'neutral';
}) {
  const toneCls =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'negative'
      ? 'text-red-700'
      : 'text-foreground';
  return (
    <div className="rounded-2xl bg-muted/30 p-2.5">
      <p className={`text-lg font-display leading-tight tabular-nums ${toneCls}`}>{value}</p>
      {unit && <p className="text-[11px] text-muted-foreground leading-tight">{unit}</p>}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-card p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function RangeToggle({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 bg-muted/60 rounded-full p-0.5 text-xs font-medium">
      <Link
        href="/progress"
        className={`px-2.5 py-1 rounded-full ${current === 7 ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
      >
        7d
      </Link>
      <Link
        href="/progress?days=30"
        className={`px-2.5 py-1 rounded-full ${current === 30 ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
      >
        30d
      </Link>
    </div>
  );
}
