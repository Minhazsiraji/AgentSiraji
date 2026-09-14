import { isPlatformAdmin, readSession, type AuthSession } from "@/lib/auth";

export async function platformAdminSession(request: Request): Promise<AuthSession | null> {
  const session = await readSession(request);
  return isPlatformAdmin(session) ? session : null;
}
