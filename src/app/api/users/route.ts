import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
} from "@/lib/db/queries/users";
import { createLogger } from "@/lib/logger";

const log = createLogger("users");

const querySchema = z
  .object({
    id: z.string().uuid().optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.id || data.email, {
    message: "Provide either 'id' or 'email' query parameter",
  });

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable().optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  emailVerified: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parseResult = querySchema.safeParse({
      id: searchParams.get("id") ?? undefined,
      email: searchParams.get("email") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { id, email } = parseResult.data;

    const user = id ? await getUserById(id) : await getUserByEmail(email!);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    log.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = createUserSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const user = await createUser(parseResult.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    log.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' query parameter" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parseResult = updateUserSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const user = await updateUser(id, parseResult.data);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    log.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
