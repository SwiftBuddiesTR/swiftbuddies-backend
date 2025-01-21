// deno-lint-ignore-file no-explicit-any
import { Context } from 'https://deno.land/x/oak@v17.1.4/mod.ts';
import { z } from 'npm:zod';

async function loadEndpoints() {
  return [await import('./api/Users/whoAmI.ts')];
}

export type ctx = Context<Record<string, any>, Record<string, any>>;

type AllMethods =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | 'CONNECT'
  | 'TRACE';

type MiddlewareDataArray = Array<{
  middleware: string;
  base: any;
  user: any;
}>;

type ValidationType = {
  query: {
    [key: string]: z.ZodType<any, any, any> | undefined;
  };
  body: z.infer<any> | undefined;
};

function getDataFromMiddleware(
  middlewareDatas: MiddlewareDataArray,
  middleware: string
): { isFound: boolean; user: any } {
  const middlewareData = middlewareDatas.find(
    (data) => data.middleware === middleware
  );
  if (!middlewareData) {
    return {
      isFound: false,
      user: null,
    };
  }
  return {
    isFound: true,
    ...middlewareData.user,
  };
}

type SetResponseParams = {
  status?: number;
  body?: any;
  headers?: Headers;
  type?: 'json' | 'text' | 'html' | 'xml' | 'form' | 'multipart' | 'octet';
};

function SetResponse(ctx: ctx, responseParams = {} as SetResponseParams) {
  if (!responseParams.headers) {
    responseParams.headers = new Headers();
  }
  if (responseParams.type === 'json') {
    responseParams.headers.set('Content-Type', 'application/json');
    ctx.response.body =
      typeof responseParams.body === 'string'
        ? responseParams.body
        : JSON.stringify(responseParams.body);
  } else {
    ctx.response.body = responseParams.body;
  }
  ctx.response.status = responseParams.status
    ? responseParams.status
    : ctx.response.status;
  ctx.response.headers = responseParams.headers
    ? responseParams.headers
    : ctx.response.headers;
  ctx.response.type = responseParams.type;
}

const endpoints: Array<{
  endpoint: {
    pattern: URLPattern;
    middlewares: string[] | undefined;
    validation: ValidationType;
    method: AllMethods;
  };
  handler: (
    ctx: ctx,
    middlewareDatas: MiddlewareDataArray
  ) => Response | Promise<Response>;
}> = [];

async function initializeEndpoints() {
  const endpointExports = await loadEndpoints();

  for (const _export of endpointExports) {
    let pattern: URLPattern | null = null;
    let middlewares: string[] | undefined = [];
    let validation: ValidationType = { query: {}, body: undefined };
    let GET: ((ctx: ctx) => Response | Promise<Response>) | null = null;
    let POST: ((ctx: ctx) => Response | Promise<Response>) | null = null;
    let PUT: ((ctx: ctx) => Response | Promise<Response>) | null = null;
    let DELETE: ((ctx: ctx) => Response | Promise<Response>) | null = null;
    let PATCH: ((ctx: ctx) => Response | Promise<Response>) | null = null;
    try {
      pattern = _export.pattern;
      middlewares = (_export as any).middlewares;
      validation = (_export as any).validation;
      GET = (_export as any).GET ? (_export as any).GET : null;
      POST = (_export as any).POST ? (_export as any).POST : null;
      PUT = (_export as any).PUT ? (_export as any).PUT : null;
      DELETE = (_export as any).DELETE ? (_export as any).DELETE : null;
      PATCH = (_export as any).PATCH ? (_export as any).PATCH : null;
    } catch (error) {
      console.error(`Failed to import `, _export, error);
      continue;
    }
    const method: AllMethods | '' = '';
    const availableMethods: Array<AllMethods> = [];
    const methods: {
      [key in AllMethods]?: ((ctx: ctx) => Response | Promise<Response>) | null;
    } = { GET, POST, PUT, DELETE, PATCH };
    for (const [method, handler] of Object.entries(methods) as [
      AllMethods,
      (ctx: ctx) => Response | Promise<Response>
    ][]) {
      if (typeof handler === 'function') {
        availableMethods.push(method);
        endpoints.push({
          endpoint: {
            pattern,
            middlewares,
            validation,
            method,
          },
          handler,
        });
      }
    }

    endpoints.push({
      endpoint: {
        pattern,
        middlewares: [],
        validation,
        method: 'OPTIONS',
      },
      handler: (ctx) => {
        ctx.response.headers.set('Allow', availableMethods.join(', '));
        ctx.response.body = "Look header's Allow property :)";
        ctx.response.status = 200;
        return new Response(null, { status: 200 });
      },
    });
    if (!method) {
      continue;
    }
  }
}

initializeEndpoints();

export {
  endpoints,
  type MiddlewareDataArray,
  getDataFromMiddleware,
  SetResponse,
  type ValidationType,
};
