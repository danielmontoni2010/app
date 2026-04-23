"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Bell, Mail, Smartphone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

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
    <div className={cn(
      "flex items-center justify-between gap-4 py-4",
      disabled && "opacity-60"
    )}>
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
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
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

export function NotificationsForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(profile.notify_email);
  const [notifyPush, setNotifyPush] = useState(profile.notify_push);

  const isPro = profile.plan === "pro";

  async function save(field: "notify_email" | "notify_push", value: boolean) {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value } as never)
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Preferência salva!" });
      router.refresh();
    }
    setLoading(false);
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
        onChange={(v) => { setNotifyPush(v); save("notify_push", v); }}
        disabled={!isPro}
        disabledReason="Disponível apenas no plano PRO"
      />
      <div className="py-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Bell className="w-3.5 h-3.5" />
        Você pode desativar todas as notificações a qualquer momento
      </div>
    </div>
  );
}
