import { NextRequest } from "next/server";
import { handleWebhook } from "../handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleWebhook(request, ["messages-upsert"]);
}

