import "dotenv/config";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function seed() {
  console.log("Seeding database...");

  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "dev@obelisk.local"),
  });

  if (existingUser) {
    console.log("Dev user already exists, skipping...");
    return;
  }

  const passwordHash = await hashPassword("password123");

  await db.insert(users).values({
    email: "dev@obelisk.local",
    username: "devuser",
    displayName: "Dev User",
    passwordHash,
    preferences: {
      theme: "system",
      audioAutoplay: true,
      notifications: true,
    },
  });

  console.log("Dev user created:");
  console.log("  Email: dev@obelisk.local");
  console.log("  Password: password123");
  console.log("Done!");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
