import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env",
});

export const runMigrations = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL not defined");
  }

  console.log("🔍 Connecting to database:", process.env.POSTGRES_URL.replace(/:[^:@]+@/, ':****@'));
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("🔍 Running migrations from: ./lib/db/migrations");
  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  await connection.end();
  console.log(`🔍 Migrations took ${end - start}ms`);
  
  return end - start;
};
