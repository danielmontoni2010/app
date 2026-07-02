import { NextResponse } from "next/server";
import { sendPendingNotifications, sendBroadcastPush } from "@/lib/notifications/sender";
import { createAdminClient } from "@/lib/supabase/server";

const CRON_SECRET = process.env.CRON_SECRET;

// Broadcast: envia push de oportunidades recentes que ainda não foram enviadas
async function broadcastRecentes(): Promise<number> {
  const supabase = createAdminClient();

  // Oportunidades criadas nas últimas 2h que ainda estão ativas
  const desde = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opps } = await (supabase as any)
    .from("opportunities")
    .select("id")
    .eq("active", true)
    .gte("created_at", desde);

  if (!opps?.length) return 0;

  // Quais já foram enviadas como broadcast?
  const { data: logs } = await supabase
    .from("notifications_log")
    .select("status")
    .eq("channel", "push")
    .like("status", "broadcast:%");

  const jaEnviadas = new Set((logs ?? []).map((l: { status: string }) => l.status.replace("broadcast:", "")));

  let total = 0;
  for (const opp of opps) {
    if (jaEnviadas.has(opp.id)) continue;
    const sent = await sendBroadcastPush(opp.id);
    total += sent;
  }
  return total;
}

// Desativa oportunidades com valid_until expirado
async function desativarExpiradas() {
  const supabase = createAdminClient();
  const agora = new Date().toISOString();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ active: false } as never)
    .eq("active", true)
    .lt("valid_until", agora)
    .select("id");

  if (!error && data?.length) {
    console.log(`[cron] 🗑️ ${data.length} oportunidade(s) expirada(s) desativada(s)`);
  }
  return data?.length ?? 0;
}

async function handle(request: Request) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const [expiradas, broadcast] = await Promise.all([
      desativarExpiradas(),
      broadcastRecentes(),
    ]);
    const result = await sendPendingNotifications();
    return NextResponse.json({
      success: true,
      ...result,
      expiradas,
      broadcast,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[notifications/send] Error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
