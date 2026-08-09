'use client';

import { useActionState, useState } from 'react';
import { Delete, Loader2 } from 'lucide-react';
import { loginWithPin, type LoginState } from './actions';
import { cn } from '@/lib/utils';

const INITIAL_STATE: LoginState = {};
const MAX_LEN = 6;

export function PinPad() {
  const [pin, setPin] = useState('');
  const [state, formAction, pending] = useActionState(loginWithPin, INITIAL_STATE);

  const tap = (d: string) => {
    if (pending) return;
    setPin((p) => (p.length >= MAX_LEN ? p : p + d));
  };
  const back = () => {
    if (pending) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <form
      action={(fd) => {
        fd.set('pin', pin);
        formAction(fd);
      }}
      className="flex flex-col items-center gap-8 w-full"
    >
      {/* Dots */}
      <div className="flex gap-3" aria-live="polite">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-4 w-4 rounded-full border-2 transition-colors',
              i < pin.length ? 'bg-foreground border-foreground' : 'border-muted-foreground/40'
            )}
          />
        ))}
      </div>

      {/* Error slot (fixed height so layout doesn't jump) */}
      <p
        className={cn(
          'text-sm h-5 transition-colors',
          state.error ? 'text-red-600' : 'text-transparent'
        )}
      >
        {state.error ?? 'placeholder'}
      </p>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <KeypadButton key={d} onClick={() => tap(String(d))} disabled={pending}>
            {d}
          </KeypadButton>
        ))}
        <div />
        <KeypadButton onClick={() => tap('0')} disabled={pending}>
          0
        </KeypadButton>
        <KeypadButton onClick={back} disabled={pending || pin.length === 0} aria-label="Delete last digit">
          <Delete className="h-5 w-5" strokeWidth={1.75} />
        </KeypadButton>
      </div>

      {/* Submit — invisible until 4+ digits, submits on tap */}
      <button
        type="submit"
        disabled={pending || pin.length < 4}
        className={cn(
          'w-full max-w-xs h-12 rounded-full text-base font-medium transition-all',
          'bg-foreground text-background',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          'active:scale-[0.98]'
        )}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </span>
        ) : (
          <>Log in · लॉगिन</>
        )}
      </button>
    </form>
  );
}

function KeypadButton({
  children,
  onClick,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-16 rounded-2xl text-2xl font-medium',
        'bg-muted/60 hover:bg-muted transition-colors',
        'active:scale-95 active:bg-muted',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'flex items-center justify-center select-none'
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
