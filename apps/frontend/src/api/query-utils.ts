export const QUERY_KEYS = {
  TODOS: {
    all: ["todos"] as const,
    stats: ["todos", "stats"] as const,
    detail: (id: string) => ["todos", id] as const,
  },
  CATEGORIES: {
    all: ["categories"] as const,
    detail: (id: string) => ["categories", id] as const,
  },
  COMMENTS: (todoId: string) => ["todos", todoId, "comments"] as const,
  ATTACHMENTS: (todoId: string) => ["todos", todoId, "attachments"] as const,
} as const;
