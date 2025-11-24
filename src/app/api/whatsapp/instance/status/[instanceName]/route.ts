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
  const info = store.getInstanceInfo(instanceName);

  if (!info) {
    return NextResponse.json(
      {
        success: false,
        error: "Instance not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    instance: {
      instanceName: info.instanceName,
      state: info.status,
      status: info.status,
      meta: info.meta ?? {},
    },
  });
}

