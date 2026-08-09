import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PinPad } from './pin-pad';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/today');

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            नमस्ते
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your PIN to log in
            <br />
            <span className="text-xs">अपना PIN डालें</span>
          </p>
        </header>

        <PinPad />
      </div>
    </main>
  );
}
