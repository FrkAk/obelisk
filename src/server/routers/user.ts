import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/lib/trpc/init";
import { db, users, type UserPreferences } from "@/lib/db";

const updateProfileSchema = z.object({
  displayName: z.string().max(64).optional(),
  avatarUrl: z.string().url().optional(),
});

const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  mapStyle: z.string().optional(),
  accessibilityMode: z
    .enum(["default", "mobility", "vision", "hearing"])
    .optional(),
  audioAutoplay: z.boolean().optional(),
  notifications: z.boolean().optional(),
});

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await db
        .update(users)
        .set({
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();

      return {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
      };
    }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: { preferences: true },
    });

    return (user?.preferences ?? {}) as UserPreferences;
  }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
        columns: { preferences: true },
      });

      const currentPreferences = (user?.preferences ?? {}) as UserPreferences;
      const newPreferences = { ...currentPreferences, ...input };

      await db
        .update(users)
        .set({
          preferences: newPreferences,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return newPreferences;
    }),
});
