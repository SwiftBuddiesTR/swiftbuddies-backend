import { getUserByToken } from '@/db/models/Users.ts';
import { Ctx } from '@/endpoints.ts';
import { bearerAuth } from 'hono/bearer-auth';
import { endTrace, startTrace } from "@/lib/requestTracer.ts";

const Middleware = bearerAuth({
  verifyToken: async (token: string, c: Ctx) => {
    startTrace(c, 'auth:validToken');
    if (!token) {
      endTrace(c, 'auth:validToken');
      return false;
    }

    const user = await getUserByToken(c, token);
    if (!user) {
      endTrace(c, 'auth:validToken');
      return false;
    }

    c.set('auth:validToken', {
      base: {},
      user: {
        token,
        user,
      },
    });

    endTrace(c, 'auth:validToken');
    return true;
  },
});

export { Middleware };
