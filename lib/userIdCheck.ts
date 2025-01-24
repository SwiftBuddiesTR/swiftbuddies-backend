import { getUserById } from '@/db/models/Users.ts';
import { Ctx } from "@/endpoints.ts";

export const shouldBeUserId = 'userid'

export async function checkUserId(ctx: Ctx, userid: string | null) {
  if (!userid || typeof userid !== 'string') {
    return false;
  }

  const targetUser = await getUserById(ctx, userid);
  return targetUser ? targetUser : false;
}