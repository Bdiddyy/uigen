// @vitest-environment node
import { vi, test, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { decodeJwt, SignJWT } from "jose";

const TEST_SECRET = new TextEncoder().encode("development-secret-key");

vi.mock("server-only", () => ({}));

const mockCookieStore = vi.hoisted(() => {
  const store = new Map<string, string>();
  const optionsStore = new Map<string, Record<string, unknown>>();
  return {
    get: (name: string) => (store.has(name) ? { value: store.get(name)! } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      store.set(name, value);
      if (options) optionsStore.set(name, options);
    },
    delete: (name: string) => store.delete(name),
    _clear: () => { store.clear(); optionsStore.clear(); },
    _get: (name: string) => store.get(name),
    _getOptions: (name: string) => optionsStore.get(name),
  };
});

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";

beforeEach(() => {
  mockCookieStore._clear();
});

test("createSession stores a JWT in the auth-token cookie", async () => {
  await createSession("user-1", "test@example.com");

  const token = mockCookieStore._get("auth-token");
  expect(token).toBeDefined();
  expect(token!.split(".")).toHaveLength(3);
});

test("createSession encodes userId and email in the JWT", async () => {
  await createSession("user-42", "carol@example.com");

  const token = mockCookieStore._get("auth-token")!;
  const claims = decodeJwt(token);
  expect(claims.userId).toBe("user-42");
  expect(claims.email).toBe("carol@example.com");
});

test("createSession sets the cookie to expire in ~7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const options = mockCookieStore._getOptions("auth-token");
  const expires = options?.expires as Date;
  expect(expires).toBeInstanceOf(Date);

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession sets httpOnly on the cookie", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockCookieStore._getOptions("auth-token");
  expect(options?.httpOnly).toBe(true);
});

test("createSession sets sameSite to lax on the cookie", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockCookieStore._getOptions("auth-token");
  expect(options?.sameSite).toBe("lax");
});

test("createSession sets path to / on the cookie", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockCookieStore._getOptions("auth-token");
  expect(options?.path).toBe("/");
});

test("getSession returns null when no cookie is present", async () => {
  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns the session payload after createSession", async () => {
  await createSession("user-123", "alice@example.com");

  const session = await getSession();
  expect(session).toBeDefined();
  expect(session!.userId).toBe("user-123");
  expect(session!.email).toBe("alice@example.com");
  expect(session!.expiresAt).toBeDefined();
});

test("getSession returns null for a tampered token", async () => {
  mockCookieStore.set("auth-token", "not.a.valid.jwt");

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const expiredToken = await new SignJWT({ userId: "user-1", email: "test@example.com", expiresAt: new Date() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(new Date(Date.now() - 1000))
    .setIssuedAt()
    .sign(TEST_SECRET);

  mockCookieStore.set("auth-token", expiredToken);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for a token signed with a different secret", async () => {
  const wrongSecretToken = await new SignJWT({ userId: "user-1", email: "test@example.com", expiresAt: new Date() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(new TextEncoder().encode("wrong-secret"));

  mockCookieStore.set("auth-token", wrongSecretToken);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession ignores cookies other than auth-token", async () => {
  mockCookieStore.set("some-other-cookie", "somevalue");

  const session = await getSession();
  expect(session).toBeNull();
});

test("deleteSession removes the auth-token cookie", async () => {
  await createSession("user-1", "test@example.com");
  expect(mockCookieStore._get("auth-token")).toBeDefined();

  await deleteSession();
  expect(mockCookieStore._get("auth-token")).toBeUndefined();
});

test("verifySession returns null when request has no cookie", async () => {
  const request = new NextRequest("http://localhost/");

  const session = await verifySession(request);
  expect(session).toBeNull();
});

test("verifySession returns the session payload for a valid token", async () => {
  await createSession("user-456", "bob@example.com");
  const token = mockCookieStore._get("auth-token")!;

  const request = new NextRequest("http://localhost/", {
    headers: { Cookie: `auth-token=${token}` },
  });

  const session = await verifySession(request);
  expect(session).toBeDefined();
  expect(session!.userId).toBe("user-456");
  expect(session!.email).toBe("bob@example.com");
});

test("verifySession returns null for an invalid token in the request", async () => {
  const request = new NextRequest("http://localhost/", {
    headers: { Cookie: "auth-token=invalid.token.here" },
  });

  const session = await verifySession(request);
  expect(session).toBeNull();
});
