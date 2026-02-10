import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { databricksQuery } from "@/lib/db/databricks";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional().default(100),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const json = await request.json();
    const { query, limit } = requestSchema.parse(json);

    // Security: Only allow SELECT queries
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith("select")) {
      return Response.json(
        {
          error:
            "Only SELECT queries are allowed for security reasons. No INSERT, UPDATE, DELETE, or other modification queries.",
        },
        { status: 400 }
      );
    }

    // Apply limit
    const effectiveLimit = Math.min(limit, 1000);
    let finalQuery = query.trim();

    // Add LIMIT if not already present
    if (!finalQuery.toLowerCase().includes("limit")) {
      finalQuery += ` LIMIT ${effectiveLimit}`;
    }

    // Execute the query against Databricks
    const result = await databricksQuery(finalQuery);

    return Response.json({
      success: true,
      rowCount: result.length,
      data: result,
      query: finalQuery,
    });
  } catch (error) {
    console.error("SQL execution error:", error);
    return Response.json(
      {
        error: `SQL execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
