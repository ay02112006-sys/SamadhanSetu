// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Session } from "next-auth";

/**
 * Helper to get the session on the server side.
 */
export const getServerAuthSession = async (): Promise<Session | null> => {
  return await getServerSession(authOptions);
};
