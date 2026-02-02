import { config } from "dotenv";
import { runMigrations } from "../lib/db/migrate";

config({
  path: ".env",
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("⏭️  POSTGRES_URL not defined, skipping migrations");
    process.exit(0);
  }

  console.log("⏳ Running migrations...");

  try {
    const duration = await runMigrations();
    console.log("✅ Migrations completed in", duration, "ms");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed");
    console.error(err);
    process.exit(1);
  }
};

runMigrate();
