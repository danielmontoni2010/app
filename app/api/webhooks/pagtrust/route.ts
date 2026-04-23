/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getPlanByProductId(productId: string): "essencial" | "pro" {
  const essencialId = process.env.PAGTRUST_PRODUCT_ESSENCIAL || "618598";
  const proId = process.env.PAGTRUST_PRODUCT_PRO || "618599";
  if (String(productId) === proId) return "pro";
  if (String(productId) === essencialId) return "essencial";
  return "essencial";
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.PAGTRUST_WEBHOOK_SECRET;

    if (secret) {
      const token =
        request.headers.get("x-webhook-token") ||
        request.headers.get("authorization")?.replace("Bearer ", "") ||
        request.headers.get("x-token");
      if (token !== secret) {
        console.error("[PagTrust] Token inválido:", token);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await request.json() as any;
    const event: string = payload?.event || payload?.type || "";
    const data = payload?.data || payload || {};

    console.log(`[PagTrust] Evento: ${event}`, data?.customer?.email);

    const supabase = getAdminClient();
    const email: string = data?.customer?.email || data?.email || "";

    if (!email) {
      return NextResponse.json({ received: true, skipped: "no_email" });
    }

    const productId = String(
      data?.product?.id || data?.subscription?.plan?.id || data?.product_id || ""
    );
    const plan = getPlanByProductId(productId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, plan")
      .eq("email", email)
      .maybeSingle() as any;

    switch (event) {
      // Assinatura criada ou renovada → ativa plano
      case "subscription.created":
      case "subscription.renewed":
      case "order.approved": {
        if (profile) {
          await supabase
            .from("profiles")
            .update({
              plan,
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", profile.id);
        } else {
          // Cria usuário automaticamente via admin
          const { data: authData } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              name: data?.customer?.name || email.split("@")[0],
            },
          });
          if (authData?.user) {
            await supabase.from("profiles").upsert({
              id: authData.user.id,
              name: data?.customer?.name || email.split("@")[0],
              email,
              phone: data?.customer?.phone ?? null,
              plan,
              subscription_status: "active",
            } as any);
          }
        }
        console.log(`[PagTrust] ✅ Plano ${plan} ativado: ${email}`);
        break;
      }

      // Cancelamento / reembolso
      case "subscription.canceled":
      case "order.refunded":
      case "order.chargeback": {
        if (profile) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "canceled", updated_at: new Date().toISOString() } as any)
            .eq("id", profile.id);
        }
        console.log(`[PagTrust] ❌ Cancelado: ${email}`);
        break;
      }

      // Pagamento recusado
      case "order.refused": {
        if (profile) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "past_due", updated_at: new Date().toISOString() } as any)
            .eq("id", profile.id);
        }
        break;
      }

      default:
        console.log(`[PagTrust] Evento ignorado: ${event}`);
    }

    return NextResponse.json({ received: true, event });
  } catch (err) {
    console.error("[PagTrust Webhook] Erro:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
