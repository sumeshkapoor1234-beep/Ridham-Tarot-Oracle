import { randomInt } from "node:crypto";
import { count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import {
  clerkClient,
  getAuth,
} from "@clerk/express";
import { Router, type IRouter, type RequestHandler } from "express";
import {
  CreateReadingBody,
  CreateReadingResponse,
  GetReadingParams,
  GetReadingResponse,
  GetReadingSummaryResponse,
  GetTarotConfigResponse,
  ListReadingsQueryParams,
  ListReadingsResponse,
} from "@workspace/api-zod";
import { db, readingsTable, type ReadingCardData, type ReadingElementSummary } from "@workspace/db";
import tarotData from "../lib/tarot-data.json";

const router: IRouter = Router();
const { cards: deck, spreads } = GetTarotConfigResponse.parse(tarotData);

const requireDeveloper: RequestHandler = async (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to access developer results." });
    return;
  }

  const developerEmail = process.env.TAROT_ADMIN_EMAIL?.trim().toLowerCase();
  if (!developerEmail) {
    res.status(403).json({ error: "Developer access has not been configured." });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const emails = [
      user.primaryEmailAddress?.emailAddress,
      ...user.emailAddresses.map((address) => address.emailAddress),
    ]
      .filter((email): email is string => Boolean(email))
      .map((email) => email.toLowerCase());

    if (!emails.includes(developerEmail)) {
      res.status(403).json({ error: "This account is not authorized to view results." });
      return;
    }
    next();
  } catch (error) {
    req.log.error({ error }, "Unable to verify developer account");
    res.status(503).json({ error: "Developer access could not be verified. Try again." });
  }
};

router.get("/tarot/config", (_req, res) => {
  res.json(GetTarotConfigResponse.parse({ cards: deck, spreads }));
});

router.post("/readings", async (req, res): Promise<void> => {
  const parsed = CreateReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const spread = spreads.find((item) => item.id === input.spreadId);
  if (!spread) {
    res.status(400).json({ error: "Choose a valid tarot spread." });
    return;
  }

  let selectedNames: string[];
  if (input.drawMode === "manual") {
    const chosen = input.selectedCards ?? [];
    if (
      chosen.length !== spread.positions.length ||
      new Set(chosen).size !== chosen.length ||
      chosen.some((name) => !deck.some((card) => card.name === name))
    ) {
      res.status(400).json({
        error: `Choose ${spread.positions.length} different cards from the deck.`,
      });
      return;
    }
    selectedNames = chosen;
  } else {
    const shuffled = [...deck];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const other = randomInt(index + 1);
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    selectedNames = shuffled.slice(0, spread.positions.length).map((card) => card.name);
  }

  const cards: ReadingCardData[] = selectedNames.map((cardName, index) => {
    const card = deck.find((item) => item.name === cardName)!;
    const orientation = randomInt(2) === 0 ? "Upright" : "Reversed";
    return {
      position: spread.positions[index],
      cardName: card.name,
      orientation,
      category: card.category,
      element: card.element,
      zodiac: card.zodiac,
      interpretation: orientation === "Upright" ? card.upright : card.reversed,
      affirmation: card.affirmation,
    };
  });

  const elements: ReadingElementSummary = { Fire: 0, Water: 0, Air: 0, Earth: 0 };
  for (const card of cards) elements[card.element] += 1;

  const [saved] = await db
    .insert(readingsTable)
    .values({
      querentName: input.querentName.trim(),
      question: input.question.trim(),
      spreadId: spread.id,
      spreadName: spread.name,
      drawMode: input.drawMode,
      cards,
      majorCount: cards.filter((card) => card.category === "Major Arcana").length,
      minorCount: cards.filter((card) => card.category === "Minor Arcana").length,
      elements,
    })
    .returning();

  res.status(201).json(CreateReadingResponse.parse(saved));
});

router.get("/readings", requireDeveloper, async (req, res): Promise<void> => {
  const parsed = ListReadingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, limit } = parsed.data;
  const filter = search
    ? or(
        ilike(readingsTable.querentName, `%${search}%`),
        ilike(readingsTable.question, `%${search}%`),
        ilike(readingsTable.spreadName, `%${search}%`),
      )
    : undefined;
  const rows = await db
    .select()
    .from(readingsTable)
    .where(filter)
    .orderBy(desc(readingsTable.createdAt))
    .limit(limit);
  res.json(ListReadingsResponse.parse(rows));
});

router.get("/readings/summary", requireDeveloper, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [totalRow] = await db.select({ total: count() }).from(readingsTable);
  const [todayRow] = await db
    .select({ total: count() })
    .from(readingsTable)
    .where(gte(readingsTable.createdAt, today));
  const [topRow] = await db
    .select({ spreadName: readingsTable.spreadName, total: count() })
    .from(readingsTable)
    .groupBy(readingsTable.spreadName)
    .orderBy(desc(count()))
    .limit(1);
  const [latestRow] = await db
    .select({ createdAt: readingsTable.createdAt })
    .from(readingsTable)
    .orderBy(desc(readingsTable.createdAt))
    .limit(1);
  const [cardsRow] = await db
    .select({
      total: sql<number>`coalesce(sum(jsonb_array_length(${readingsTable.cards})), 0)`,
    })
    .from(readingsTable);

  res.json(
    GetReadingSummaryResponse.parse({
      totalReadings: totalRow.total,
      readingsToday: todayRow.total,
      topSpread: topRow?.spreadName ?? null,
      lastReadingAt: latestRow?.createdAt ?? null,
      cardsDrawn: Number(cardsRow.total),
    }),
  );
});

router.get("/readings/:id", requireDeveloper, async (req, res): Promise<void> => {
  const params = GetReadingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reading] = await db
    .select()
    .from(readingsTable)
    .where(eq(readingsTable.id, params.data.id))
    .limit(1);
  if (!reading) {
    res.status(404).json({ error: "Reading not found." });
    return;
  }
  res.json(GetReadingResponse.parse(reading));
});

export default router;
