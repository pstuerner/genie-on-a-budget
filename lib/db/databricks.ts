import "server-only";

import { DBSQLClient } from "@databricks/sql";
import type IDBSQLSession from "@databricks/sql/dist/contracts/IDBSQLSession";

/**
 * Databricks SQL connection helper.
 *
 * Environment variables required:
 *   DATABRICKS_SERVER_HOSTNAME – e.g. "dbc-xxxxxxxx-xxxx.cloud.databricks.com"
 *   DATABRICKS_HTTP_PATH       – e.g. "/sql/1.0/warehouses/xxxxxxxxxxxxxxxx"
 *   DATABRICKS_ACCESS_TOKEN    – personal access token
 */

// biome-ignore lint: Forbidden non-null assertion.
const host = process.env.DATABRICKS_SERVER_HOSTNAME!;
// biome-ignore lint: Forbidden non-null assertion.
const path = process.env.DATABRICKS_HTTP_PATH!;
// biome-ignore lint: Forbidden non-null assertion.
const token = process.env.DATABRICKS_ACCESS_TOKEN!;

let clientInstance: DBSQLClient | null = null;
let sessionInstance: IDBSQLSession | null = null;

/**
 * Returns a reusable Databricks SQL session.
 * The client and session are lazily created and cached for the
 * lifetime of the process (serverless functions will naturally
 * recycle them).
 */
async function getSession(): Promise<IDBSQLSession> {
  if (sessionInstance) {
    return sessionInstance;
  }

  if (!clientInstance) {
    clientInstance = new DBSQLClient();
    await clientInstance.connect({ host, path, token });
  }

  sessionInstance = await clientInstance.openSession();
  return sessionInstance;
}

async function resetConnection(): Promise<void> {
  try {
    await sessionInstance?.close();
  } catch {
    // ignore errors during cleanup
  }
  try {
    await clientInstance?.close();
  } catch {
    // ignore errors during cleanup
  }
  sessionInstance = null;
  clientInstance = null;
}

/**
 * Execute a SQL statement against Databricks and return the result rows.
 * If the cached session has gone stale (e.g. expired after idle timeout),
 * the connection is reset and the query is retried once with a fresh session.
 */
export async function databricksQuery(
  statement: string
): Promise<Record<string, unknown>[]> {
  async function run(): Promise<Record<string, unknown>[]> {
    const session = await getSession();
    const operation = await session.executeStatement(statement, {
      runAsync: true,
    });
    const result = await operation.fetchAll();
    await operation.close();
    return result as Record<string, unknown>[];
  }

  try {
    return await run();
  } catch (err) {
    // Stale sessions typically surface as 400 responses from the gateway.
    // Reset and retry once so callers get a transparent recovery.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("400") || message.includes("session")) {
      await resetConnection();
      return await run();
    }
    throw err;
  }
}
