import { createAdminClient } from "@/lib/supabase/server";
import { sendWebPush } from "./webpush";
import { sendAlertEmail, AlertEmailData } from "./email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stmradar.com.br";

// ── Mapeamento IATA → { cidade, país, bandeira } ──────────────────────────────
const IATA: Record<string, { cidade: string; pais: string; flag: string }> = {
  // Brasil
  GRU: { cidade: "São Paulo", pais: "Brasil", flag: "🇧🇷" },
  CGH: { cidade: "São Paulo", pais: "Brasil", flag: "🇧🇷" },
  VCP: { cidade: "Campinas", pais: "Brasil", flag: "🇧🇷" },
  GIG: { cidade: "Rio de Janeiro", pais: "Brasil", flag: "🇧🇷" },
  SDU: { cidade: "Rio de Janeiro", pais: "Brasil", flag: "🇧🇷" },
  BSB: { cidade: "Brasília", pais: "Brasil", flag: "🇧🇷" },
  SSA: { cidade: "Salvador", pais: "Brasil", flag: "🇧🇷" },
  REC: { cidade: "Recife", pais: "Brasil", flag: "🇧🇷" },
  FOR: { cidade: "Fortaleza", pais: "Brasil", flag: "🇧🇷" },
  BEL: { cidade: "Belém", pais: "Brasil", flag: "🇧🇷" },
  MAO: { cidade: "Manaus", pais: "Brasil", flag: "🇧🇷" },
  CWB: { cidade: "Curitiba", pais: "Brasil", flag: "🇧🇷" },
  FLN: { cidade: "Florianópolis", pais: "Brasil", flag: "🇧🇷" },
  POA: { cidade: "Porto Alegre", pais: "Brasil", flag: "🇧🇷" },
  CNF: { cidade: "Belo Horizonte", pais: "Brasil", flag: "🇧🇷" },
  PLU: { cidade: "Belo Horizonte", pais: "Brasil", flag: "🇧🇷" },
  VIX: { cidade: "Vitória", pais: "Brasil", flag: "🇧🇷" },
  GYN: { cidade: "Goiânia", pais: "Brasil", flag: "🇧🇷" },
  CGB: { cidade: "Cuiabá", pais: "Brasil", flag: "🇧🇷" },
  CGR: { cidade: "Campo Grande", pais: "Brasil", flag: "🇧🇷" },
  THE: { cidade: "Teresina", pais: "Brasil", flag: "🇧🇷" },
  SLZ: { cidade: "São Luís", pais: "Brasil", flag: "🇧🇷" },
  NAT: { cidade: "Natal", pais: "Brasil", flag: "🇧🇷" },
  JPA: { cidade: "João Pessoa", pais: "Brasil", flag: "🇧🇷" },
  MCZ: { cidade: "Maceió", pais: "Brasil", flag: "🇧🇷" },
  AJU: { cidade: "Aracaju", pais: "Brasil", flag: "🇧🇷" },
  PMW: { cidade: "Palmas", pais: "Brasil", flag: "🇧🇷" },
  PVH: { cidade: "Porto Velho", pais: "Brasil", flag: "🇧🇷" },
  RBR: { cidade: "Rio Branco", pais: "Brasil", flag: "🇧🇷" },
  MCP: { cidade: "Macapá", pais: "Brasil", flag: "🇧🇷" },
  BVB: { cidade: "Boa Vista", pais: "Brasil", flag: "🇧🇷" },
  IGU: { cidade: "Foz do Iguaçu", pais: "Brasil", flag: "🇧🇷" },
  JOI: { cidade: "Joinville", pais: "Brasil", flag: "🇧🇷" },
  XAP: { cidade: "Chapecó", pais: "Brasil", flag: "🇧🇷" },
  IOS: { cidade: "Ilhéus", pais: "Brasil", flag: "🇧🇷" },
  IQT: { cidade: "Iquitos", pais: "Peru", flag: "🇵🇪" },
  // América do Sul
  EZE: { cidade: "Buenos Aires", pais: "Argentina", flag: "🇦🇷" },
  AEP: { cidade: "Buenos Aires", pais: "Argentina", flag: "🇦🇷" },
  SCL: { cidade: "Santiago", pais: "Chile", flag: "🇨🇱" },
  BOG: { cidade: "Bogotá", pais: "Colômbia", flag: "🇨🇴" },
  LIM: { cidade: "Lima", pais: "Peru", flag: "🇵🇪" },
  GYE: { cidade: "Guayaquil", pais: "Equador", flag: "🇪🇨" },
  UIO: { cidade: "Quito", pais: "Equador", flag: "🇪🇨" },
  MVD: { cidade: "Montevidéu", pais: "Uruguai", flag: "🇺🇾" },
  PDP: { cidade: "Punta del Este", pais: "Uruguai", flag: "🇺🇾" },
  ASU: { cidade: "Assunção", pais: "Paraguai", flag: "🇵🇾" },
  CCS: { cidade: "Caracas", pais: "Venezuela", flag: "🇻🇪" },
  ADZ: { cidade: "San Andrés", pais: "Colômbia", flag: "🇨🇴" },
  // América do Norte
  MIA: { cidade: "Miami", pais: "Estados Unidos", flag: "🇺🇸" },
  JFK: { cidade: "Nova York", pais: "Estados Unidos", flag: "🇺🇸" },
  EWR: { cidade: "Nova York", pais: "Estados Unidos", flag: "🇺🇸" },
  LAX: { cidade: "Los Angeles", pais: "Estados Unidos", flag: "🇺🇸" },
  ORD: { cidade: "Chicago", pais: "Estados Unidos", flag: "🇺🇸" },
  MCO: { cidade: "Orlando", pais: "Estados Unidos", flag: "🇺🇸" },
  ATL: { cidade: "Atlanta", pais: "Estados Unidos", flag: "🇺🇸" },
  IAH: { cidade: "Houston", pais: "Estados Unidos", flag: "🇺🇸" },
  DFW: { cidade: "Dallas", pais: "Estados Unidos", flag: "🇺🇸" },
  LAS: { cidade: "Las Vegas", pais: "Estados Unidos", flag: "🇺🇸" },
  SFO: { cidade: "San Francisco", pais: "Estados Unidos", flag: "🇺🇸" },
  BOS: { cidade: "Boston", pais: "Estados Unidos", flag: "🇺🇸" },
  YYZ: { cidade: "Toronto", pais: "Canadá", flag: "🇨🇦" },
  MEX: { cidade: "Cidade do México", pais: "México", flag: "🇲🇽" },
  CUN: { cidade: "Cancún", pais: "México", flag: "🇲🇽" },
  // Europa
  LIS: { cidade: "Lisboa", pais: "Portugal", flag: "🇵🇹" },
  OPO: { cidade: "Porto", pais: "Portugal", flag: "🇵🇹" },
  MAD: { cidade: "Madrid", pais: "Espanha", flag: "🇪🇸" },
  BCN: { cidade: "Barcelona", pais: "Espanha", flag: "🇪🇸" },
  LHR: { cidade: "Londres", pais: "Reino Unido", flag: "🇬🇧" },
  CDG: { cidade: "Paris", pais: "França", flag: "🇫🇷" },
  FRA: { cidade: "Frankfurt", pais: "Alemanha", flag: "🇩🇪" },
  AMS: { cidade: "Amsterdã", pais: "Holanda", flag: "🇳🇱" },
  FCO: { cidade: "Roma", pais: "Itália", flag: "🇮🇹" },
  MXP: { cidade: "Milão", pais: "Itália", flag: "🇮🇹" },
  ZRH: { cidade: "Zurique", pais: "Suíça", flag: "🇨🇭" },
  // Outros
  DXB: { cidade: "Dubai", pais: "Emirados", flag: "🇦🇪" },
  JNB: { cidade: "Joanesburgo", pais: "África do Sul", flag: "🇿🇦" },
  NRT: { cidade: "Tóquio", pais: "Japão", flag: "🇯🇵" },
  SYD: { cidade: "Sydney", pais: "Austrália", flag: "🇦🇺" },
  PUJ: { cidade: "Punta Cana", pais: "Rep. Dominicana", flag: "🇩🇴" },
  HAV: { cidade: "Havana", pais: "Cuba", flag: "🇨🇺" },
  CUR: { cidade: "Curaçao", pais: "Curaçao", flag: "🇨🇼" },
};

