import { connect, stateMiddleware } from './db/mongodb.ts';
import { endpoints } from './endpoints.ts';
import {
  Application,
  isHttpError,
} from 'https://deno.land/x/oak@v17.1.4/mod.ts';
import { applyMiddleware } from '@/middlewares/applyMiddleware.ts';

// async, so we can wait for the connection to be established
connect();

const app = new Application();

app.use(async (ctx, next) => {
  try {
    await next();
    // deno-lint-ignore no-explicit-any
  } catch (err: Error | any) {
    if (isHttpError(err)) {
      ctx.response.status = err.status;
    } else {
      ctx.response.status = 500;
    }
    ctx.response.body = { error: err.message };
    ctx.response.type = 'json';

    const url = new URL(ctx.request.url);
    console.error({
      url: url.pathname,
      method: ctx.request.method,
      error: err,
    });
  }
});

app.use(async (_ctx, next) => {
  console.log(`${_ctx.request.method} ${_ctx.request.url}`);
  await next();
});

app.use(stateMiddleware);

app.use(async (_ctx) => {
  for (const { endpoint, handler } of endpoints) {
    if (
      endpoint.pattern.test(_ctx.request.url) &&
      _ctx.request.method === endpoint.method
    ) {
      const middlewareDatas = [];
      for (const middleware of endpoint.middlewares || []) {
        const middlewareData = await applyMiddleware({ ctx: _ctx, middleware, endpoint });

        if (middlewareData.base.responseStatus === 'end') {
          _ctx.response.status = middlewareData.base.status ? middlewareData.base.status : 500;
          _ctx.response.body = middlewareData.base.body ? middlewareData.base.body : 'Internal Server Error';
          _ctx.response.headers = middlewareData.base.headers ? middlewareData.base.headers : _ctx.response.headers;
          _ctx.response.type = middlewareData.base.type ? middlewareData.base.type : 'json';
          return;
        }

        middlewareDatas.push({
          middleware: middleware,
          base: {},
          user: middlewareData.user,
        });
      }
      return handler(_ctx, middlewareDatas);
    }
  }
  _ctx.response.status = 501;
  _ctx.response.body = 'Method not implemented';
});

await app.listen({ port: 8000 });
