export interface SqlQuerySuggestion {
  label: string;
  description: string;
  category: "products" | "reviews" | "analytics" | "users" | "chats";
}

export const sqlQuerySuggestions: SqlQuerySuggestion[] = [
  {
    label: "Top Rated Products",
    description: "Show me the highest-rated products with the most reviews",
    category: "products",
  },
  {
    label: "Recent Reviews",
    description: "Get the most recent product reviews",
    category: "reviews",
  },
  {
    label: "Most Reviewed Products",
    description: "Find products with the most customer reviews",
    category: "products",
  },
  {
    label: "Helpful Reviews",
    description: "Show the most helpful customer reviews",
    category: "reviews",
  },
];
