// deno-lint-ignore-file no-explicit-any
import { Middleware as auth_validToken } from '@/middlewares/auth/validToken.ts';
import { Middleware as data_validation } from '@/middlewares/data/requestValidation.ts';
import { ctx, ValidationType } from '@/endpoints.ts';

type ApplyMiddlewareParams = {
  ctx: ctx;
  middleware: string;
  endpoint?: {
    pattern: URLPattern;
    middlewares: string[] | undefined;
    validation?: ValidationType;
    method:
      | 'GET'
      | 'POST'
      | 'PUT'
      | 'DELETE'
      | 'PATCH'
      | 'OPTIONS'
      | 'HEAD'
      | 'CONNECT'
      | 'TRACE';
  };
};

const validMiddlewares: Record<
  string,
  (request: ApplyMiddlewareParams) => any
> = {
  'auth:validToken': auth_validToken,
  'dataValidation': data_validation,
};

async function applyMiddleware(request: ApplyMiddlewareParams): Promise<any> {
  if (validMiddlewares[request.middleware]) {
    return await validMiddlewares[request.middleware](request);
  } else {
    console.warn(`Middleware ${request.middleware} not found`, request);
    return null;
  }
}

export { applyMiddleware, type ApplyMiddlewareParams };
