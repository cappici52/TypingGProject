import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  mode: text("mode").notNull(),
  stage: integer("stage").notNull(),
  score: integer("score").notNull(),
  wpm: integer("wpm").notNull(),
  accuracy: integer("accuracy").notNull(),
  cleared: integer("cleared", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at").notNull(),
});
