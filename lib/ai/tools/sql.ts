import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { databricksQuery } from "@/lib/db/databricks";

// Re-export for backward compatibility
export type { SqlQuerySuggestion } from "./sql-suggestions-data";
export { sqlQuerySuggestions } from "./sql-suggestions-data";

export const executeSqlQuery = tool({
  description:
    "Execute a SQL query against the Databricks data warehouse. Use this to analyze products, reviews, and other data. Use backtick-quoted three-part table names like `main`.`default`.`products`. Do NOT use double quotes for identifiers. Results returned to you are limited to 100 rows for efficiency, but the user's UI will display all results.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The SQL query to execute. Must be a SELECT query only. If you don't specify a LIMIT, results will be limited to 100 rows in your context (but full results shown to user)."
      ),
    limit: z
      .number()
      .optional()
      .default(100)
      .describe("This parameter is deprecated and no longer used. The tool automatically limits results to 100 rows for LLM context while showing full results to users."),
  }),
  needsApproval: false,
  execute: async (input) => {
    try {
      // Security: Only allow SELECT queries
      const trimmedQuery = input.query.trim().toLowerCase();
      if (!trimmedQuery.startsWith("select")) {
        return {
          error:
            "Only SELECT queries are allowed for security reasons. No INSERT, UPDATE, DELETE, or other modification queries.",
        };
      }

      const originalQuery = input.query.trim();
      const hasExistingLimit = originalQuery.toLowerCase().includes("limit");
      
      // Execute full query against Databricks (respecting any existing LIMIT)
      const result = await databricksQuery(originalQuery);
      
      // Convert to plain array for consistent typing
      const fullResultArray = Array.from(result);
      
      // For LLM: limit to 100 rows if no explicit LIMIT in query
      const llmResultArray = !hasExistingLimit && fullResultArray.length > 100
        ? fullResultArray.slice(0, 100)
        : fullResultArray;

      return {
        success: true,
        rowCount: fullResultArray.length, // Total rows for UI display
        data: llmResultArray, // Limited data for LLM context
        fullData: fullResultArray, // Full data for UI display
        query: originalQuery,
        isLimited: !hasExistingLimit && fullResultArray.length > 100, // Flag to indicate LLM saw limited data
      };
    } catch (error) {
      return {
        error: `SQL execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
