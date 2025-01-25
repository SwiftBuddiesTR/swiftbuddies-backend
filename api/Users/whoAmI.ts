import { type Ctx } from '@/endpoints.ts';
import { IUser, OptionalIUser } from '@/db/models/Users.ts';
import { describeRoute } from 'npm:hono-openapi';
import { z } from 'npm:zod@^3.24.1';
import { description } from "npm:valibot";
import { OpenAPIDoc } from "@/lib/openAPI.types.ts";

export function GET(ctx: Ctx) {
  const data = ctx.get('auth:validToken').user;
  const user = data.user as IUser;

  const userData: OptionalIUser = {
    registerType: user.registerType,
    registerDate: user.registerDate,
    lastLoginDate: user.lastLoginDate,
    email: user.email,
    name: user.name,
    username: user.username,
    picture: user.picture,
    ...user.socialMedias?.reduce(
      (
        acc: Record<string, string>,
        { key, value }: { key: string; value: string }
      ) => ({ ...acc, [key]: value }),
      {}
    ),
  };

  ctx.status(200);
  return ctx.json(userData);
}

export const path = '/api/whoAmI';
export const middlewares = ['auth:validToken'];
export const openAPI: OpenAPIDoc = {
  description: 'Get yourself user information',
  tags: ['User'],
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