import { getCurrentUser } from "./auth";

export async function getPlatformAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isPlatformAdmin) return null;
  return user;
}
