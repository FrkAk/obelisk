import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "@/lib/trpc/init";
import { db, pois, poiInteractions, poiSaves } from "@/lib/db";
import { getOrGenerateStory, regenerateStory } from "@/server/services/story-generation";
import { importPoisFromOsm, type CategoryFilter } from "@/server/services/osm-import";

const nearbyQuerySchema = z.object({
  longitude: z.string(),
  latitude: z.string(),
  radiusMeters: z.number().min(10).max(10000).default(500),
  limit: z.number().min(1).max(50).default(10),
  excludeIds: z.array(z.string().uuid()).optional(),
});

const storyTypeSchema = z.enum([
  "discovery",
  "historical",
  "cultural",
  "foodie",
  "hidden",
]);

export const poiRouter = router({
  nearby: publicProcedure.input(nearbyQuerySchema).query(async ({ input }) => {
    const excludeClause =
      input.excludeIds && input.excludeIds.length > 0
        ? sql`AND p.id NOT IN (${sql.join(
            input.excludeIds.map((id) => sql`${id}::uuid`),
            sql`, `
          )})`
        : sql``;

    const result = await db.execute<{
      id: string;
      external_id: string | null;
      source: string;
      name: string;
      longitude: string;
      latitude: string;
      categories: string[] | null;
      tags: Record<string, string> | null;
      wikipedia_url: string | null;
      description_raw: string | null;
      created_at: Date;
      distance_meters: number;
      story_id: string | null;
      story_title: string | null;
      story_teaser: string | null;
    }>(sql`
      SELECT
        p.id,
        p.external_id,
        p.source,
        p.name,
        p.longitude,
        p.latitude,
        p.categories,
        p.tags,
        p.wikipedia_url,
        p.description_raw,
        p.created_at,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(p.longitude::float, p.latitude::float), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${input.longitude}::float, ${input.latitude}::float), 4326)::geography
        ) as distance_meters,
        s.id as story_id,
        s.title as story_title,
        s.teaser as story_teaser
      FROM pois p
      LEFT JOIN poi_stories s ON p.id = s.poi_id AND s.story_type = 'discovery'
      WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint(p.longitude::float, p.latitude::float), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${input.longitude}::float, ${input.latitude}::float), 4326)::geography,
        ${input.radiusMeters}
      )
      ${excludeClause}
      ORDER BY distance_meters ASC
      LIMIT ${input.limit}
    `);

    return [...result].map((row) => ({
      id: row.id,
      externalId: row.external_id,
      source: row.source,
      name: row.name,
      longitude: row.longitude,
      latitude: row.latitude,
      categories: row.categories,
      tags: row.tags,
      wikipediaUrl: row.wikipedia_url,
      descriptionRaw: row.description_raw,
      createdAt: row.created_at,
      distanceMeters: row.distance_meters,
      story: row.story_id
        ? {
            id: row.story_id,
            title: row.story_title!,
            teaser: row.story_teaser!,
          }
        : null,
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const poi = await db.query.pois.findFirst({
        where: eq(pois.id, input.id),
      });

      if (!poi) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "POI not found",
        });
      }

      return poi;
    }),

  getStory: publicProcedure
    .input(
      z.object({
        poiId: z.string().uuid(),
        storyType: storyTypeSchema.default("discovery"),
      })
    )
    .query(async ({ input }) => {
      const { story, wasGenerated } = await getOrGenerateStory(
        input.poiId,
        input.storyType
      );
      return { ...story, wasGenerated };
    }),

  regenerateStory: protectedProcedure
    .input(
      z.object({
        poiId: z.string().uuid(),
        storyType: storyTypeSchema.default("discovery"),
      })
    )
    .mutation(async ({ input }) => {
      const story = await regenerateStory(input.poiId, input.storyType);
      return story;
    }),

  recordInteraction: protectedProcedure
    .input(
      z.object({
        poiId: z.string().uuid(),
        interactionType: z.enum([
          "view",
          "expand",
          "dismiss",
          "listen",
          "share",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.insert(poiInteractions).values({
        userId: ctx.user.id,
        poiId: input.poiId,
        interactionType: input.interactionType,
      });
      return { success: true };
    }),

  save: protectedProcedure
    .input(z.object({ poiId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.poiSaves.findFirst({
        where: and(
          eq(poiSaves.userId, ctx.user.id),
          eq(poiSaves.poiId, input.poiId)
        ),
      });

      if (existing) {
        await db
          .delete(poiSaves)
          .where(
            and(
              eq(poiSaves.userId, ctx.user.id),
              eq(poiSaves.poiId, input.poiId)
            )
          );
        return { saved: false };
      }

      await db.insert(poiSaves).values({
        userId: ctx.user.id,
        poiId: input.poiId,
      });
      return { saved: true };
    }),

  isSaved: protectedProcedure
    .input(z.object({ poiId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const saved = await db.query.poiSaves.findFirst({
        where: and(
          eq(poiSaves.userId, ctx.user.id),
          eq(poiSaves.poiId, input.poiId)
        ),
      });
      return { saved: !!saved };
    }),

  getSaved: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const saved = await db
        .select({
          poi: pois,
          savedAt: poiSaves.savedAt,
        })
        .from(poiSaves)
        .innerJoin(pois, eq(poiSaves.poiId, pois.id))
        .where(eq(poiSaves.userId, ctx.user.id))
        .orderBy(desc(poiSaves.savedAt))
        .limit(input.limit)
        .offset(input.offset);

      return saved.map((row) => ({
        ...row.poi,
        savedAt: row.savedAt,
      }));
    }),

  importFromOsm: protectedProcedure
    .input(
      z.object({
        south: z.number().min(-90).max(90),
        west: z.number().min(-180).max(180),
        north: z.number().min(-90).max(90),
        east: z.number().min(-180).max(180),
        categories: z
          .array(z.enum(["tourism", "historic", "amenity", "shop", "leisure"]))
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await importPoisFromOsm({
        bbox: {
          south: input.south,
          west: input.west,
          north: input.north,
          east: input.east,
        },
        categories: input.categories as CategoryFilter[] | undefined,
      });

      return result;
    }),
});
