'use client';

import { useActionState, useEffect, useState, startTransition } from 'react';
import { Delete, Loader2 } from 'lucide-react';
import { loginWithPin, type LoginState } from './actions';
import { cn } from '@/lib/utils';

const INITIAL_STATE: LoginState = {};
const PIN_LEN = 4;

export function PinPad() {
  const [pin, setPin] = useState('');
  const [state, formAction, pending] = useActionState(loginWithPin, INITIAL_STATE);

  // Auto-submit as soon as the PIN is complete. Wrapped in startTransition so
  // useActionState's `pending` flag flips correctly for the spinner.
  useEffect(() => {
    if (pin.length === PIN_LEN && !pending) {
      const fd = new FormData();
      fd.set('pin', pin);
      startTransition(() => formAction(fd));
    }
  }, [pin, pending, formAction]);

  // Clear the PIN after a wrong attempt so the user can retap.
  useEffect(() => {
    if (state.error) setPin('');
  }, [state]);

  const tap = (d: string) => {
    if (pending) return;
    setPin((p) => (p.length >= PIN_LEN ? p : p + d));
  };
  const back = () => {
    if (pending) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Dots — swap to spinner while verifying */}
      <div className="flex items-center justify-center h-6" aria-live="polite">
        {pending ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex gap-3">
            {Array.from({ length: PIN_LEN }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-colors',
                  i < pin.length
                    ? 'bg-foreground border-foreground'
                    : 'border-muted-foreground/40'
                )}
              />
            ))}
          </div>
        )}
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
        <KeypadButton
          onClick={back}
          disabled={pending || pin.length === 0}
          aria-label="Delete last digit"
        >
          <Delete className="h-5 w-5" strokeWidth={1.75} />
        </KeypadButton>
      </div>
    </div>
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
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
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
