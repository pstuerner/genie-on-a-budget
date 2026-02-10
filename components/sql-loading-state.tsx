"use client";

import { useEffect, useState } from "react";
import { Database, Loader2 } from "lucide-react";

interface SqlLoadingStateProps {
  query: string;
}

export function SqlLoadingState({ query }: SqlLoadingStateProps) {
  const [showWarehouseMessage, setShowWarehouseMessage] = useState(false);

  useEffect(() => {
    // Show warehouse starting message after 5 seconds
    const timer = setTimeout(() => {
      setShowWarehouseMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-3 p-4">
      {/* Query being executed */}
      <div>
        <h4 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Executing Query
        </h4>
        <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
          {query}
        </pre>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        <span>Running query...</span>
      </div>

      {/* Warehouse starting message (appears after 5 seconds) */}
      {showWarehouseMessage && (
        <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex items-start gap-2">
            <Database className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 text-sm dark:text-blue-100">
                Starting serverless warehouse
              </p>
              <p className="mt-1 text-blue-700 text-xs dark:text-blue-300">
                The Databricks serverless SQL warehouse is starting up. This may take a bit longer for the first query after inactivity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
