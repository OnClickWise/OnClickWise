import { NextRequest, NextResponse } from "next/server";
import store, { touchStore } from "@/server/whatsappStore";

export const runtime = "nodejs";

interface RouteParams {
  params: {
    instanceName: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  touchStore();

  const instanceName = decodeURIComponent(params.instanceName);
  const url = new URL(request.url);

  const remoteJid = url.searchParams.get("remoteJid");
  if (!remoteJid) {
    return NextResponse.json(
      {
        success: false,
        error: "remoteJid query param is required",
      },
      { status: 400 }
    );
  }

  const limitParam = url.searchParams.get("limit");
  const orderParam = url.searchParams.get("order");
  const beforeTimestampParam = url.searchParams.get("beforeTimestamp");

  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const beforeTimestamp = beforeTimestampParam ? Number.parseInt(beforeTimestampParam, 10) : undefined;
  const order = orderParam && orderParam.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const messages = store.getMessages(instanceName, remoteJid, {
    limit,
    order,
    beforeTimestamp,
  });

  return NextResponse.json({
    success: true,
    instance: instanceName,
    remoteJid,
    messages,
  });
}

