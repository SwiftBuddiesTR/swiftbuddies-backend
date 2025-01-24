import {
  type ctx,
  type MiddlewareDataArray,
  getDataFromMiddleware,
  SetResponse,
  ValidationType,
} from '@/endpoints.ts';
import { z } from 'npm:zod';

/**
 * POST /api/log
 * 
 * What do: Log the user's log 
 */
export function POST(ctx: ctx, _middlewareDatas: MiddlewareDataArray): void {
  const requestData = getDataFromMiddleware(
    _middlewareDatas,
    'dataValidation'
  ).user;
  const body: BodyType = requestData.body;

  console.log('new log', body.log);

  return SetResponse(ctx, {
    status: 200,
    body: {},
  });
}

// Configurations
export const pattern = new URLPattern({ pathname: '/api/log' });
export const validation: ValidationType = {
  query: {},
  body: z.object({
    log: z.string().min(1),
  }),
};
export const middlewares = ['auth:validToken'];

type BodyType = z.infer<typeof validation.body>;
