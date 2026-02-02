"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { Package, MessageSquare, BarChart3, Star } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { sqlQuerySuggestions, type SqlQuerySuggestion } from "@/lib/ai/tools/sql-suggestions-data";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryIcons = {
  products: Package,
  reviews: MessageSquare,
  analytics: BarChart3,
  users: Star,
  chats: MessageSquare,
};

const categoryColors = {
  products: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  reviews: "text-green-500 bg-green-500/10 border-green-500/20",
  analytics: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  users: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  chats: "text-pink-500 bg-pink-500/10 border-pink-500/20",
};

interface SqlSuggestionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
}

function PureSqlSuggestions({ chatId, sendMessage }: SqlSuggestionsProps) {
  const handleQuerySelect = (suggestion: SqlQuerySuggestion) => {
    window.history.pushState({}, "", `/chat/${chatId}`);
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: suggestion.description }],
    });
  };

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {sqlQuerySuggestions.slice(0, 6).map((suggestion, index) => {
        const Icon = categoryIcons[suggestion.category];
        const colorClass = categoryColors[suggestion.category];
        
        return (
          <motion.div
            key={index}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * index }}
          >
            <Button
              variant="outline"
              onClick={() => handleQuerySelect(suggestion)}
              className={cn(
                "h-auto w-full flex-col items-start gap-2 p-3 text-left transition-all hover:scale-[1.02]",
                "group relative overflow-hidden"
              )}
            >
              <div className="flex w-full items-center gap-2">
                <div className={cn("rounded-md border p-1.5", colorClass)}>
                  <Icon className="size-3.5" />
                </div>
                <span className="flex-1 text-sm font-medium">{suggestion.label}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {suggestion.description}
              </p>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

export const SqlSuggestions = memo(
  PureSqlSuggestions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    return true;
  }
);
