import { createServerFn } from '@tanstack/react-start';
import { verifyCredentials } from '@/lib/auth';

export const loginAction = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data: { username: string; password: string } }) => {
  const { username, password } = data;

  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const user = await verifyCredentials(username, password);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  return user;
});
