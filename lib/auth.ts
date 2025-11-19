import { cookies } from 'next/headers';
import { getUser } from './storage';

export interface Session {
  username: string;
  isAdmin: boolean;
}

const SESSION_COOKIE = 'session';

export async function createSession(username: string, isAdmin: boolean): Promise<void> {
  const session: Session = { username, isAdmin };
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return null;
    }

    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();

  if (!session.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return session;
}

export async function validateCredentials(username: string, password: string): Promise<Session | null> {
  const user = await getUser(username);

  if (!user || user.password !== password) {
    return null;
  }

  return {
    username: user.username,
    isAdmin: user.isAdmin,
  };
}
