// deno-lint-ignore-file no-explicit-any
import { type ApplyMiddlewareParams } from '@/middlewares/applyMiddleware.ts';
import { ZodType } from 'npm:zod';
import { checkUserId } from '@/lib/userIdCheck.ts';

export async function requestValidationMiddleware(
  request: ApplyMiddlewareParams
) {
  const zod = request.endpoint?.validation;

  const errors: any = [];
  const query: any = {};
  let body: any = {};

  const queryModal = zod?.query;
  if (queryModal) {
    const queries = Object.keys(queryModal);
    for (const key of queries) {
      const value = request.ctx.req.query(key);
      const zv = queryModal[key];
      if (zv) {
        if (typeof zv === 'string') {
          if (zv === 'userid') {
            if (!value) {
              errors.push({
                message: `Invalid query parameter for '${key}', Userid is required.`,
              });
              continue;
            }

            const result = await checkUserId(request.ctx, value);
            query[key] = result;
            if (result === false) {
              errors.push({
                message: `Invalid query parameter for '${key}', User is not found from userid.`,
              });
            }
          }
        } else if (zv?.constructor?.name === 'ZodType') {
          const parsed = (zv as ZodType<any, any, any>).safeParse(value);
          query[key] = parsed.data;
          const parsedErrors = JSON.parse(parsed.error?.message || '{}');
          if (!parsed.success) {
            parsedErrors.forEach((error: { message: string }) => {
              errors.push({
                message: `Invalid query parameter for '${key}', ${error.message}`,
              });
            });
          }
        } else
          console.error(
            'INTERNAL API VALIDATION ERROR ' +
              '(Path: ' +
              request.endpoint?.path +
              ')' +
              ', Invalid query parameter for',
            key
          );
      }
    }
  }

  const bodyModal = zod?.body;
  if (bodyModal) {
    let bodyData;
    try {
      bodyData = await request.ctx.req.json();
    } catch (_) {
      const HTTPMethod = request.endpoint?.method || 'GET';
      const isBodyNotAllowed = ['GET', 'DELETE', 'OPTIONS', 'HEAD'].includes(
        HTTPMethod
      );

      errors.push({
        message:
          'Invalid body, expected JSON.' +
          (isBodyNotAllowed
            ? ` Body is not allowed for '${HTTPMethod}' method.`
            : ''),
      });
    }

    if (bodyData) {
      const parsed = bodyModal.safeParse(bodyData);
      const parsedErrors = JSON.parse(parsed.error?.message || '{}');
      body = parsed.data;
      if (!parsed.success) {
        parsedErrors.forEach(
          (error: {
            code: string;
            expected: string;
            received: string;
            path: string[];
            message: string;
          }) => {
            const getMessage = () => {
              if (error.code === 'invalid_type') {
                return `[${error.code}] Expected ${error.expected} but received ${error.received}. message: ${error.message}`;
              } else {
                return `[${error.code}] ${error.message}`;
              }
            };

            errors.push({
              message: `Invalid body property for '${
                error.path
              }'. ${getMessage()}`,
            });
          }
        );
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
      body,
    },
  };
}

export { requestValidationMiddleware as Middleware };
