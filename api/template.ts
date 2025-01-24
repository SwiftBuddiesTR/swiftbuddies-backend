import {
  type ctx,
  type MiddlewareDataArray,
  getDataFromMiddleware,
  SetResponse,
  ValidationType,
} from '@/endpoints.ts';
import { IUser } from '@/db/models/Users.ts';
import { z } from 'npm:zod';

/**
 * STEP 1: (OPTIONAL) Do this setting on
 * If you using VSCode, enable 'editor.foldingImportsByDefault' to fold imports
 * and get better DX.
 */

/**
 * STEP 2: (REQUIRED) Endpoint path implementation
 * Don't forget to add filepath to endpoints.ts's loadEndpoints function's return array.
 * Because Deno Deploy don't allow dynamic imports cause of security reasons.
 */

/**
 * STEP 3: (REQUIRED) Readability
 * Don't want create a new file? Create it! Readability is most important thing.
 * Split to multiple files if you need. Single Responsibility Principle is base rule.
 */

/**
 * POST /api/postEvent
 *
 * What do: Post the event
 */
export function POST(ctx: ctx, _middlewareDatas: MiddlewareDataArray): void {
  // .user means user so developer level which not base(library) level
  const authData = getDataFromMiddleware(
    _middlewareDatas,
    'auth:validToken'
  ).user;
  const user = authData as IUser;

  const requestData = getDataFromMiddleware(
    _middlewareDatas,
    'dataValidation'
  ).user;
  const query: QueryType = requestData.query;
  const body: BodyType = requestData.body;

  console.log('logging', query.eventId);
  console.log('Another logging', body.name);

  return SetResponse(ctx, {
    status: 200,
    body: {
      username: user.username,
    },
  });
}

/**
 * GET /api/postEvent
 *
 * What do: Get the event
 */
export function GET(ctx: ctx, _middlewareDatas: MiddlewareDataArray): void {
  return SetResponse(ctx, {
    status: 200,
    body: {},
  });
  // ...
}

// Configurations
export const pattern = new URLPattern({ pathname: '/api/postEvent' });
export const validation: ValidationType = {
  // Please use for 'GET', 'DELETE', 'OPTIONS' or 'HEAD'
  // /api/postEvent?test=anystring
  query: {
    eventId: z.string().min(4),
  },

  // Please use for 'POST', 'PUT' or 'PATCH'
  // /api/postEvent
  // {
  //   name: 'anystring',
  //   description: 'anystring',
  // }
  body: z.object({
    name: z.string().min(5),
    description: z.string().min(1),
  }),
};
export const middlewares = ['auth:validToken'];

const querySchema = z.object(validation.query as z.ZodRawShape);
type QueryType = z.infer<typeof querySchema>;
type BodyType = z.infer<typeof validation.body>;
