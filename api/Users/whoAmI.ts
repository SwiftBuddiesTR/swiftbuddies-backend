import {
  type ctx,
  type MiddlewareDataArray,
  getDataFromMiddleware,
  SetResponse,
} from '@/endpoints.ts';
import { IUser, OptionalIUser } from '@models/Users.ts';

export const pattern = new URLPattern({ pathname: '/api/whoAmI' });

export const middlewares = ['auth:validToken'];

export function GET(ctx: ctx, _middlewareDatas: MiddlewareDataArray): void {
  const data = getDataFromMiddleware(_middlewareDatas, 'auth:validToken');
  const user = data.user as IUser;

  const userData: OptionalIUser = {
    registerType: user.registerType,
    registerDate: user.registerDate,
    lastLoginDate: user.lastLoginDate,
    email: user.email,
    name: user.name,
    username: user.username,
    picture: user.picture,
  };

  user.socialMedias?.forEach((socialMedia) => {
    userData[socialMedia.key] = socialMedia.value;
  });

  return SetResponse(ctx, {
    status: 200,
    body: userData,
  });
}
