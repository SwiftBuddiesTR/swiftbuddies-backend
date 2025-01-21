// deno-lint-ignore-file no-explicit-any
import { Context } from 'https://deno.land/x/oak@v17.1.4/mod.ts';

// All endpoint file paths should be written here
const endpointExports = [await import('./api/Users/whoAmI.ts')];

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

const endpoints: Array<{
  endpoint: {
    pattern: URLPattern;
    method: AllMethods;
  };
  handler: (ctx: ctx) => Response | Promise<Response>;
}> = [];

/*
 * Loop through all files in the current directory and subdirectories
 * to find the handler for the requested URL (just checks api folder)
 *
 * api\Users\whoAmI.ts -> ./api/Users/whoAmI.ts
 * { pattern: new URLPattern({ pathname: "/api/whoAmI" }), handler: handler }
 * IF MATCH -> handler(req)
 */
for (const _export of endpointExports) {
  let pattern: URLPattern | null = null;
  let GET: ((ctx: ctx) => Response | Promise<Response>) | null = null;
  let POST: ((ctx: ctx) => Response | Promise<Response>) | null = null;
  let PUT: ((ctx: ctx) => Response | Promise<Response>) | null = null;
  let DELETE: ((ctx: ctx) => Response | Promise<Response>) | null = null;
  let PATCH: ((ctx: ctx) => Response | Promise<Response>) | null = null;
  try {
    pattern = _export.pattern;
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
    [key in AllMethods]?: (((ctx: ctx) => Response | Promise<Response>) | null);
  } = { GET, POST, PUT, DELETE, PATCH };
  for (const [method, handler] of Object.entries(methods) as [
    AllMethods,
    (ctx: ctx) => Response | Promise<Response>
  ][]) {
    if (typeof handler === 'function') {
      availableMethods.push(method);
      endpoints.push({
        endpoint: {
          pattern: pattern,
          method,
        },
        handler,
      });
    }
  }

  endpoints.push({
    endpoint: {
      pattern: pattern,
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

export { endpoints };

/*
// deno-lint-ignore no-explicit-any
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

const cwd = Deno.cwd();
const endpoints: Array<{
  endpoint: {
    pattern: URLPattern;
    method: AllMethods;
  };
  handler: (ctx: ctx) => Response | Promise<Response>;
}> = [];

/*
 * Loop through all files in the current directory and subdirectories
 * to find the handler for the requested URL (just checks api folder)
 *
 * api\Users\whoAmI.ts -> ./api/Users/whoAmI.ts
 * { pattern: new URLPattern({ pathname: "/api/whoAmI" }), handler: handler }
 * IF MATCH -> handler(req)
 * 
for await (const walkEntry of walk(cwd)) {
  const type = walkEntry.isSymlink
    ? 'symlink'
    : walkEntry.isFile
    ? 'file'
    : 'directory';

  console.log(type, walkEntry.path);

  if (type !== 'file') {
    continue;
  }

  const path = `.${walkEntry.path.substring(cwd.length).replaceAll('\\', '/')}`;
  if (!path.startsWith('./api')) {
    continue;
  }

  // ./api/Users/whoAmI.ts -> Users/whoAmI
  // const afterAPI = path.substring(6);

  const actualPath = Deno.build.os === 'windows' 
  ? path
  : walkEntry.path;

  let pattern, GET, POST, PUT, DELETE, PATCH;
  try {
      ({ pattern, GET, POST, PUT, DELETE, PATCH } = await import(actualPath));
  } catch (error) {
    console.error(
      `Failed to import ${actualPath}`,
      error
    );
    continue;
  }
  const method: AllMethods | '' = '';
  const availableMethods: Array<AllMethods> = [];
  const methods: {
    [key in AllMethods]?: (ctx: ctx) => Response | Promise<Response>;
  } = { GET, POST, PUT, DELETE, PATCH };
  for (const [method, handler] of Object.entries(methods) as [
    AllMethods,
    (ctx: ctx) => Response | Promise<Response>
  ][]) {
    if (typeof handler === 'function') {
      availableMethods.push(method);
      endpoints.push({
        endpoint: {
          pattern: pattern,
          method,
        },
        handler,
      });
    }
  }

  endpoints.push({
    endpoint: {
      pattern: pattern,
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

export { endpoints };
*/
