import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/admin-auth";
import { getPlatformBlockedPhones, getSmartBlockSuggestions } from "@/actions/security";
import { FraudClient } from "./FraudClient";

export default async function FraudPage() {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/admin/login");

  const [blocked, suggestions] = await Promise.all([
    getPlatformBlockedPhones(),
    getSmartBlockSuggestions(),
  ]);

  return <FraudClient blocked={blocked} suggestions={suggestions} />;
}
