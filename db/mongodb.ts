import mongoose from 'npm:mongoose';
import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { Middleware } from 'https://deno.land/x/oak@v17.1.4/middleware.ts';

config({ export: true, path: '.env.local' });

const MONGODB_URL = Deno.env.get('MONGODB_URL');

if (!MONGODB_URL && typeof MONGODB_URL !== 'string') {
  console.log(
    'Please define the MONGODB_URL environment variable inside .env.local'
  );
  // throw new Error(
  //   'Please define the MONGODB_URL environment variable inside .env.local'
  // );
}

let client: mongoose.Mongoose | null = null;
let state = 'not-started';

async function connect() {
  state = 'connecting';
  console.log('Connecting to MongoDB...');
  client = await mongoose.connect((MONGODB_URL as string) || '');

  if (!client) {
    state = 'failed';
    throw new Error('MongoDB connection failed');
  }

  state = 'connected';
  console.log('MongoDB connected');
}

type DBState = 'not-started' | 'connecting' | 'failed' | 'connected';

const stateMiddleware: Middleware = (ctx, next) => {
  const DB_Responses: Record<DBState, { body: string; status: number }> = {
    'not-started': {
      body: 'Database connection not started',
      status: 500,
    },
    connecting: {
      body: 'Database connection in progress',
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
    ctx.response.status = DB_Responses[state as DBState].status;
    ctx.response.body = DB_Responses[state as DBState].body;
    return;
  }

  return next();
};

export { client as default, connect, stateMiddleware };