function iataParaNome(iata: string | null): string {
  if (!iata) return "";
  const info = IATA[iata.toUpperCase()];
  return info ? `${info.cidade} • ${info.pais} ${info.flag}` : iata;
}

function iataParaCidade(iata: string | null): string {
  if (!iata) return "";
  return IATA[iata.toUpperCase()]?.cidade || iata;
}

const MAX_PUSH_PER_DAY = 5;
const MAX_EMAIL_PER_DAY = 10; // aumentado para não bloquear em testes

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

  // 1. Busca alertas pendentes (sem join — evita erro de foreign key ausente)
  const { data: pendingAlerts, error: alertsError } = await supabase
    .from("alerts")
    .select("id, user_id, opportunity_id, notified_push, notified_email")
    .or("notified_push.eq.false,notified_email.eq.false");

  if (alertsError) {
    result.errors.push(`Erro ao buscar alertas: ${alertsError.message}`);
    return result;
  }

  if (!pendingAlerts?.length) return result;

  // 2. Busca oportunidades e perfis em queries separadas
  const oppIds  = Array.from(new Set(pendingAlerts.map((a: {opportunity_id: string}) => a.opportunity_id)));
  const userIds = Array.from(new Set(pendingAlerts.map((a: {user_id: string}) => a.user_id)));

  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, title, type, program, bonus_percentage, origin, destination, miles_amount, valid_until, available_from, available_to, is_vip")
    .in("id", oppIds);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, notify_push, notify_email, onesignal_player_id, plan")
    .in("id", userIds);

  if (!opps || !profiles) return result;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oppMap     = new Map(opps.map((o: any) => [o.id, o]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  // 3. Agrupa por usuário
  const userMap = new Map<string, UserAlertGroup>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const alert of pendingAlerts as any[]) {
    const profile = profileMap.get(alert.user_id);
    const opp     = oppMap.get(alert.opportunity_id);
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
        const title = alert.type === "passagem"
          ? `✈️ Oportunidade de emissão!`
          : `🎯 ${alert.program || "STM Radar"} — Nova oportunidade`;

        const ok = await sendWebPush(userGroup.onesignalPlayerId, {
          title,
          body,
          url: `${APP_URL}/alertas`,
        });

        if (ok) {
          result.pushSent++;
          alertIdsToMarkPush.push(alert.alertId);
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

// ── Broadcast: envia push para usuários com notify_all = true ─────────────────
export async function sendBroadcastPush(opportunityId: string): Promise<number> {
  const supabase = createAdminClient();

  // Busca oportunidade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opp } = await (supabase as any)
    .from("opportunities")
    .select("id, title, type, program, bonus_percentage, origin, destination, miles_amount")
    .eq("id", opportunityId)
    .single();

  if (!opp) return 0;

  // Busca usuários com notify_all ativo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users } = await (supabase as any)
    .from("profiles")
    .select("id, onesignal_player_id")
    .eq("notify_all", true)
    .eq("notify_push", true)
    .not("onesignal_player_id", "is", null);

  if (!users?.length) return 0;

  // Verifica quem já recebeu essa oportunidade hoje (via notifications_log)
  const todayStart = startOfToday();
  const { data: logs } = await supabase
    .from("notifications_log")
    .select("user_id")
    .eq("channel", "push")
    .gte("sent_at", todayStart)
    .like("status", `broadcast:${opportunityId}%`);

  const alreadySent = new Set((logs ?? []).map((l: { user_id: string }) => l.user_id));

  const title = buildPushBody({
    type: opp.type,
    opportunityTitle: opp.title,
    program: opp.program,
    bonusPercentage: opp.bonus_percentage,
    origin: opp.origin,
    destination: opp.destination,
    milesAmount: opp.miles_amount,
  });
  const pushTitle = opp.type === "passagem"
    ? "✈️ Oportunidade de emissão!"
    : `🎯 ${opp.program || "STM Radar"} — Nova oportunidade`;

  let sent = 0;
  for (const user of users) {
    if (alreadySent.has(user.id)) continue;
    const ok = await sendWebPush(user.onesignal_player_id, {
      title: pushTitle,
      body: title,
      url: `${APP_URL}/oportunidades`,
    });
    if (ok) {
      sent++;
      await supabase.from("notifications_log").insert({
        user_id: user.id,
        alert_id: null,
        channel: "push",
        status: `broadcast:${opportunityId}`,
      } as never);
    }
  }

  return sent;
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
    // Destino com cidade + país + bandeira
    const destino = alert.destination
      ? iataParaNome(alert.destination)
      : alert.opportunityTitle;

    const miles = alert.milesAmount
      ? ` por apenas ${alert.milesAmount.toLocaleString("pt-BR")} milhas`
      : "";

    const prog = alert.program ? ` pela ${alert.program}` : "";

    const origem = alert.origin
      ? ` saindo de ${iataParaCidade(alert.origin)}`
      : "";

    return `${destino}${miles}${prog}${origem}`;
  }

  if (alert.type === "transferencia-bonus" && alert.bonusPercentage) {
    const prog = alert.program ? `${alert.program} com ` : "";
    return `${prog}+${alert.bonusPercentage}% de bônus na transferência!`;
  }

  if (alert.bonusPercentage) {
    return `${alert.opportunityTitle} · +${alert.bonusPercentage}% de bônus`;
  }

  return alert.opportunityTitle;
}
