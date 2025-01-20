import { ctx } from "@/endpoints.ts";

export const pattern = new URLPattern({ pathname: "/api/whoAmI" })

export function GET(ctx: ctx): void {
  ctx.response.status = 200;
  ctx.response.body = JSON.stringify({ message: 'Hello from whoAmI GET' });
}

export function POST(ctx: ctx): void {
  ctx.response.status = 200;
  ctx.response.body = JSON.stringify({ message: 'Hello from whoAmI POST' });
}

export function PUT(ctx: ctx): void {
  ctx.response.status = 200;
  ctx.response.body = JSON.stringify({ message: 'Hello from whoAmI PUT' });
}

export function DELETE(ctx: ctx): void {
  ctx.response.status = 200;
  ctx.response.body = JSON.stringify({ message: 'Hello from whoAmI DELETE' });
}