import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import postgres from "postgres";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional().default(100),
});

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);

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

    // Security: Only allow queries on Product and Review tables
    const allowedTables = ['"product"', '"review"', 'product', 'review'];
    const queryLower = query.toLowerCase();
    
    // Check for forbidden tables (basic check - prevent accessing User, Chat, Message, etc.)
    const forbiddenPatterns = [
      '"user"', '"chat"', '"message"', '"vote"', '"document"', '"suggestion"', '"stream"',
      'user ', 'chat ', 'message ', 'vote ', 'document ', 'suggestion ', 'stream ',
      ' user', ' chat', ' message', ' vote', ' document', ' suggestion', ' stream',
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (queryLower.includes(pattern)) {
        return Response.json(
          {
            error:
              "Access denied. Only queries on Product and Review tables are allowed.",
          },
          { status: 403 }
        );
      }
    }

    // Apply limit
    const effectiveLimit = Math.min(limit, 1000);
    let finalQuery = query.trim();

    // Add LIMIT if not already present
    if (!finalQuery.toLowerCase().includes("limit")) {
      finalQuery += ` LIMIT ${effectiveLimit}`;
    }

    // Execute the query
    const result = await client.unsafe(finalQuery);

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
