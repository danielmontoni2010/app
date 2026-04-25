import { NextResponse } from "next/server";
import { matchOpportunityToAllGoals } from "@/lib/matching/engine";
import { createClient } from "@/lib/supabase/server";
import { sendPendingNotifications } from "@/lib/notifications/sender";

export async function POST(request: Request) {
  // Verifica se é admin via ADMIN_EMAILS (mesmo padrão do route /api/admin/opportunity)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { opportunityId } = body as { opportunityId: string };

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const result = await matchOpportunityToAllGoals(opportunityId);

  // Se gerou alertas, dispara notificações imediatamente
  let notifResult = { pushSent: 0, emailsSent: 0 };
  if (result.newAlerts > 0) {
    notifResult = await sendPendingNotifications();
  }

  return NextResponse.json({
    success: true,
    newAlerts: result.newAlerts,
    pushSent: notifResult.pushSent,
    emailsSent: notifResult.emailsSent,
    errors: result.errors,
  });
}
