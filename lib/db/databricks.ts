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

/**
 * Execute a SQL statement against Databricks and return the result rows.
 */
export async function databricksQuery(
  statement: string
): Promise<Record<string, unknown>[]> {
  const session = await getSession();
  const operation = await session.executeStatement(statement, {
    runAsync: true,
  });
  const result = await operation.fetchAll();
  await operation.close();

  // The SDK returns an array of row objects – cast for convenience
  return result as Record<string, unknown>[];
}
