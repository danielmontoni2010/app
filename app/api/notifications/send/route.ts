import { NextResponse } from "next/server";
import { sendPendingNotifications } from "@/lib/notifications/sender";

const CRON_SECRET = process.env.CRON_SECRET;

async function handle(request: Request) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sendPendingNotifications();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[notifications/send] Error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
