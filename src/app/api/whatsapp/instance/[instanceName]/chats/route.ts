import { NextRequest, NextResponse } from "next/server";
import store, { touchStore } from "@/server/whatsappStore";

export const runtime = "nodejs";

interface RouteParams {
  params: {
    instanceName: string;
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  touchStore();

  const instanceName = decodeURIComponent(params.instanceName);
  const chats = store.getChats(instanceName);

  return NextResponse.json({
    success: true,
    instance: instanceName,
    chats,
  });
}

