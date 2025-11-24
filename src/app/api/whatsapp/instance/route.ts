import { NextResponse } from "next/server";
import store, { touchStore } from "@/server/whatsappStore";

export const runtime = "nodejs";

function buildInstanceResponse(instance?: ReturnType<typeof store.getDefaultInstance>) {
  if (!instance) {
    return null;
  }

  return {
    id: instance.instanceName,
    instance_id: instance.instanceName,
    instance_name: instance.instanceName,
    instanceName: instance.instanceName,
    status: instance.status,
    qrcode: instance.qrcode ?? null,
    meta: instance.meta ?? {},
  };
}

export async function GET() {
  touchStore();

  const defaultInstance = store.getDefaultInstance();

  if (!defaultInstance) {
    return NextResponse.json({
      success: true,
      exists: false,
      instance: null,
    });
  }

  return NextResponse.json({
    success: true,
    exists: true,
    instance: buildInstanceResponse(defaultInstance),
  });
}

