import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Media retrieval is not configured in this environment.",
    },
    { status: 501 }
  );
}

