import { hash, verify } from "@node-rs/argon2";

const ARGON_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

/**
 * Hashes a password using Argon2id.
 *
 * Args:
 *     password: The plain text password to hash.
 *
 * Returns:
 *     The hashed password string.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON_OPTIONS);
}

/**
 * Verifies a password against a hash.
 *
 * Args:
 *     hash: The stored password hash.
 *     password: The plain text password to verify.
 *
 * Returns:
 *     True if the password matches, false otherwise.
 */
export async function verifyPassword(
  storedHash: string,
  password: string
): Promise<boolean> {
  return verify(storedHash, password, ARGON_OPTIONS);
}
