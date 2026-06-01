import { describe, it, expect } from "vitest";
import { getUserId } from "../user-identity";

// getUserId is intentionally id-only — see lib/user-identity.ts for the
// reasoning (two GitHub accounts can share an email; the email fallback
// silently cross-contaminated digests/settings/history before MED-1).
// These tests pin that contract so the fallback can't be reintroduced
// accidentally.
describe("getUserId", () => {
  it("returns id when available", () => {
    const session = { user: { id: "user123" } };
    expect(getUserId(session)).toBe("user123");
  });

  it("returns null when id is missing even if email is present", () => {
    // The session type allows extra fields like email; the function
    // ignores them. Cast through `unknown` to model what arrives at
    // runtime from NextAuth without coupling the test to the typed
    // contract (which deliberately excludes email).
    const session = { user: { email: "test@example.com" } } as unknown as {
      user?: { id?: string };
    };
    expect(getUserId(session)).toBeNull();
  });

  it("returns null when user is an empty object", () => {
    expect(getUserId({ user: {} })).toBeNull();
  });

  it("returns null when user is undefined", () => {
    expect(getUserId({})).toBeNull();
  });

  it("never returns 'unknown' for any empty-shape input", () => {
    const cases: Array<{ user?: { id?: string } }> = [{ user: {} }, {}, { user: undefined }];
    for (const session of cases) {
      expect(getUserId(session)).not.toBe("unknown");
    }
  });
});
