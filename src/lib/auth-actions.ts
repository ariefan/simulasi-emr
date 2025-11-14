import { createServerFn } from '@tanstack/react-start';
import { verifyCredentials } from '@/lib/auth';

export const loginAction = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const { username, password } = data as { username: string; password: string };

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const user = await verifyCredentials(username, password);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    return user;
  }
);
