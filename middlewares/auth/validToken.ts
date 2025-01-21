import { type ApplyMiddlewareParams } from '@/middlewares/applyMiddleware.ts';
import { User } from '@/db/models/Users.ts';

// Bearer af9aiasd-avlds22 -> af9aiasd-avlds22
function parseBearer(token: string) {
  if (!token) {
    return null;
  }

  if (token.split(' ')[0] === 'Bearer') {
    return token.split(' ')[1] || null;
  }
  return token.split(' ')[0] || null;
}

async function Middleware(request: ApplyMiddlewareParams) {
  let token = request.ctx.request.headers.get('Authorization');
  if (!token) {
    return {
      base: {
        responseStatus: 'end',
        status: 401,
        body: JSON.stringify({ message: 'Unauthorized.' }),
      },
      user: null,
    };
  }

  token = parseBearer(token);

  const user = await User.findOne({ token });
  if (!user) {
    return {
      base: {
        responseStatus: 'end',
        status: 404,
        body: JSON.stringify({ message: 'User not found.' }),
      },
      user: null,
    };
  }

  return {
    base: {},
    user: {
      token,
      user,
    },
  };
}

export { Middleware };
