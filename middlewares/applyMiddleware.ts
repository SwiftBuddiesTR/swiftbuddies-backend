// deno-lint-ignore-file no-explicit-any
import { Middleware as data_validation } from '@/middlewares/data/requestValidation.ts';
import { Ctx, ValidationType } from '@/endpoints.ts';

type ApplyMiddlewareParams = {
  ctx: Ctx;
  middleware: string;
  endpoint?: {
    path: string;
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
  (request: ApplyMiddlewareParams) => Promise<any>
> = {
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
