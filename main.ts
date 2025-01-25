import { connect, dbStateMiddleware } from './db/mongodb.ts';
import { Ctx, getEndpoints } from './endpoints.ts';
import { applyMiddleware } from '@/middlewares/applyMiddleware.ts';
import { H } from 'hono/types';
import { Middleware as auth_validToken } from '@/middlewares/auth/validToken.ts';
import {
  endTrace,
  initTrace,
  printTrace,
  startTrace,
} from '@/lib/requestTracer.ts';
import { setMiddleware } from '@/lib/requestTracer.ts';
import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import * as Sentry from 'npm:@sentry/node';
import { OpenAPIHono } from 'npm:@hono/zod-openapi';
import { apiReference } from 'npm:@scalar/hono-api-reference';
import * as v from 'npm:valibot';
import { openAPISpecs } from 'npm:hono-openapi';
import { addOpenAPIEndpoint, initOpenAPI, openAPI } from '@/lib/openAPI.ts';
import {
  OpenAPIMethods,
  type AddOpenAPIEndpointParams,
} from '@/lib/openAPI.types.ts';
import { serveStatic } from 'npm:@hono/node-server/serve-static'

config({ export: true, path: '.env.local' });

async function main() {
  const endpoints = await getEndpoints();

  // async, so we can wait for the connection to be established
  connect();

  const app = new OpenAPIHono();
  // const v1 = new OpenAPIHono();

  app.use('/public/*', serveStatic({ root: './' }))

  // cors
  app.use(async (c: Ctx, next) => {
    c.res.headers.set('Access-Control-Allow-Origin', '*');
    c.res.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    c.res.headers.set(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    await next();
  });

  initOpenAPI({
    title: 'SwiftBuddies API',
    description: 'API for SwiftBuddies',
    servers: [
      {
        url: 'https://swiftbuddies.deno.dev',
        description: 'Production Server',
      },
      { url: 'http://localhost:3000', description: 'Local Server' },
    ],
    excludeMethods: ['options'],
  });

  Sentry.init({
    dsn: Deno.env.get('SENTRY_DSN'),
    tracesSampleRate: 1.0,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/swiftbuddies.deno\.dev\/api/,
    ],
  });

  app.onError(async (err: Error, c) => {
    console.error(err);
    Sentry.captureException(err);
    c.status(500);
    return await c.json({ error: err.message });
  });

  app.use(async (c: Ctx, next) => {
    initTrace(c);
    await next();
    printTrace(c);
  });

  app.use('/api/*', async (c: Ctx, next) => {
    const res = await dbStateMiddleware(c, next);
    return res;
  });

  for (const endpoint of endpoints) {
    const handler = endpoint.handler;
    const { path, middlewares, method, validation, openAPI } =
      endpoint.endpoint;

    // deno-lint-ignore no-explicit-any
    const options = (path: string, ...handlers: H<any, any, any, any>[]) =>
      app.on('OPTIONS', path, ...handlers);

    // deno-lint-ignore no-explicit-any
    const methods: Record<string, any> = {
      GET: app.get.bind(app),
      POST: app.post.bind(app),
      PUT: app.put.bind(app),
      DELETE: app.delete.bind(app),
      PATCH: app.patch.bind(app),
      OPTIONS: options,
    };

    if (!(method in methods)) {
      console.warn(`Method ${method} not found`);
      continue;
    }

    const steps: H[] = [];

    const apiDoc: AddOpenAPIEndpointParams = {
      path: path,
      method: method.toLocaleLowerCase() as OpenAPIMethods,
      description: openAPI?.description ?? '',
      inputs: validation,
      responses: openAPI?.responses ?? {},
      tags: openAPI?.tags,
    };

    addOpenAPIEndpoint(apiDoc);

    const middlewareList = [
      ...(openAPI ? [openAPI] : []),
      ...(middlewares ?? []),
      'dataValidation',
    ];
    for (const middleware of middlewareList) {
      if (middleware === 'auth:validToken') {
        steps.push(auth_validToken);
        continue;
      }

      if (typeof middleware === 'string') {
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
    }

    methods[method as keyof typeof methods](path, ...steps, async (c: Ctx) => {
      startTrace(c, `${method} ${path}`);
      const res = await handler(c, []);
      endTrace(c, `${method} ${path}`);
      return res;
    });
  }

  app.get(
    '/openapi',
    openAPISpecs(app, {
      documentation: {
        info: {
          title: 'Hono API',
          version: '1.0.0',
          description: 'Greeting API',
        },
        servers: [
          { url: 'http://localhost:3000', description: 'Local Server' },
        ],
      },
    })
  );

  app.get('/opendocs', (c) => {
    return c.json(openAPI, 200);
  });

  app.get(
    '/docs',
    apiReference({
      theme: 'saturn',
      spec: { url: '/opendocs' },
      favicon: '/public/favicon.ico',
      pageTitle: 'SwiftBuddies API Docs',
    })
  );

  await Deno.serve(app.fetch);
}

await main();
