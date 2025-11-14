import postgres from 'postgres';
import { config } from 'dotenv';

config();

const client = postgres(process.env.DATABASE_URL!);

async function resetDatabase() {
  try {
    console.log('Dropping all tables...');

    // Get all tables in the public schema
    const tables = await client`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `;

    // Drop each table
    for (const { tablename } of tables) {
      console.log(`Dropping table: ${tablename}`);
      await client`DROP TABLE IF EXISTS ${client(tablename)} CASCADE`;
    }

    console.log('Database reset completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
