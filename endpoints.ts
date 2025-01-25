// deno-lint-ignore-file no-explicit-any
import { z } from 'npm:zod';
import { Context, MiddlewareHandler } from 'hono';
import { describeRoute, DescribeRouteOptions } from 'npm:hono-openapi';
import * as v from 'npm:valibot';
import { createRoute } from 'npm:@hono/zod-openapi';
import { OpenAPIDoc } from '@/lib/openAPI.types.ts';

async function loadEndpoints() {
  return [
    await import('./api/Users/whoAmI.ts'),
    await import('./api/Users/getUserInfo.ts'),
  ];
}

export type Ctx = Context<any>;

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
  query:
    | {
        [key: string]: z.ZodType<any, any, any> | string | undefined;
      }
    | undefined;
  body?: z.infer<any> | undefined;
};

function getDataFromMiddleware(
  middlewareDatas: MiddlewareDataArray,
  middleware: string
): { isFound: boolean; [key: string]: any } {
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

const endpoints: Array<{
  endpoint: {
    path: string;
    middlewares: string[] | undefined;
    validation: ValidationType;
    method: AllMethods;
    openAPI: OpenAPIDoc | null;
  };
  handler: (
    ctx: Ctx,
    middlewareDatas: MiddlewareDataArray
  ) => Response | Promise<Response>;
}> = [];

async function initializeEndpoints() {
  const endpointExports = await loadEndpoints();

  for (const _export of endpointExports) {
    let path: string | null = null;
    let middlewares: string[] | undefined = [];
    let validation: ValidationType = { query: {}, body: undefined };
    let openAPI: OpenAPIDoc | null = null;
    let GET: ((ctx: Ctx) => Response | Promise<Response>) | null = null;
    let POST: ((ctx: Ctx) => Response | Promise<Response>) | null = null;
    let PUT: ((ctx: Ctx) => Response | Promise<Response>) | null = null;
    let DELETE: ((ctx: Ctx) => Response | Promise<Response>) | null = null;
    let PATCH: ((ctx: Ctx) => Response | Promise<Response>) | null = null;
    try {
      path = _export.path;
      middlewares = (_export as any).middlewares;
      validation = (_export as any).validation;
      openAPI = (_export as any).openAPI ? (_export as any).openAPI : null;
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
      [key in AllMethods]?: ((ctx: Ctx) => Response | Promise<Response>) | null;
    } = { GET, POST, PUT, DELETE, PATCH };
    for (const [method, handler] of Object.entries(methods) as [
      AllMethods,
      (ctx: Ctx) => Response | Promise<Response>
    ][]) {
      if (typeof handler === 'function') {
        availableMethods.push(method);
        endpoints.push({
          endpoint: {
            openAPI,
            path,
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
        openAPI: {
          description: `Get the available methods for this endpoint`,
          tags: openAPI?.tags,
          responses: {
            '200': {
              type: 'plain/text',
              zodSchema: z.string(),
            },
          },
        },
        path,
        middlewares: [],
        validation,
        method: 'OPTIONS',
      },
      handler: async (ctx: Ctx) => {
        await ctx.res.headers.append('Allow', availableMethods.join(', '));
        await ctx.status(200);
        return await ctx.text("Look header's Allow property :)");
      },
    });
    if (!method) {
      continue;
    }
  }
}

async function getEndpoints() {
  await initializeEndpoints();
  return endpoints;
}

export {
  type MiddlewareDataArray,
  getDataFromMiddleware,
  type ValidationType,
  getEndpoints,
};
