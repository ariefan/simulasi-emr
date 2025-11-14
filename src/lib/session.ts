import type { User } from '@/lib/auth';

const SESSION_KEY = 'emr_user_session';

export function saveSession(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

export function getSession(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
