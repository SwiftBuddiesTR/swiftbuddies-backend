import {
  type Ctx,
} from '@/endpoints.ts';
import { IUser, OptionalIUser } from '@/db/models/Users.ts';

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
