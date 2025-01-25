import {
  type Ctx,
  ValidationType,
} from '@/endpoints.ts';
import { z } from 'npm:zod';
import { shouldBeUserId } from '@/lib/userIdCheck.ts';
import { OpenAPIDoc } from "@/lib/openAPI.types.ts";

export async function GET(ctx: Ctx) {
  const requestData = ctx.get('dataValidation').user
  const query: QueryType = requestData.query;
  const body: BodyType = requestData.body;

  // middleware converts userId to User
  const _targetUser = query.userId;
  const _name: string = query.name;
  const _log: string = body.log;

  return await ctx.json({message: 'ok'}, 200);
}

// Configurations
// ! REQUIRED CONFIGURATION BELOW
export const path = '/api/ENDPOINT';
// ! REQUIRED Endpoint path implementation
// * Don't forget to add filepath to endpoints.ts's loadEndpoints function's return array.
// * Because Deno Deploy don't allow dynamic imports cause of security reasons.
////                                                                                       ////

// OPTIONAL CONFIGURATIONS BELOW
export const middlewares = ['auth:validToken'];

export const validation: ValidationType = {
  query: {
    name: z.string().min(1),
    userId: shouldBeUserId,
  },
  body: z.object({
    log: z.string().min(1),
  })
};
const querySchema = z.object(validation.query as z.ZodRawShape);
type QueryType = z.infer<typeof querySchema>;
type BodyType = z.infer<typeof validation.body>;

export const openAPI: OpenAPIDoc = {
  description: 'Description of the endpoint',
  tags: ['Folder Name'],
  responses: {
    200: {
      type: 'application/json',
      zodSchema: z.object({
        isError: z.boolean(),
        message: z.string().optional(),
      }),
    },
  },
}