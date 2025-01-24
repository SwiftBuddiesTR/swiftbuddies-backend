import { connect, dbStateMiddleware } from './db/mongodb.ts';
import { Ctx, getEndpoints } from './endpoints.ts';
import { applyMiddleware } from '@/middlewares/applyMiddleware.ts';
import { Hono } from 'hono';
import { H } from 'hono/types';
import { Middleware as auth_validToken } from '@/middlewares/auth/validToken.ts';
import { endTrace, initTrace, printTrace, startTrace } from '@/lib/requestTracer.ts';
import { setMiddleware } from '@/lib/requestTracer.ts';

async function main() {
  const endpoints = await getEndpoints();

  // async, so we can wait for the connection to be established
  connect();

  const app = new Hono();
  const v1 = new Hono();

  v1.use(async (c: Ctx, next) => {
    initTrace(c);
    await next();
    printTrace(c);
  });

  v1.use(async (c: Ctx, next) => {
    const res = await dbStateMiddleware(c, next);
    return res;
  });

  for (const endpoint of endpoints) {
    const handler = endpoint.handler;
    const { path, middlewares, method, validation } = endpoint.endpoint;

    // deno-lint-ignore no-explicit-any
    const options = (path: string, ...handlers: H<any, any, any, any>[]) =>
      v1.on('OPTIONS', path, ...handlers);

    type MethodHandler = (path: string, ...handlers: H[]) => Hono;
    const methods: Record<string, MethodHandler> = {
      GET: v1.get.bind(v1),
      POST: v1.post.bind(v1),
      PUT: v1.put.bind(v1),
      DELETE: v1.delete.bind(v1),
      PATCH: v1.patch.bind(v1),
      OPTIONS: options,
    };

    if (!(method in methods)) {
      console.warn(`Method ${method} not found`);
      continue;
    }

    const steps: H[] = [];

    const middlewareList = [...(middlewares ?? []), 'dataValidation'];
    for (const middleware of middlewareList) {
      if (middleware === 'auth:validToken') {
        steps.push(auth_validToken);
        continue;
      }

      const middlewareF = setMiddleware(middleware, async (c, next) => {
        const middlewareData = await applyMiddleware({
          ctx: c,
          middleware,
          endpoint: {
            path,
            middlewares,
            validation,
            method,
          },
        });

        if (middlewareData.base.responseStatus === 'end') {
          c.status(middlewareData.base.status);
          const res = c.json(middlewareData.base.body);
          return res;
        }

        if (!c.get(middleware)) {
          c.set(middleware, {
            middleware: middleware,
            base: {},
            user: middlewareData.user,
          });
        }
        await next();
      });
      steps.push(middlewareF);
    }

    methods[method as keyof typeof methods](path, ...steps, async (c: Ctx) => {
      startTrace(c, `${method} ${path}`);
      const res = await handler(c, []);
      endTrace(c, `${method} ${path}`);
      return res;
    });
  }

  app.route('/', v1);

  await Deno.serve(app.fetch);
}

await main();
