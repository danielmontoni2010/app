"use client";

import { Crown, Check, Zap, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

// URL do produto PRO na PagTrust (produto 618599)
const PAGTRUST_PRO_URL = "https://pay.pagtrust.com.br/618599"; // ajustar URL real

const PRO_FEATURES = [
  "Metas ilimitadas",
  "Oportunidades VIP exclusivas",
  "Alertas push em tempo real",
  "Alertas por email",
  "Feed completo com filtros",
  "Suporte prioritário",
];

const ESSENCIAL_FEATURES = [
  "Até 3 metas ativas",
  "Feed de oportunidades",
  "Alertas por email",
  "Histórico de alertas",
  "Solicitações Agência STM",
];

export function PlanCard({ profile }: { profile: Profile }) {
  const isPro = profile.plan === "pro";
  const status = profile.subscription_status;

  return (
    <div className="space-y-4">
      {/* Plano atual */}
      <div className={cn(
        "rounded-xl p-6 border",
        isPro
          ? "bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 border-brand-gold/30"
          : "glass border-border"
      )}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className={cn("w-5 h-5", isPro ? "text-brand-gold" : "text-muted-foreground")} />
              <h3 className="font-semibold text-white text-lg capitalize">{profile.plan}</h3>
              <Badge
                variant={
                  status === "active" ? "success" :
                  status === "past_due" ? "warning" : "secondary"
                }
                className="text-xs"
              >
                {status === "active" ? "Ativo" : status === "past_due" ? "Pagamento pendente" : "Cancelado"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPro ? "Acesso completo a todas as funcionalidades" : "Plano gratuito com funcionalidades essenciais"}
            </p>
          </div>
          {isPro && <Badge variant="gold" className="gap-1 shrink-0"><Star className="w-3 h-3" /> PRO</Badge>}
        </div>

        {/* Features do plano atual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(isPro ? PRO_FEATURES : ESSENCIAL_FEATURES).map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <Check className={cn("w-3.5 h-3.5 shrink-0", isPro ? "text-brand-gold" : "text-green-400")} />
              <span className="text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA (só Essencial) */}
      {!isPro && (
        <div className="glass rounded-xl p-6 border-brand-gold/20 bg-brand-gold/5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Upgrade para PRO</h3>
              <p className="text-sm text-muted-foreground">
                Desbloqueie metas ilimitadas, oportunidades VIP e alertas push em tempo real.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-3xl font-bold font-display text-brand-gold">R$37</span>
              <span className="text-muted-foreground text-sm">/mês</span>
            </div>
            <a href={PAGTRUST_PRO_URL} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
              <Button variant="gold" className="w-full sm:w-auto gap-2">
                <Crown className="w-4 h-4" />
                Fazer upgrade agora
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Pague via Pix, cartão ou boleto · Cancele quando quiser
          </p>
        </div>
      )}

      {/* PRO — gerenciar assinatura */}
      {isPro && (
        <div className="glass rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Gerenciar assinatura</p>
            <p className="text-xs text-muted-foreground">Cancelar, atualizar pagamento ou ver faturas</p>
          </div>
          <a href={PAGTRUST_PRO_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              PagTrust
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
