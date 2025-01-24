import {
  type Ctx,
  ValidationType,
} from '@/endpoints.ts';
import { z } from 'npm:zod';
import { shouldBeUserId } from '@/lib/userIdCheck.ts';
import { OptionalIUser } from '@/db/models/Users.ts';

/**
 * GET /api/getUserInfo
 *
 * What do: Log the user's log
 */
export async function GET(ctx: Ctx) {
  const requestData = ctx.get('dataValidation').user
  const query: QueryType = requestData.query;

  // middleware converts userId to User
  const targetUser = query.userId;

  const userData: OptionalIUser = {
    registerType: targetUser.registerType,
    registerDate: targetUser.registerDate,
    lastLoginDate: targetUser.lastLoginDate,
    email: targetUser.email,
    name: targetUser.name,
    username: targetUser.username,
    picture: targetUser.picture,
    ...targetUser.socialMedias?.reduce(
      (
        acc: Record<string, string>,
        { key, value }: { key: string; value: string }
      ) => ({ ...acc, [key]: value }),
      {}
    ),
  };

  ctx.status(200);
  return await ctx.json(userData);
}

// Configurations
export const path = '/api/getUserInfo';
export const validation: ValidationType = {
  query: {
    userId: shouldBeUserId,
  },
};
export const middlewares = ['auth:validToken'];

const querySchema = z.object(validation.query as z.ZodRawShape);
type QueryType = z.infer<typeof querySchema>;
