"use server";

import { signOut } from "@/auth";

export async function logout() {
  // Auth.js remains fully responsible for clearing the session — this is
  // not a custom session-clearing implementation, just invoking the
  // library's own signOut().
  await signOut({ redirectTo: "/" });
}
