import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Session cookie: base64(memberId).base64(hmac(memberId))
// This is a minimal signed cookie. It proves "the server issued this member_id",
// not "this browser owns the account" — sufficient for MVP with a single trusted
// device (Vijaya's phone). V0.2 replaces this with Supabase Auth tokens.

const COOKIE_NAME = 'mt_session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Buffer {
  const secret = process.env.SESSION_COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_COOKIE_SECRET must be set to a random string of at least 16 chars. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(secret, 'utf8');
}

function sign(memberId: string): string {
  return createHmac('sha256', getSecret()).update(memberId).digest('base64url');
}

function verify(memberId: string, sig: string): boolean {
  const expected = sign(memberId);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export type Session = { memberId: string };

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [memberIdB64, sig] = raw.split('.');
  if (!memberIdB64 || !sig) return null;

  let memberId: string;
  try {
    memberId = Buffer.from(memberIdB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  if (!verify(memberId, sig)) return null;
  return { memberId };
}

export async function setSession(memberId: string): Promise<void> {
  const value = `${Buffer.from(memberId, 'utf8').toString('base64url')}.${sign(memberId)}`;
  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error('Unauthorized');
  return s;
}
