const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@stmradar.com.br";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stmradar.com.br";

export interface AlertEmailData {
  opportunityTitle: string;
  program: string;
  type: string;
  bonusPercentage?: number | null;
  origin?: string | null;
  destination?: string | null;
  milesAmount?: number | null;
  validUntil?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  isVip: boolean;
  alertUrl: string;
}

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function buildAlertCard(alert: AlertEmailData): string {
  const badge = alert.isVip
    ? `<span style="background:#F5B731;color:#0A1628;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">⭐ PRO</span>`
    : "";

  const detail = alert.type === "passagem"
    ? `${alert.origin || "?"} → ${alert.destination || "?"} · ${alert.milesAmount ? alert.milesAmount.toLocaleString("pt-BR") + " milhas" : ""}`
    : alert.bonusPercentage
      ? `+${alert.bonusPercentage}% de bônus`
      : "";

  const validity = alert.validUntil
    ? `Válido até ${formatDate(alert.validUntil)}`
    : alert.availableTo
      ? `Disponível até ${formatDate(alert.availableTo)}`
      : "";

  return `
    <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:20px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">${alert.program}</span>
        ${badge}
      </div>
      <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 6px;">${alert.opportunityTitle}</p>
      ${detail ? `<p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">${detail}</p>` : ""}
      ${validity ? `<p style="color:#6b7280;font-size:12px;margin:0 0 12px;">${validity}</p>` : ""}
      <a href="${alert.alertUrl}" style="display:inline-block;background:#F5B731;color:#0A1628;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">
        Ver oportunidade →
      </a>
    </div>
  `;
}

export function buildAlertEmailHtml(userName: string, alerts: AlertEmailData[]): string {
  const cards = alerts.map(buildAlertCard).join("");
  const count = alerts.length;
  const subject = count === 1
    ? `🎯 1 oportunidade bate com sua meta!`
    : `🎯 ${count} oportunidades batem com suas metas!`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:#0A1628;font-family:'DM Sans',Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
            <div style="width:36px;height:36px;background:#F5B731;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:#0A1628;font-weight:900;font-size:18px;">S</span>
            </div>
            <span style="color:#ffffff;font-weight:700;font-size:18px;">STM Radar</span>
          </div>
          <h1 style="color:#F5B731;font-size:22px;font-weight:700;margin:0 0 8px;">
            ${count === 1 ? "Oportunidade encontrada!" : `${count} oportunidades encontradas!`}
          </h1>
          <p style="color:#9ca3af;font-size:14px;margin:0;">
            Olá ${userName}, ${count === 1 ? "encontramos uma oportunidade que bate com sua meta" : "encontramos oportunidades que batem com suas metas"} no radar.
          </p>
        </div>

        <!-- Alert cards -->
        ${cards}

        <!-- CTA -->
        <div style="text-align:center;margin-top:24px;">
          <a href="${APP_URL}/alertas" style="display:inline-block;background:#F5B731;color:#0A1628;padding:12px 28px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">
            Ver todos os alertas
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #1f2937;">
          <p style="color:#4b5563;font-size:12px;margin:0 0 4px;">
            Você está recebendo este email porque cadastrou metas no STM Radar.
          </p>
          <p style="color:#4b5563;font-size:12px;margin:0;">
            <a href="${APP_URL}/configuracoes" style="color:#F5B731;text-decoration:none;">Gerenciar notificações</a>
            &nbsp;·&nbsp;
            <a href="${APP_URL}" style="color:#F5B731;text-decoration:none;">Acessar o app</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

export async function sendAlertEmail(
  toEmail: string,
  userName: string,
  alerts: AlertEmailData[]
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping email");
    return false;
  }

  const count = alerts.length;
  const subject = count === 1
    ? `🎯 1 oportunidade bate com sua meta!`
    : `🎯 ${count} oportunidades batem com suas metas!`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `STM Radar <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html: buildAlertEmailHtml(userName, alerts),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[email] Resend error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Network error:", err);
    return false;
  }
}
