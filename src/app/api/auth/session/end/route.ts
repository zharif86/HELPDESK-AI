import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/server/auth/cookie";

export async function GET() {
  await clearSessionCookie();
  redirect("/login");
}
