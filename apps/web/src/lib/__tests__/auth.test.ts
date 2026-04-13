import { describe, it, expect } from "vitest";
import { getUserId } from "../user-identity";

describe("getUserId", () => {
  it("returns id when available", () => {
    const session = { user: { id: "user123", email: "test@example.com" } };
    expect(getUserId(session)).toBe("user123");
  });

  it("falls back to email when id is missing", () => {
    const session = { user: { email: "test@example.com" } };
    expect(getUserId(session)).toBe("test@example.com");
  });

  it("returns null when both id and email are missing", () => {
    const session = { user: {} };
    expect(getUserId(session)).toBeNull();
  });

  it("returns null when user is undefined", () => {
    const session = {};
    expect(getUserId(session)).toBeNull();
  });

  it("returns null for null email", () => {
    const session = { user: { email: null } };
    expect(getUserId(session)).toBeNull();
  });

  it("never returns 'unknown'", () => {
    const cases = [{ user: {} }, { user: { email: null } }, {}, { user: undefined }];
    for (const session of cases) {
      const result = getUserId(session);
      expect(result).not.toBe("unknown");
    }
  });
});
