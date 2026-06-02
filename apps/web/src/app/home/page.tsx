import type { Metadata } from "next";
import MarketingHome from "@/components/MarketingHome";

/* /home is reached from the marketing nav's "Home" link when a user is
   signed in (the root `/` route redirects authed users to /dashboard,
   so the nav uses /home as a non-redirecting alias).
   The page content is identical to `/`, so we set a canonical pointing
   at `/` to tell search engines this is a duplicate, not a separate page.
   No second meta description is authored; the root layout's description
   inherits and represents the marketing pitch correctly. */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <MarketingHome />;
}
