import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PinPad } from './pin-pad';

export const metadata = {
  title: 'Log in',
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/today');

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        <header className="text-center space-y-3">
          <div className="flex flex-col items-center gap-2">
            <BrandMark />
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Poshan · पोषण
            </p>
          </div>
          <h1 className="font-display text-4xl tracking-tight">नमस्ते</h1>
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

// Small emerald brand mark echoing the app icon.
function BrandMark() {
  return (
    <div
      className="h-12 w-12 rounded-2xl flex items-center justify-center"
      style={{
        background:
          'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
      }}
      aria-hidden
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.66c-.2 4.85-1.24 10.09-5.14 13.28C13.75 18.87 11 20 11 20z" />
        <path d="M2 21c0-3 2.7-5.7 5.7-5.7" />
      </svg>
    </div>
  );
}
