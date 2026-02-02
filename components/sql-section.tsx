"use client";

import type { UIMessage } from "ai";
import {
  ChevronDown,
  ChevronUp,
  Database,
  Loader2,
  Play,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSqlStore } from "@/lib/stores/sql-store";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SqlSectionProps {
  messages: UIMessage[];
  chatId: string;
}

export function SqlSection({ messages, chatId }: SqlSectionProps) {
  const {
    activeQuery,
    isExpanded,
    toggleExpanded,
    setIsExpanded,
    manualQuery,
    setManualQuery,
    isLoading,
    setIsLoading,
    setActiveQuery,
    addQueryResult,
  } = useSqlStore();
  const [copied, setCopied] = useState(false);
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);
  const previousChatIdRef = useRef(chatId);
  const previousActiveQueryIdRef = useRef(activeQuery?.id);

  // Auto-select the most recent SQL tool result when messages or chatId changes
  useEffect(() => {
    const chatIdChanged = previousChatIdRef.current !== chatId;
    
    // Update the ref for next render
    if (chatIdChanged) {
      previousChatIdRef.current = chatId;
      setHasManuallyEdited(false); // Reset manual edit flag when chat changes
    }

    let mostRecentSqlResult: {
      toolCallId: string;
      result: any;
      timestamp: number;
    } | null = null;

    // Iterate through messages to find the most recent SQL tool result
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "assistant" && message.parts) {
        for (const part of message.parts) {
          if (
            "type" in part &&
            part.type === "tool-executeSqlQuery" &&
            "state" in part &&
            part.state === "output-available" &&
            "output" in part
          ) {
            const toolCallId = ("toolCallId" in part ? part.toolCallId : "") as string;
            mostRecentSqlResult = {
              toolCallId,
              result: part.output,
              timestamp: Date.now(),
            };
            break;
          }
        }
        if (mostRecentSqlResult) break;
      }
    }

    // If we found a SQL result, auto-select it
    if (mostRecentSqlResult) {
      const { toolCallId, result } = mostRecentSqlResult;
      if (result && !result.error && result.success) {
        const queryResultId = `${chatId}-${toolCallId}`; // Include chatId to make it unique per chat
        
        // Only update if it's different from the current active query
        if (previousActiveQueryIdRef.current !== queryResultId) {
          const queryResult = {
            id: queryResultId,
            query: result.query || "",
            // Use fullData if available (full results for UI), otherwise fall back to data
            data: result.fullData || result.data || [],
            rowCount: result.rowCount || 0,
            timestamp: new Date(),
          };
          
          previousActiveQueryIdRef.current = queryResultId;
          setActiveQuery(queryResult);
          
          // Auto-populate the query if user hasn't manually edited it
          if (!hasManuallyEdited || chatIdChanged) {
            setManualQuery(queryResult.query);
          }
        }
      }
    } else {
      // No SQL results in this chat, clear the selection
      if (previousActiveQueryIdRef.current !== undefined) {
        previousActiveQueryIdRef.current = undefined;
        setActiveQuery(null);
        if (!hasManuallyEdited || chatIdChanged) {
          setManualQuery("");
        }
      }
    }
  }, [messages, chatId, setActiveQuery, setManualQuery, hasManuallyEdited]);

  // Sync the manual query with the active query when it changes (unless manually edited)
  useEffect(() => {
    if (activeQuery && !hasManuallyEdited) {
      setManualQuery(activeQuery.query);
    }
  }, [activeQuery, hasManuallyEdited, setManualQuery]);

  const executeQuery = useCallback(async () => {
    if (!manualQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Request up to 1000 rows for manual queries (user-initiated)
        body: JSON.stringify({ query: manualQuery, limit: 1000 }),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const queryResult = {
        id: `manual-${Date.now()}`,
        query: result.query,
        data: result.data,
        rowCount: result.rowCount,
        timestamp: new Date(),
      };
      
      addQueryResult(queryResult);
      // Mark as not manually edited so auto-selection can work
      setHasManuallyEdited(false);
    } catch (error) {
      toast.error("Failed to execute query");
      console.error("SQL query error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [manualQuery, setIsLoading, addQueryResult]);

  const handleCopyQuery = async () => {
    if (activeQuery?.query) {
      await navigator.clipboard.writeText(activeQuery.query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCsv = () => {
    if (!activeQuery?.data || activeQuery.data.length === 0) return;

    const columns = Object.keys(activeQuery.data[0]);
    const csvRows = [
      columns.join(","),
      ...activeQuery.data.map((row) =>
        columns
          .map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return "";
            if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return String(val);
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-result-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = activeQuery?.data && activeQuery.data.length > 0 
    ? Object.keys(activeQuery.data[0]) 
    : [];

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border bg-background shadow-lg transition-all duration-300",
        isExpanded ? "max-h-[400px]" : "max-h-10"
      )}
    >
      {/* Header */}
      <div
        className="flex h-10 cursor-pointer items-center justify-between border-b bg-muted/50 px-3"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <Database className="size-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-sm leading-none">SQL Query Results</span>
          {activeQuery && (
            <span className="flex items-center rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 text-xs leading-none dark:bg-emerald-900/50 dark:text-emerald-300">
              {activeQuery.rowCount} rows
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded && activeQuery && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyQuery();
                      }}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy query</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCsv();
                      }}
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export CSV</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          <Button variant="ghost" size="icon" className="size-7">
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col">
          {/* Query Input */}
          <div className="flex gap-2 border-b bg-muted/30 p-2">
            <textarea
              className="min-h-[60px] flex-1 resize-none rounded-md border bg-background p-2 font-mono text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter SQL query... (Only SELECT on Product and Review tables)"
              value={manualQuery}
              onChange={(e) => {
                setManualQuery(e.target.value);
                setHasManuallyEdited(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  executeQuery();
                }
              }}
            />
            <Button
              size="sm"
              className="h-auto bg-emerald-600 hover:bg-emerald-700"
              onClick={executeQuery}
              disabled={isLoading || !manualQuery.trim()}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>
          </div>

          {/* Results Table */}
          {activeQuery && activeQuery.data.length > 0 ? (
            <ScrollArea className="h-[250px] w-full">
              <div className="min-w-full">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="whitespace-nowrap border-b px-3 py-2 text-left font-medium"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeQuery.data.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-muted/50 transition-colors hover:bg-muted/30"
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="max-w-[200px] truncate whitespace-nowrap px-3 py-2"
                            title={formatCellValue(row[col])}
                          >
                            {formatCellValue(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : activeQuery ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No results found
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <Database className="size-8 opacity-50" />
              <p className="text-sm">No query results yet</p>
              <p className="text-xs">Enter a query above or click on a SQL result in the chat</p>
            </div>
          )}

          {/* Footer with row count and timestamp */}
          {activeQuery && (
            <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1.5">
              <span className="text-muted-foreground text-xs">
                {activeQuery.rowCount} rows • {new Date(activeQuery.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    const str = JSON.stringify(value);
    return str.length > 100 ? str.slice(0, 97) + "..." : str;
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(2);
  }
  const str = String(value);
  return str.length > 100 ? str.slice(0, 97) + "..." : str;
}
