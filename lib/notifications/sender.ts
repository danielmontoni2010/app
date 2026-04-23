import { createAdminClient } from "@/lib/supabase/server";
import { sendPushNotification } from "./push";
import { sendAlertEmail, AlertEmailData } from "./email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stmradar.com.br";

const MAX_PUSH_PER_DAY = 5;
const MAX_EMAIL_PER_DAY = 1;

// Início do dia atual em UTC
function startOfToday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

interface AlertItem {
  alertId: string;
  opportunityId: string;
  opportunityTitle: string;
  program: string | null;
  type: string;
  bonusPercentage: number | null;
  origin: string | null;
  destination: string | null;
  milesAmount: number | null;
  validUntil: string | null;
  availableFrom: string | null;
  availableTo: string | null;
  isVip: boolean;
  notifiedPush: boolean;
  notifiedEmail: boolean;
}

interface UserAlertGroup {
  userId: string;
  email: string;
  name: string;
  notifyPush: boolean;
  notifyEmail: boolean;
  onesignalPlayerId: string | null;
  plan: string;
  alerts: AlertItem[];
}

export interface SendResult {
  usersProcessed: number;
  pushSent: number;
  emailsSent: number;
  errors: string[];
}

export async function sendPendingNotifications(): Promise<SendResult> {
  const supabase = createAdminClient();
  const result: SendResult = { usersProcessed: 0, pushSent: 0, emailsSent: 0, errors: [] };
  const todayStart = startOfToday();

  // 1. Busca alertas pendentes de notificação com dados das oportunidades e perfis
  const { data: pendingAlerts, error: alertsError } = await supabase
    .from("alerts")
    .select(`
      id,
      user_id,
      opportunity_id,
      notified_push,
      notified_email,
      opportunities (
        id, title, type, program, bonus_percentage,
        origin, destination, miles_amount,
        valid_until, available_from, available_to, is_vip
      ),
      profiles (
        id, name, email, notify_push, notify_email,
        onesignal_player_id, plan
      )
    `)
    .or("notified_push.eq.false,notified_email.eq.false");

  if (alertsError) {
    result.errors.push(`Erro ao buscar alertas: ${alertsError.message}`);
    return result;
  }

  if (!pendingAlerts?.length) return result;

  // 2. Agrupa por usuário
  const userMap = new Map<string, UserAlertGroup>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const alert of pendingAlerts as any[]) {
    const profile = alert.profiles;
    const opp = alert.opportunities;
    if (!profile || !opp) continue;

    if (!userMap.has(alert.user_id)) {
      userMap.set(alert.user_id, {
        userId: alert.user_id,
        email: profile.email,
        name: profile.name,
        notifyPush: profile.notify_push,
        notifyEmail: profile.notify_email,
        onesignalPlayerId: profile.onesignal_player_id,
        plan: profile.plan,
        alerts: [],
      });
    }

    userMap.get(alert.user_id)!.alerts.push({
      alertId: alert.id,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      program: opp.program,
      type: opp.type,
      bonusPercentage: opp.bonus_percentage,
      origin: opp.origin,
      destination: opp.destination,
      milesAmount: opp.miles_amount,
      validUntil: opp.valid_until,
      availableFrom: opp.available_from,
      availableTo: opp.available_to,
      isVip: opp.is_vip,
      notifiedPush: alert.notified_push,
      notifiedEmail: alert.notified_email,
    });
  }

  // 3. Processa cada usuário
  for (const [userId, userGroup] of Array.from(userMap)) {
    result.usersProcessed++;

    // Conta notificações já enviadas hoje para esse usuário
    const { data: logsToday } = await supabase
      .from("notifications_log")
      .select("channel")
      .eq("user_id", userId)
      .gte("sent_at", todayStart);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pushSentToday = (logsToday ?? []).filter((l: any) => l.channel === "push").length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailSentToday = (logsToday ?? []).filter((l: any) => l.channel === "email").length;

    const pushBudget = Math.max(0, MAX_PUSH_PER_DAY - pushSentToday);
    const canSendEmail = emailSentToday < MAX_EMAIL_PER_DAY;

    const alertIdsToMarkPush: string[] = [];
    const alertIdsToMarkEmail: string[] = [];

    // ── PUSH ──────────────────────────────────────────────────────────────────
    if (userGroup.notifyPush && userGroup.onesignalPlayerId && pushBudget > 0) {
      const pendingPush = userGroup.alerts.filter((a: AlertItem) => !a.notifiedPush);
      const toSend = pendingPush.slice(0, pushBudget);

      for (const alert of toSend) {
        const body = buildPushBody(alert);
        const ok = await sendPushNotification({
          playerId: userGroup.onesignalPlayerId,
          title: `🎯 STM Radar — ${alert.program || "Nova oportunidade"}`,
          body,
          url: `${APP_URL}/alertas`,
        });

        if (ok) {
          result.pushSent++;
          alertIdsToMarkPush.push(alert.alertId);

          // Log
          await supabase.from("notifications_log").insert({
            user_id: userId,
            alert_id: alert.alertId,
            channel: "push",
            status: "sent",
          } as never);
        }
      }
    }

    // ── EMAIL ─────────────────────────────────────────────────────────────────
    if (userGroup.notifyEmail && canSendEmail && userGroup.email) {
      const pendingEmail = userGroup.alerts.filter((a: AlertItem) => !a.notifiedEmail);
      if (pendingEmail.length > 0) {
        const emailAlerts: AlertEmailData[] = pendingEmail.map((a: AlertItem) => ({
          opportunityTitle: a.opportunityTitle,
          program: a.program || "",
          type: a.type,
          bonusPercentage: a.bonusPercentage,
          origin: a.origin,
          destination: a.destination,
          milesAmount: a.milesAmount,
          validUntil: a.validUntil,
          availableFrom: a.availableFrom,
          availableTo: a.availableTo,
          isVip: a.isVip,
          alertUrl: `${APP_URL}/alertas`,
        }));

        const ok = await sendAlertEmail(userGroup.email, userGroup.name, emailAlerts);

        if (ok) {
          result.emailsSent++;
          pendingEmail.forEach((a: AlertItem) => alertIdsToMarkEmail.push(a.alertId));

          // Log
          await supabase.from("notifications_log").insert({
            user_id: userId,
            alert_id: null,
            channel: "email",
            status: "sent",
          } as never);
        }
      }
    }

    // ── Marca alertas como notificados ────────────────────────────────────────
    if (alertIdsToMarkPush.length) {
      await supabase
        .from("alerts")
        .update({ notified_push: true } as never)
        .in("id", alertIdsToMarkPush);
    }

    if (alertIdsToMarkEmail.length) {
      await supabase
        .from("alerts")
        .update({ notified_email: true } as never)
        .in("id", alertIdsToMarkEmail);
    }
  }

  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPushBody(alert: {
  type: string;
  opportunityTitle: string;
  program: string | null;
  bonusPercentage: number | null;
  origin: string | null;
  destination: string | null;
  milesAmount: number | null;
}): string {
  if (alert.type === "passagem") {
    const route = alert.origin && alert.destination
      ? `${alert.origin} → ${alert.destination}`
      : "";
    const miles = alert.milesAmount
      ? ` · ${alert.milesAmount.toLocaleString("pt-BR")} milhas`
      : "";
    return `${alert.opportunityTitle}${route ? ` (${route})` : ""}${miles}`;
  }

  if (alert.bonusPercentage) {
    return `${alert.opportunityTitle} · +${alert.bonusPercentage}% de bônus`;
  }

  return alert.opportunityTitle;
}
