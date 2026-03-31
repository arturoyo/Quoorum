import { db } from "@quoorum/db";
import { users, profiles } from "@quoorum/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password";
import {
  createSessionToken,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
  verifySessionToken,
} from "./session";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

/**
 * Get the current authenticated user from the session cookie.
 * Returns null if not authenticated.
 * Only works in Server Components / Server Actions / Route Handlers.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) return null;

  return user;
}

/**
 * Login with email and password.
 * Returns the user on success or throws an error.
 */
export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  // Find user by email (case-insensitive)
  const [user] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${email})`)
    .limit(1);

  if (!user) {
    throw new Error("Email o contrasena incorrectos");
  }

  if (!user.passwordHash) {
    throw new Error("Esta cuenta no tiene contrasena configurada. Contacta al administrador.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Email o contrasena incorrectos");
  }

  if (!user.isActive) {
    throw new Error("Tu cuenta esta desactivada. Contacta al administrador.");
  }

  // Create session
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
  });
  await setSessionCookie(token);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Register a new user with email, password, and name.
 * Returns the user on success or throws an error.
 */
export async function signup(
  email: string,
  password: string,
  name: string
): Promise<AuthUser> {
  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${email})`)
    .limit(1);

  if (existing) {
    throw new Error("Este email ya esta registrado");
  }

  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      role: "member",
      credits: 1000,
      tier: "free",
      isActive: true,
    })
    .returning();

  if (!newUser) {
    throw new Error("Error al crear la cuenta");
  }

  // Also create a profile entry for FK compatibility
  await db
    .insert(profiles)
    .values({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: "user",
      isActive: true,
    })
    .onConflictDoNothing();

  // Create session
  const token = await createSessionToken({
    userId: newUser.id,
    email: newUser.email,
  });
  await setSessionCookie(token);

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    avatarUrl: newUser.avatarUrl,
  };
}

/**
 * Logout: clear the session cookie
 */
export async function logout(): Promise<void> {
  await clearSessionCookie();
}

/**
 * Change password for the current user
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.passwordHash) {
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new Error("La contrasena actual es incorrecta");
    }
  }

  const newHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
