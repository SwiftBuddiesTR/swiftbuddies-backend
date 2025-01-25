import {
  type Ctx,
  ValidationType,
} from '@/endpoints.ts';
import { z } from 'npm:zod';
import { shouldBeUserId } from '@/lib/userIdCheck.ts';
import { OptionalIUser } from '@/db/models/Users.ts';
import { OpenAPIDoc } from "@/lib/openAPI.types.ts";

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
export const middlewares = ['auth:validToken'];

export const validation: ValidationType = {
  query: {
    userId: shouldBeUserId,
  },
};
const querySchema = z.object(validation.query as z.ZodRawShape);
type QueryType = z.infer<typeof querySchema>;

export const openAPI: OpenAPIDoc = {
  description: 'Get the user information',
  tags: ['Users'],
  responses: {
    200: {
      type: 'application/json',
      zodSchema: z.object({
        registerType: z.string(),
        registerDate: z.string(),
        lastLoginDate: z.string(),
        email: z.string(),
        name: z.string(),
        username: z.string(),
        picture: z.string(),
        socialMedias: z.array(z.object({
          key: z.string(),
          value: z.string(),
        })),
      }),
    },
  },
}