import { type Ctx, StatusCode, ValidationType } from '@/endpoints.ts';
import { z } from 'npm:zod';
import { OpenAPIDoc } from '@/lib/openAPI.types.ts';
import { Buffer } from 'node:buffer';
import { createNewUserIfNeeded, registerParams } from '@/db/models/Users.ts';

async function getDataFromGoogle(accessToken: string) {
  const url = new URL('https://www.googleapis.com/oauth2/v3/userinfo');
  url.searchParams.append('access_token', accessToken);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return {
      isError: true,
      status: 502,
      message: 'Failed to get user data from Google',
    };
  }

  const data = await response.json();
  return {
    isError: false,
    data,
  };
}

function parseJwt(token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

function getDataFromApple(accessToken: string) {
  const JWT = accessToken;
  const decoded = parseJwt(JWT);

  const email = decoded.email;

  if (!email) {
    return {
      isError: true,
      status: 400,
      message: 'Failed to get email from Apple.',
    };
  }
  const beforeAt = email.split('@')[0];
  if (!beforeAt || beforeAt.length < 1) {
    return {
      isError: true,
      status: 400,
      message: 'Invalid email from Apple.',
    };
  }

  const name = beforeAt;
  const picture = '';

  return {
    isError: false,
    data: {
      email,
      name,
      picture,
    },
  };
}

export async function POST(ctx: Ctx) {
  const requestData = ctx.get('dataValidation').user;
  const body: BodyType = requestData.body;

  const registerType: 'google' | 'apple' = body.registerType;
  const accessToken = body.accessToken;

  const data = await {
    google: getDataFromGoogle,
    apple: getDataFromApple,
  }[registerType](accessToken);

  if (data.isError) {
    return await ctx.json(
      { message: data.message },
      data.status as StatusCode
    );
  }

  const requiredData: registerParams = {
    registerType,
    email: data.data.email,
    name: data.data.name,
    picture: data.data.picture,
  };

  const { token, type } = await createNewUserIfNeeded(ctx, requiredData);

  return await ctx.json(
    {
      token,
      type,
    },
    200
  );
}

export const path = '/api/register';

export const validation: ValidationType = {
  body: z.object({
    registerType: z
      .string()
      .refine(
        (v) => ['apple', 'google'].includes(v),
        'Invalid registerType, must be "apple" or "google"'
      ),
    accessToken: z.string(),
  }),
};
type BodyType = z.infer<typeof validation.body>;

export const openAPI: OpenAPIDoc = {
  description: 'Register the user',
  tags: ['User'],
  responses: {
    200: {
      type: 'application/json',
      zodSchema: z.object({
        token: z.string(),
        type: z.string(),
      }),
    },
    400: {
      type: 'application/json',
      zodSchema: z.object({
        message: z.string(),
      }),
    },
    502: {
      type: 'application/json',
      zodSchema: z.object({
        message: z.string(),
      }),
    },
  },
};
