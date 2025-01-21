// deno-lint-ignore-file no-explicit-any
import { type ApplyMiddlewareParams } from '@/middlewares/applyMiddleware.ts';

export async function requestValidationMiddleware(
  request: ApplyMiddlewareParams
) {
  const zod = request.endpoint?.validation;

  const errors: any = [];
  const query: any = {};
  const body: any = {};

  const queryModal = zod?.query;
  if (queryModal) {
    const queries = Object.keys(queryModal);
    for (const key of queries) {
      const value = request.ctx.request.url.searchParams.get(key);
      const zv = queryModal[key];
      if (zv) {
        const parsed = zv.safeParse(value);
        query[key] = parsed.data;
        const parsedErrors = JSON.parse(parsed.error?.message || '{}');
        if (!parsed.success) {
          parsedErrors.forEach((error: { message: string }) => {
            errors.push({
              message: `Invalid query parameter for '${key}', ${error.message}`,
            });
          });
        }
      }
    }
  }

  const bodyModal = zod?.body;
  if (bodyModal) {
    // TODO: Body validation is failing, need to fix it
    let bodyData;
    try {
      bodyData = await request.ctx.request.body.json();
    } catch (error) {
      errors.push({
        message: 'Invalid body, expected JSON.',
      });
    }

    if (bodyData) {
      const parsed = bodyModal.safeParse(bodyData);
      const parsedErrors = JSON.parse(parsed.error?.message || '{}');
      if (!parsed.success) {
        parsedErrors.forEach((error: { message: string }) => {
          console.log(error);
          errors.push({
            message: `Invalid body, ${error.message}`,
          });
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      base: {
        responseStatus: 'end',
        status: 400,
        body: JSON.stringify({ errors }),
      },
    };
  }

  return {
    base: {},
    user: {
      query,
    },
  };
}

export { requestValidationMiddleware as Middleware };
