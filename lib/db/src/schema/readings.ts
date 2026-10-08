import {
  jsonb,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export type ReadingCardData = {
  position: string;
  cardName: string;
  orientation: "Upright" | "Reversed";
  category: "Major Arcana" | "Minor Arcana";
  element: "Fire" | "Water" | "Air" | "Earth";
  zodiac: string;
  interpretation: string;
  affirmation: string;
};

export type ReadingElementSummary = {
  Fire: number;
  Water: number;
  Air: number;
  Earth: number;
};

export const readingsTable = pgTable("tarot_readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  querentName: text("querent_name").notNull(),
  question: text("question").notNull().default(""),
  readerEmail: text("reader_email"),
  spreadId: text("spread_id").notNull(),
  spreadName: text("spread_name").notNull(),
  drawMode: text("draw_mode").notNull(),
  cards: jsonb("cards").$type<ReadingCardData[]>().notNull(),
  majorCount: integer("major_count").notNull(),
  minorCount: integer("minor_count").notNull(),
  elements: jsonb("elements").$type<ReadingElementSummary>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TarotReading = typeof readingsTable.$inferSelect;
