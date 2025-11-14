import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

config();

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema: { users } });

async function seed() {
  try {
    console.log('Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
