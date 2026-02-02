"use client";

import { create } from "zustand";

export interface SqlQueryResult {
  id: string;
  query: string;
  data: Record<string, unknown>[];
  rowCount: number;
  error?: string;
  timestamp: Date;
}

interface SqlStore {
  // The currently active/selected SQL query result
  activeQuery: SqlQueryResult | null;
  
  // All SQL query results from the current chat session
  queryHistory: SqlQueryResult[];
  
  // Whether the SQL section is expanded
  isExpanded: boolean;
  
  // Manual query input
  manualQuery: string;
  
  // Loading state for manual queries
  isLoading: boolean;
  
  // Actions
  setActiveQuery: (query: SqlQueryResult | null) => void;
  addQueryResult: (result: SqlQueryResult) => void;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  setManualQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useSqlStore = create<SqlStore>((set) => ({
  activeQuery: null,
  queryHistory: [],
  isExpanded: false,
  manualQuery: "",
  isLoading: false,
  
  setActiveQuery: (query) => set({ activeQuery: query, isExpanded: query !== null }),
  
  addQueryResult: (result) =>
    set((state) => ({
      queryHistory: [...state.queryHistory, result],
      activeQuery: result,
      isExpanded: true,
    })),
  
  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
  
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  
  setManualQuery: (query) => set({ manualQuery: query }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  clearHistory: () => set({ queryHistory: [], activeQuery: null }),
}));
