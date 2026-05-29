export { auth as middleware } from "@/auth";

export const config = {
  // Keep in sync with the `authorized` callback in auth.config.ts.
  // Every auth-gated surface must be listed here so the middleware
  // actually runs and the callback gets a chance to redirect
  // anonymous visitors before the page renders.
  matcher: ["/dashboard/:path*", "/settings/:path*", "/insights/:path*"],
};
