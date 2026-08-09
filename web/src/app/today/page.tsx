import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import { logoutAction } from './actions';

export default async function TodayPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const supabase = getServerSupabase();
  const { data: member } = await supabase
    .from('members')
    .select('name, household:households(name)')
    .eq('id', session.memberId)
    .single();

  return (
    <main className="min-h-dvh flex flex-col items-center px-6 py-10 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Namaste 🙏</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {member?.name?.split(' ')[0] ?? 'friend'}
            </h1>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Log out
            </button>
          </form>
        </header>

        <section className="rounded-2xl border p-6 space-y-2 bg-card">
          <p className="text-sm text-muted-foreground">
            Today&rsquo;s plan will appear here — meal slots, items, alternates, veg picker, habits.
          </p>
          <p className="text-xs text-muted-foreground/70">
            (Placeholder — Phase C will fill this in.)
          </p>
        </section>
      </div>
    </main>
  );
}
