import { redirect } from "next/navigation";
import { auth } from "@/auth";
import MarketingHome from "@/components/MarketingHome";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return <MarketingHome />;
}
