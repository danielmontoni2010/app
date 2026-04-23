import { NextResponse } from "next/server";
import { runMatchingEngine } from "@/lib/matching/engine";
import { sendPendingNotifications } from "@/lib/notifications/sender";

// Proteção por token secreto (chame com header Authorization: Bearer <token>)
// Na Vercel, configure CRON_SECRET nas env vars e use Vercel Cron Jobs
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  // Valida token de autorização
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const matchResult = await runMatchingEngine();

    // Se gerou novos alertas, dispara notificações imediatamente
    let notifResult = { pushSent: 0, emailsSent: 0 };
    if (matchResult.newAlerts > 0) {
      notifResult = await sendPendingNotifications();
    }

    return NextResponse.json({
      success: true,
      checked: matchResult.checked,
      newAlerts: matchResult.newAlerts,
      pushSent: notifResult.pushSent,
      emailsSent: notifResult.emailsSent,
      errors: matchResult.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[matching/run] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Vercel Cron Job — roda automaticamente
// Configurar em vercel.json: { "crons": [{ "path": "/api/matching/run", "schedule": "*/15 * * * *" }] }
export async function GET(request: Request) {
  return POST(request);
}
