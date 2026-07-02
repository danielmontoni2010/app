"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Bell, Mail, Smartphone, Loader2, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

// Converte a VAPID public key de base64url para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// ── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps {
  label: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}

function Toggle({ label, description, icon: Icon, checked, onChange, disabled, disabledReason }: ToggleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-4", disabled && "opacity-60")}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-brand-gold" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-muted-foreground">
            {disabled && disabledReason ? disabledReason : description}
          </p>
        </div>
      </div>
      <button
        type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors shrink-0",
          checked && !disabled ? "bg-brand-gold" : "bg-white/10",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function NotificationsForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(profile.notify_email);
  const [notifyPush, setNotifyPush] = useState(profile.notify_push);
  const [notifyAll, setNotifyAll] = useState((profile as Profile & { notify_all?: boolean }).notify_all ?? false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [requestingPerm, setRequestingPerm] = useState(false);

  const isPro = profile.plan === "pro";
  const needsBrowserPermission = isPro && notifyPush && browserPermission !== "granted";

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const perm = Notification.permission;
    setBrowserPermission(perm);

    // Se já tem permissão mas não tem subscription salva, registra automaticamente
    if (perm === "granted" && !profile.onesignal_player_id && isPro && notifyPush) {
      registerPushSubscription().catch(console.warn);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function registerPushSubscription(): Promise<boolean> {
    const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!VAPID_KEY) return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as unknown as string,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      return res.ok;
    } catch (err) {
      console.error("[push] Erro ao registrar subscription:", err);
      return false;
    }
  }

  async function save(field: "notify_email" | "notify_push", value: boolean) {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value } as never)
      .eq("id", profile.id);
    if (error) toast({ title: "Erro ao salvar", variant: "destructive" });
    else { toast({ title: "Preferência salva!" }); router.refresh(); }
    setLoading(false);
  }

  async function requestPushPermission() {
    setRequestingPerm(true);
    try {
      // 1. Pede permissão nativa
      const result = await Notification.requestPermission();
      setBrowserPermission(result);

      if (result !== "granted") {
        toast({
          title: "Permissão negada",
          description: "Clique no cadeado na barra de endereço → Permitir notificações.",
          variant: "destructive",
        });
        return;
      }

      // 2. Registra a subscription Web Push
      const ok = await registerPushSubscription();

      if (ok) {
        toast({ title: "Push ativado! 🔔", description: "Você receberá alertas em tempo real." });
        router.refresh();
      } else {
        toast({
          title: "Permissão concedida",
          description: "Recarregue a página para finalizar o registro.",
        });
      }
    } catch (err) {
      console.error("[push]", err);
      toast({ title: "Erro ao ativar push", description: String(err), variant: "destructive" });
    }
    setRequestingPerm(false);
  }

  return (
    <div className={cn("divide-y divide-border/50", loading && "pointer-events-none opacity-70")}>
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
        </div>
      )}

      <Toggle
        label="Alertas por e-mail"
        description="Receba um e-mail diário com as oportunidades que batem com suas metas"
        icon={Mail}
        checked={notifyEmail}
        onChange={(v) => { setNotifyEmail(v); save("notify_email", v); }}
      />

      <Toggle
        label="Alertas por push"
        description="Notificação no celular/PC assim que uma oportunidade aparecer (até 5/dia)"
        icon={Smartphone}
        checked={notifyPush}
        onChange={(v) => { setNotifyPush(v); save("notify_push", v); if (v && isPro) requestPushPermission(); }}
        disabled={!isPro}
        disabledReason="Disponível apenas no plano PRO"
      />

      {isPro && notifyPush && (
        <Toggle
          label="Receber todas as oportunidades"
          description="Push para cada nova oportunidade cadastrada, independente das suas metas"
          icon={Bell}
          checked={notifyAll}
          onChange={(v) => { setNotifyAll(v); save("notify_all" as "notify_push", v); }}
        />
      )}

      {needsBrowserPermission && browserPermission !== "denied" && (
        <div className="py-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-gold/10 border border-brand-gold/30">
            <BellRing className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">Autorize as notificações no browser</p>
              <p className="text-xs text-muted-foreground mb-3">Para receber alertas push, o browser precisa de sua permissão.</p>
              <button
                type="button"
                onClick={requestPushPermission}
                disabled={requestingPerm}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gold text-background text-sm font-semibold hover:bg-brand-gold/90 transition-colors disabled:opacity-60"
              >
                {requestingPerm
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Aguardando...</>
                  : <><BellRing className="w-3.5 h-3.5" /> Ativar notificações</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {browserPermission === "denied" && notifyPush && isPro && (
        <div className="py-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <Bell className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">Notificações bloqueadas</p>
              <p className="text-xs text-muted-foreground">Clique no cadeado na barra de endereço → Notificações → Permitir, depois recarregue a página.</p>
            </div>
          </div>
        </div>
      )}

      <div className="py-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Bell className="w-3.5 h-3.5" />
        Você pode desativar todas as notificações a qualquer momento
      </div>
    </div>
  );
}
