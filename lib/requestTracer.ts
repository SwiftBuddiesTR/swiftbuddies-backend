// deno-lint-ignore-file no-explicit-any
import { v4 as uuid } from 'npm:uuid';
import { Ctx } from '@/endpoints.ts';
import { createMiddleware } from 'hono/factory';

function paintfulLog(th: number, text: string) {
  let color: string;
  switch (th) {
    case 0: 
      color = '#654700';
      break;
    case 1:
      color = '#0f2e51';
      break;
    case 2:
      color = '#2a7c38';
      break;
    case 4:
      color = '#b200b1';
      break;
    default:
      // random hex color
      color = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  console.log(`%c${text}`, `background-color: ${color}; color: white;`,);
}

const traces: {
  [key: string]: {
    initTime: number;
    traceId: string;
    traces: {
      name: string;
      bullets?: string[];
      startMS: number;
      durationMS: number;
    }[];
  };
} = {};

function initTrace(ctx: Ctx) {
  const traceId = uuid();
  ctx.res.headers.set('traceId', traceId);
  traces[traceId] = {
    initTime: Date.now(),
    traceId,
    traces: [],
  };
}

function getTrace(ctx: Ctx) {
  const traceId = ctx.res.headers.get('traceId');

  if (!traceId) {
    console.warn('[getTrace] traceId is not set');
    return;
  }

  return traces[traceId];
}

function startTrace(ctx: Ctx, name: string) {
  const traceId = ctx.res.headers.get('traceId');

  if (!traceId) {
    console.warn('[startTrace] traceId is not set');
    return;
  }

  traces[traceId].traces.push({
    name,
    startMS: Date.now(),
    durationMS: -1,
    bullets: [],
  });
}

function endTrace(ctx: Ctx, name: string) {
  const traceId = ctx.res.headers.get('traceId');

  if (!traceId) {
    console.warn('[endTrace] traceId is not set');
    return;
  }

  const trace = traces[traceId].traces.find((trace) => trace.name === name);

  if (!trace) {
    console.warn('[endTrace] trace not found');
    return;
  }

  trace.durationMS = Date.now() - trace.startMS;
}

function getLastTraceName(ctx: Ctx) {
  const traceId = ctx.res.headers.get('traceId');

  if (!traceId) {
    console.warn('[getLastTraceName] traceId is not set');
    return;
  }

  const trace = traces[traceId].traces[traces[traceId].traces.length - 1];

  return trace.name;
}

function addBullet(ctx: Ctx, name: string, bullet: string) {
  const traceId = ctx.res.headers.get('traceId');

  if (!traceId) {
    console.warn('[addBullet] traceId is not set');
    return;
  }

  const trace = traces[traceId].traces.find((trace) => trace.name === name);

  if (!trace) {
    console.warn('[addBullet] trace not found');
    return;
  }

  trace.bullets?.push(bullet);
}

function addBulletToLastTrace(ctx: Ctx, bullet: string) {
  const lastTrace = getLastTraceName(ctx);

  if (!lastTrace) {
    console.warn('[addBulletToLastTrace] lastTrace is not set');
    return;
  }

  addBullet(ctx, lastTrace, bullet);
}

function setMiddleware(
  title: string,
  p0: (ctx: any, next: any) => Promise<void> | void
) {
  return createMiddleware(async (ctx, next) => {
    startTrace(ctx, title);
    await p0(ctx, next);
    endTrace(ctx, title);
  });
}

function printTrace(ctx: Ctx) {
  const trace = getTrace(ctx);

  if (trace?.traces) {
    const url = new URL(ctx.req.url);
    const statusCode = ctx.res.status;
    const ms = Date.now() - trace.initTime;
    console.group(`${ctx.req.method} - ${url.pathname}`)
    paintfulLog(0,
      `${ctx.req.method} - ${url.pathname} - ${statusCode} - ${ms}ms`
    );

    let additional = 0;
    for (let i = 0; i < trace.traces.length; i++) {
      const traceData = trace.traces[i];
      paintfulLog(i,
        `${' '.repeat(i + 1 + additional)}\\- trace: ${traceData.name} | ~${
          traceData.durationMS
        }ms`
      );
      if (traceData.bullets) {
        for (let j = 0; j < traceData.bullets.length; j++) {
          paintfulLog(i,
            `${' '.repeat(i + 4 + additional)}\\- * ${traceData.bullets[j]}`
          );
          additional++;
        }
      }
    }

    console.groupEnd();
  }
}

export {
  initTrace,
  startTrace,
  endTrace,
  setMiddleware,
  getTrace,
  printTrace,
  addBullet,
  addBulletToLastTrace,
};
