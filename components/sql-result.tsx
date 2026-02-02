"use client";

import cx from "classnames";
import { Database, Table2, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useSqlStore, type SqlQueryResult } from "@/lib/stores/sql-store";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SqlToolResultProps {
  result: {
    success?: boolean;
    rowCount?: number;
    data?: Record<string, unknown>[];
    query?: string;
    error?: string;
  };
  toolCallId: string;
  chatId: string;
  isClickable?: boolean;
}

export function SqlToolResult({
  result,
  toolCallId,
  chatId,
  isClickable = true,
}: SqlToolResultProps) {
  const { setActiveQuery, activeQuery } = useSqlStore();
  const [copied, setCopied] = useState(false);

  const queryId = `${chatId}-${toolCallId}`;
  const isActive = activeQuery?.id === queryId;
  const hasError = result.error || !result.success;

  const handleClick = () => {
    if (!isClickable || hasError) return;

    const queryResult: SqlQueryResult = {
      id: queryId,
      query: result.query || "",
      data: result.data || [],
      rowCount: result.rowCount || 0,
      timestamp: new Date(),
    };
    setActiveQuery(queryResult);
  };

  const handleCopyQuery = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (result.query) {
      await navigator.clipboard.writeText(result.query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (hasError) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <Database className="size-4" />
          <span className="font-medium text-sm">SQL Query Failed</span>
        </div>
        <p className="mt-2 text-red-600 text-sm dark:text-red-400">
          {result.error || "Unknown error occurred"}
        </p>
        {result.query && (
          <pre className="mt-3 overflow-x-auto rounded-md bg-red-100 p-2 font-mono text-red-800 text-xs dark:bg-red-900/50 dark:text-red-200">
            {result.query}
          </pre>
        )}
      </div>
    );
  }

  const columns = result.data && result.data.length > 0 ? Object.keys(result.data[0]) : [];
  const previewRows = result.data?.slice(0, 3) || [];

  return (
    <div
      className={cn(
        "w-full cursor-pointer overflow-hidden rounded-xl border transition-all duration-200",
        "bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30",
        isActive
          ? "border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400"
          : "border-emerald-200 hover:border-emerald-300 dark:border-emerald-800 dark:hover:border-emerald-700",
        !isClickable && "cursor-default"
      )}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-emerald-200/50 border-b bg-emerald-100/50 p-3 dark:border-emerald-800/50 dark:bg-emerald-900/30">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Database className="size-4" />
          </div>
          <div>
            <div className="font-medium text-emerald-900 text-sm dark:text-emerald-100">
              SQL Query Result
            </div>
            <div className="text-emerald-600 text-xs dark:text-emerald-400">
              {result.rowCount} row{result.rowCount !== 1 ? "s" : ""} • {columns.length} column{columns.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-emerald-600 hover:bg-emerald-200/50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-800/50"
                  onClick={handleCopyQuery}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy query</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isClickable && (
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              isActive 
                ? "bg-emerald-500 text-white" 
                : "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300"
            )}>
              {isActive ? "Active" : "Click to view"}
              <ArrowRight className="size-3" />
            </div>
          )}
        </div>
      </div>

      {/* Query Preview */}
      <div className="border-emerald-200/50 border-b bg-emerald-50/50 px-3 py-2 dark:border-emerald-800/50 dark:bg-emerald-900/20">
        <pre className="overflow-x-auto font-mono text-emerald-800 text-xs dark:text-emerald-200 line-clamp-2">
          {result.query}
        </pre>
      </div>

      {/* Data Preview */}
      {previewRows.length > 0 && (
        <div className="p-3">
          <div className="overflow-hidden rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
            <table className="w-full text-xs">
              <thead className="bg-emerald-100/50 dark:bg-emerald-900/50">
                <tr>
                  {columns.slice(0, 4).map((col) => (
                    <th
                      key={col}
                      className="border-emerald-200/50 border-b px-2 py-1.5 text-left font-medium text-emerald-700 dark:border-emerald-800/50 dark:text-emerald-300"
                    >
                      {col}
                    </th>
                  ))}
                  {columns.length > 4 && (
                    <th className="border-emerald-200/50 border-b px-2 py-1.5 text-left text-emerald-500 dark:border-emerald-800/50">
                      +{columns.length - 4} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-emerald-200/30 border-b last:border-b-0 dark:border-emerald-800/30">
                    {columns.slice(0, 4).map((col) => (
                      <td
                        key={col}
                        className="px-2 py-1.5 text-emerald-800 dark:text-emerald-200 truncate max-w-[100px]"
                      >
                        {formatCellValue(row[col])}
                      </td>
                    ))}
                    {columns.length > 4 && <td className="px-2 py-1.5 text-emerald-400">...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {result.rowCount && result.rowCount > 3 && (
              <div className="bg-emerald-50/50 px-3 py-1.5 text-center text-emerald-500 text-xs dark:bg-emerald-900/30">
                +{result.rowCount - 3} more rows
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 50);
  if (typeof value === "number") {
    // Format numbers nicely
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(2);
  }
  const str = String(value);
  return str.length > 50 ? str.slice(0, 47) + "..." : str;
}
