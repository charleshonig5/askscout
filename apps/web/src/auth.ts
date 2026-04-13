import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// Re-export getUserId so API routes can import from "@/auth"
export { getUserId } from "./lib/user-identity";
