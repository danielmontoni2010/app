import webpush from "web-push";

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:admin@stmradar.com.br";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

// subscriptionJson pode ser um JSON serializado da PushSubscription ou um player_id do OneSignal (legado)
export async function sendWebPush(subscriptionJson: string, payload: PushPayload): Promise<boolean> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn("[webpush] VAPID keys não configuradas");
    return false;
  }

  // Verifica se é uma subscription Web Push válida (tem endpoint)
  let subscription: webpush.PushSubscription;
  try {
    const parsed = JSON.parse(subscriptionJson);
    if (!parsed.endpoint) return false; // é um player_id do OneSignal (legado), ignora
    subscription = parsed;
  } catch {
    return false;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/alertas",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-72.png",
      })
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      // Subscription expirada — retorna false para limpar no banco
      console.warn("[webpush] Subscription expirada:", status);
    } else {
      console.error("[webpush] Erro ao enviar:", err);
    }
    return false;
  }
}
