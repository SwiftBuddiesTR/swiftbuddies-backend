import { connect, stateMiddleware } from './db/mongodb.ts';
import { endpoints } from './endpoints.ts';
import {
  Application,
  isHttpError,
} from 'https://deno.land/x/oak@v17.1.4/mod.ts';

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

app.use((_ctx) => {
  for (const { endpoint, handler } of endpoints) {
    if (
      endpoint.pattern.test(_ctx.request.url) &&
      _ctx.request.method === endpoint.method
    ) {
      return handler(_ctx);
    }
  }
  _ctx.response.status = 501;
  _ctx.response.body = 'Method not implemented';
});

await app.listen({ port: 8000 });
