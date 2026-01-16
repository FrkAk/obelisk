import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql, avg } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "@/lib/trpc/init";
import { db, remarks, remarkStops, remarkSaves, remarkRatings } from "@/lib/db";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

const createRemarkSchema = z.object({
  title: z.string().min(1).max(128),
  description: z.string().max(2048).optional(),
  coverImageUrl: z.string().url().optional(),
  centerLongitude: z.string().optional(),
  centerLatitude: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

const updateRemarkSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(128).optional(),
  description: z.string().max(2048).optional(),
  coverImageUrl: z.string().url().optional(),
  centerLongitude: z.string().optional(),
  centerLatitude: z.string().optional(),
  categories: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const createStopSchema = z.object({
  remarkId: z.string().uuid(),
  longitude: z.string(),
  latitude: z.string(),
  title: z.string().min(1).max(128),
  description: z.string().max(2048).optional(),
  audioUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
});

const nearbyQuerySchema = z.object({
  longitude: z.string(),
  latitude: z.string(),
  radiusKm: z.number().min(0.1).max(100).default(10),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const remarkRouter = router({
  create: protectedProcedure
    .input(createRemarkSchema)
    .mutation(async ({ ctx, input }) => {
      const baseSlug = generateSlug(input.title);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await db.query.remarks.findFirst({
          where: eq(remarks.slug, slug),
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const [newRemark] = await db
        .insert(remarks)
        .values({
          authorId: ctx.user.id,
          title: input.title,
          slug,
          description: input.description,
          coverImageUrl: input.coverImageUrl,
          centerLongitude: input.centerLongitude,
          centerLatitude: input.centerLatitude,
          categories: input.categories,
        })
        .returning();

      return newRemark;
    }),

  update: protectedProcedure
    .input(updateRemarkSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.remarks.findFirst({
        where: eq(remarks.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Remark not found",
        });
      }

      if (existing.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own remarks",
        });
      }

      const { id, ...updateData } = input;
      const [updated] = await db
        .update(remarks)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(remarks.id, id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.remarks.findFirst({
        where: eq(remarks.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Remark not found",
        });
      }

      if (existing.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own remarks",
        });
      }

      await db.delete(remarks).where(eq(remarks.id, input.id));
      return { success: true };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const remark = await db.query.remarks.findFirst({
        where: and(
          eq(remarks.slug, input.slug),
          eq(remarks.status, "published")
        ),
      });

      if (!remark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Remark not found",
        });
      }

      const stops = await db.query.remarkStops.findMany({
        where: eq(remarkStops.remarkId, remark.id),
        orderBy: remarkStops.sequenceNumber,
      });

      return { ...remark, stops };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const remark = await db.query.remarks.findFirst({
        where: eq(remarks.id, input.id),
      });

      if (!remark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Remark not found",
        });
      }

      if (remark.status !== "published" && remark.authorId !== ctx.user?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Remark not found",
        });
      }

      const stops = await db.query.remarkStops.findMany({
        where: eq(remarkStops.remarkId, remark.id),
        orderBy: remarkStops.sequenceNumber,
      });

      return { ...remark, stops };
    }),

  nearby: publicProcedure.input(nearbyQuerySchema).query(async ({ input }) => {
    const radiusMeters = input.radiusKm * 1000;

    const result = await db.execute<{
      id: string;
      author_id: string;
      title: string;
      slug: string;
      description: string | null;
      cover_image_url: string | null;
      center_longitude: string | null;
      center_latitude: string | null;
      categories: string[] | null;
      status: string;
      created_at: Date;
      updated_at: Date;
      distance_meters: number;
      author_username: string;
      author_display_name: string | null;
    }>(sql`
      SELECT
        r.id,
        r.author_id,
        r.title,
        r.slug,
        r.description,
        r.cover_image_url,
        r.center_longitude,
        r.center_latitude,
        r.categories,
        r.status,
        r.created_at,
        r.updated_at,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(r.center_longitude::float, r.center_latitude::float), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${input.longitude}::float, ${input.latitude}::float), 4326)::geography
        ) as distance_meters,
        u.username as author_username,
        u.display_name as author_display_name
      FROM remarks r
      JOIN users u ON r.author_id = u.id
      WHERE r.status = 'published'
        AND r.center_longitude IS NOT NULL
        AND r.center_latitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(r.center_longitude::float, r.center_latitude::float), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${input.longitude}::float, ${input.latitude}::float), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_meters ASC
      LIMIT ${input.limit}
      OFFSET ${input.offset}
    `);

    return [...result].map((row) => ({
      id: row.id,
      authorId: row.author_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      centerLongitude: row.center_longitude,
      centerLatitude: row.center_latitude,
      categories: row.categories,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      distanceMeters: row.distance_meters,
      author: {
        username: row.author_username,
        displayName: row.author_display_name,
      },
    }));
  }),

  myRemarks: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await db.query.remarks.findMany({
        where: eq(remarks.authorId, ctx.user.id),
        orderBy: desc(remarks.createdAt),
        limit: input.limit,
        offset: input.offset,
      });

      return result;
    }),

  addStop: protectedProcedure
    .input(createStopSchema)
    .mutation(async ({ ctx, input }) => {
      const remark = await db.query.remarks.findFirst({
        where: eq(remarks.id, input.remarkId),
      });

      if (!remark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Remark not found",
        });
      }

      if (remark.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only add stops to your own remarks",
        });
      }

      const existingStops = await db.query.remarkStops.findMany({
        where: eq(remarkStops.remarkId, input.remarkId),
      });

      const [newStop] = await db
        .insert(remarkStops)
        .values({
          remarkId: input.remarkId,
          sequenceNumber: existingStops.length + 1,
          longitude: input.longitude,
          latitude: input.latitude,
          title: input.title,
          description: input.description,
          audioUrl: input.audioUrl,
          images: input.images,
        })
        .returning();

      return newStop;
    }),

  save: protectedProcedure
    .input(z.object({ remarkId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.remarkSaves.findFirst({
        where: and(
          eq(remarkSaves.userId, ctx.user.id),
          eq(remarkSaves.remarkId, input.remarkId)
        ),
      });

      if (existing) {
        await db
          .delete(remarkSaves)
          .where(
            and(
              eq(remarkSaves.userId, ctx.user.id),
              eq(remarkSaves.remarkId, input.remarkId)
            )
          );
        return { saved: false };
      }

      await db.insert(remarkSaves).values({
        userId: ctx.user.id,
        remarkId: input.remarkId,
      });
      return { saved: true };
    }),

  rate: protectedProcedure
    .input(
      z.object({
        remarkId: z.string().uuid(),
        rating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.remarkRatings.findFirst({
        where: and(
          eq(remarkRatings.userId, ctx.user.id),
          eq(remarkRatings.remarkId, input.remarkId)
        ),
      });

      if (existing) {
        await db
          .update(remarkRatings)
          .set({ rating: input.rating })
          .where(
            and(
              eq(remarkRatings.userId, ctx.user.id),
              eq(remarkRatings.remarkId, input.remarkId)
            )
          );
      } else {
        await db.insert(remarkRatings).values({
          userId: ctx.user.id,
          remarkId: input.remarkId,
          rating: input.rating,
        });
      }

      return { success: true };
    }),

  updateStop: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(128).optional(),
        description: z.string().max(2048).optional(),
        audioUrl: z.string().optional().nullable(),
        images: z.array(z.string()).optional(),
        longitude: z.string().optional(),
        latitude: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stop = await db.query.remarkStops.findFirst({
        where: eq(remarkStops.id, input.id),
      });

      if (!stop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stop not found",
        });
      }

      const remark = await db.query.remarks.findFirst({
        where: eq(remarks.id, stop.remarkId),
      });

      if (!remark || remark.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit stops in your own remarks",
        });
      }

      const { id, ...updateData } = input;
      const [updated] = await db
        .update(remarkStops)
        .set(updateData)
        .where(eq(remarkStops.id, id))
        .returning();

      return updated;
    }),

  deleteStop: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const stop = await db.query.remarkStops.findFirst({
        where: eq(remarkStops.id, input.id),
      });

      if (!stop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stop not found",
        });
      }

      const remark = await db.query.remarks.findFirst({
        where: eq(remarks.id, stop.remarkId),
      });

      if (!remark || remark.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete stops in your own remarks",
        });
      }

      await db.delete(remarkStops).where(eq(remarkStops.id, input.id));

      await db.execute(sql`
        UPDATE remark_stops
        SET sequence_number = sequence_number - 1
        WHERE remark_id = ${stop.remarkId}
          AND sequence_number > ${stop.sequenceNumber}
      `);

      return { success: true };
    }),

  reorderStops: protectedProcedure
    .input(
      z.object({
        remarkId: z.string().uuid(),
        stopIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const remark = await db.query.remarks.findFirst({
        where: eq(remarks.id, input.remarkId),
      });

      if (!remark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Remark not found",
        });
      }

      if (remark.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reorder stops in your own remarks",
        });
      }

      for (let i = 0; i < input.stopIds.length; i++) {
        await db
          .update(remarkStops)
          .set({ sequenceNumber: i + 1 })
          .where(
            and(
              eq(remarkStops.id, input.stopIds[i]),
              eq(remarkStops.remarkId, input.remarkId)
            )
          );
      }

      return { success: true };
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
          remark: remarks,
          savedAt: remarkSaves.savedAt,
        })
        .from(remarkSaves)
        .innerJoin(remarks, eq(remarkSaves.remarkId, remarks.id))
        .where(eq(remarkSaves.userId, ctx.user.id))
        .orderBy(desc(remarkSaves.savedAt))
        .limit(input.limit)
        .offset(input.offset);

      return saved.map((row) => ({
        ...row.remark,
        savedAt: row.savedAt,
      }));
    }),

  isSaved: protectedProcedure
    .input(z.object({ remarkId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const saved = await db.query.remarkSaves.findFirst({
        where: and(
          eq(remarkSaves.userId, ctx.user.id),
          eq(remarkSaves.remarkId, input.remarkId)
        ),
      });
      return { saved: !!saved };
    }),

  getAverageRating: publicProcedure
    .input(z.object({ remarkId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await db
        .select({
          average: avg(remarkRatings.rating),
          count: sql<number>`count(*)::int`,
        })
        .from(remarkRatings)
        .where(eq(remarkRatings.remarkId, input.remarkId));

      return {
        average: result[0]?.average ? parseFloat(result[0].average) : null,
        count: result[0]?.count ?? 0,
      };
    }),

  getUserRating: protectedProcedure
    .input(z.object({ remarkId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rating = await db.query.remarkRatings.findFirst({
        where: and(
          eq(remarkRatings.userId, ctx.user.id),
          eq(remarkRatings.remarkId, input.remarkId)
        ),
      });
      return { rating: rating?.rating ?? null };
    }),
});
