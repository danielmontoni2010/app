const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

export interface PushPayload {
  playerId: string;
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(payload: PushPayload): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn("[push] OneSignal not configured, skipping push");
    return false;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [payload.playerId],
        headings: { pt: payload.title, en: payload.title },
        contents: { pt: payload.body, en: payload.body },
        url: payload.url,
        web_buttons: payload.url
          ? [{ id: "ver", text: "Ver oportunidade", url: payload.url }]
          : undefined,
        // Ícone e badge STM Radar
        chrome_web_icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon-192.png`,
        firefox_icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon-192.png`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[push] OneSignal error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[push] Network error:", err);
    return false;
  }
}

export async function sendPushToMany(playerIds: string[], title: string, body: string, url?: string): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY || !playerIds.length) return false;

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { pt: title, en: title },
        contents: { pt: body, en: body },
        url,
        chrome_web_icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon-192.png`,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
