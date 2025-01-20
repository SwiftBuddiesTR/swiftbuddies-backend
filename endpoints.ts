import { walk } from 'https://deno.land/std@0.170.0/fs/walk.ts';
import { Context } from 'https://deno.land/x/oak@v17.1.4/mod.ts';

// deno-lint-ignore no-explicit-any
export type ctx = Context<Record<string, any>, Record<string, any>>;

type AllMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE';

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
   */
for await (const walkEntry of walk(cwd)) {
  const type = walkEntry.isSymlink
    ? 'symlink'
    : walkEntry.isFile
    ? 'file'
    : 'directory';

  if (type !== 'file') {
    continue;
  }

  const path = `.${walkEntry.path.substring(cwd.length).replaceAll('\\', '/')}`;
  if (!path.startsWith('./api')) {
    continue;
  }

  const { pattern, GET, POST, PUT, DELETE, PATCH } = await import(path);
  const method: AllMethods | '' = '';
  const availableMethods: Array<AllMethods> = [];
  const methods: { [key in AllMethods]?: (ctx: ctx) => Response | Promise<Response> } = { GET, POST, PUT, DELETE, PATCH };
  for (const [method, handler] of Object.entries(methods) as [AllMethods, (ctx: ctx) => Response | Promise<Response>][]) {
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
      ctx.response.body = 'Look header\'s Allow property :)';
      ctx.response.status = 200;
      return new Response(null, { status: 200 });
    },
  });
  if (!method) {
    continue;
  }
}

export { endpoints };
