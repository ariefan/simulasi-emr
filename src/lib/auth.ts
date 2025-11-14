import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}
