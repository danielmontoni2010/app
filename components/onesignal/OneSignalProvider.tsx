"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  notifyPush: boolean;
}

export function OneSignalProvider({ userId, notifyPush }: Props) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;

    initialized.current = true;

    async function init() {
      try {
        const OneSignal = (await import("react-onesignal")).default;

        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          notifyButton: { enable: false } as any,
          serviceWorkerParam: { scope: "/" },
        });

        // Vincula o usuário Supabase ao OneSignal
        await OneSignal.login(userId);

        // Escuta quando o usuário concede/revoga permissão
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        OneSignal.Notifications.addEventListener("permissionChange", async (_granted: boolean) => {
          await saveSubscriptionId(userId);
        });

        // Salva logo na inicialização se já tiver permissão
        const permission = OneSignal.Notifications.permission;
        if (permission) {
          await saveSubscriptionId(userId);
        }

        // Se notifyPush está ativo e não tem permissão, pede permissão
        if (notifyPush && !permission) {
          await OneSignal.Notifications.requestPermission();
        }
      } catch (err) {
        console.warn("[OneSignal] init error:", err);
      }
    }

    init();
  }, [userId, notifyPush]);

  return null;
}

async function saveSubscriptionId(userId: string) {
  try {
    const OneSignal = (await import("react-onesignal")).default;
    const subscriptionId = OneSignal.User?.PushSubscription?.id;
    if (!subscriptionId) return;

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ onesignal_player_id: subscriptionId } as never)
      .eq("id", userId);

    console.log("[OneSignal] subscription salva:", subscriptionId);
  } catch (err) {
    console.warn("[OneSignal] erro ao salvar subscription:", err);
  }
}
