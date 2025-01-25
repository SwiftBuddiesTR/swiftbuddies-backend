import mongoose from 'npm:mongoose';
import { loop } from '@/lib/loop.ts';
import { Ctx } from '@/endpoints.ts';
import { type StatusCode } from 'npm:hono/utils/http-status';
import { endTrace, startTrace } from "@/lib/requestTracer.ts";

let MONGODB_URL = Deno.env.get('MONGODB_URL');

if (!MONGODB_URL && typeof MONGODB_URL !== 'string') {
  console.log(
    'Please define the MONGODB_URL environment variable inside .env.local'
  );
  // throw new Error(
  //   'Please define the MONGODB_URL environment variable inside .env.local'
  // );
}

let client: mongoose.Mongoose | null = null;
let startTime: number | null = null;
let state = 'not-started';

async function connect() {
  const stop = loop('Connecting to MongoDB...');

  state = 'connecting';
  // console.log('Connecting to MongoDB...');
  if (!startTime) {
    startTime = Date.now();
  }

  if (!MONGODB_URL && typeof MONGODB_URL !== 'string') {
    console.log('MongoDB seems to be not readed from .env.local, retrying...');
    MONGODB_URL = Deno.env.get('MONGODB_URL');
    
    if (!MONGODB_URL && typeof MONGODB_URL !== 'string') {
      console.log('MongoDB still not readed from .env.local.');
    } else {
      console.log('MongoDB readed from .env.local, retrying connect to db right now...');
    }
  }
  
  client;

  try {
    client = await mongoose.connect((MONGODB_URL as string) || '');
  } catch (err) {
    state = 'failed';
    stop();
    console.error('✗ MongoDB connection error', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connect, 5000);
    return;
  }

  if (!client) {
    state = 'failed';
    stop();
    throw new Error('MongoDB connection failed');
  }

  state = 'connected';
  stop();
  console.log(
    `✓ MongoDB connected ${
      startTime
        ? `(took ${Math.floor((Date.now() - startTime) / 1000)} seconds)`
        : ''
    }`
  );
}

type DBState = 'not-started' | 'connecting' | 'failed' | 'connected';

const dbStateMiddleware = async (ctx: Ctx, next: () => void) => {
  startTrace(ctx, 'Database state middleware');
  const DB_Responses: Record<DBState, { body: string; status: number }> = {
    'not-started': {
      body: 'Database connection not started',
      status: 500,
    },
    connecting: {
      body: `Database connection in progress ${
        startTime
          ? `(${Math.floor((Date.now() - startTime) / 1000)} seconds passed)`
          : ''
      }`,
      status: 500,
    },
    failed: {
      body: 'Database connection failed',
      status: 500,
    },
    connected: {
      body: '',
      status: 0,
    },
  };

  if (state !== 'connected') {
    ctx.status(DB_Responses[state as DBState].status as StatusCode);
    endTrace(ctx, 'Database state middleware');
    return await ctx.body(DB_Responses[state as DBState].body);;
  }

  endTrace(ctx, 'Database state middleware');
  return await next();
};

export { client as default, connect, dbStateMiddleware };
