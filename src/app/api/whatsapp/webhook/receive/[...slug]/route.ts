import { NextRequest } from "next/server";
import { handleWebhook } from "../handler";

export const runtime = "nodejs";

interface RouteParams {
  params: {
    slug: string[];
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const segments = Array.isArray(params.slug) ? params.slug : [params.slug];
  return handleWebhook(request, segments);
}

