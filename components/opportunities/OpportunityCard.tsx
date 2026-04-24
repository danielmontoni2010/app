"use client";

import { Badge } from "@/components/ui/badge";
import {
  Zap, Plane, TrendingUp, CreditCard, Star,
  MapPin, Calendar, Gauge, ExternalLink, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate, CABIN_CLASS_LABELS } from "@/lib/utils";
import Link from "next/link";
import type { Opportunity } from "@/lib/supabase/types";

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function groupDatesByMonth(dates: string[]): { label: string; days: number[] }[] {
  const map = new Map<string, number[]>();
  for (const d of [...dates].sort()) {
    const [y, m, day] = d.split("-").map(Number);
    const key = `${y}-${String(m).padStart(2,"0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(day);
  }
  return Array.from(map.entries()).map(([key, days]) => {
    const [y, m] = key.split("-").map(Number);
    const label = `${PT_MONTHS[m - 1]}/${String(y).slice(2)}`;
    return { label, days };
  });
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "transferencia-bonus": { label: "Transferência Bônus", icon: TrendingUp, color: "text-blue-400" },
  "acumulo-turbinado":   { label: "Acúmulo Turbinado",   icon: Zap,         color: "text-green-400" },
  "clube":               { label: "Clube",                icon: Star,        color: "text-purple-400" },
  "cartao":              { label: "Cartão",               icon: CreditCard,  color: "text-orange-400" },
  "passagem":            { label: "Passagem",             icon: Plane,       color: "text-brand-gold" },
};

interface OpportunityCardProps {
  opportunity: Opportunity;
  matchesGoal: boolean;
  userPlan: "essencial" | "pro";
}

export function OpportunityCard({ opportunity: opp, matchesGoal, userPlan }: OpportunityCardProps) {
  const typeConfig = TYPE_CONFIG[opp.type] ?? TYPE_CONFIG["transferencia-bonus"];
  const TypeIcon = typeConfig.icon;
  const isLocked = opp.is_vip && userPlan === "essencial";

  return (
    <div className={cn(
      "glass rounded-xl overflow-hidden transition-all",
      matchesGoal && "border-brand-gold/40 shadow-[0_0_20px_rgba(245,183,49,0.08)]",
      isLocked && "opacity-90"
    )}>
      {/* Match badge — full width bar no topo */}
      {matchesGoal && (
        <div className="bg-brand-gold/10 border-b border-brand-gold/20 px-4 py-2 flex items-center gap-2">
          <span className="text-brand-gold text-sm font-semibold">🎯 BATE COM SUA META</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              matchesGoal ? "bg-brand-gold/15" : "bg-white/5"
            )}>
              <TypeIcon className={cn("w-4 h-4", typeConfig.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {opp.program} · {typeConfig.label}
              </p>
              <h3 className={cn(
                "font-semibold text-white leading-tight mt-0.5",
                isLocked && "blur-sm select-none"
              )}>
                {isLocked ? "Conteúdo exclusivo PRO" : opp.title}
              </h3>
            </div>
          </div>

          {/* Badges direita */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {opp.is_vip && (
              <Badge variant="gold" className="text-xs gap-1">
                <Star className="w-3 h-3" />PRO
              </Badge>
            )}
            {opp.bonus_percentage && !isLocked && (
              <Badge variant="success" className="text-xs font-bold">
                +{opp.bonus_percentage}%
              </Badge>
            )}
          </div>
        </div>

        {/* Detalhes por tipo */}
        {!isLocked && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
            {/* Passagem */}
            {opp.type === "passagem" && (
              <>
                {(opp.origin || opp.destination) && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {opp.origin || "?"} → {opp.destination || "?"}
                  </span>
                )}
                {opp.miles_amount && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Gauge className="w-3 h-3" />
                    {opp.miles_amount.toLocaleString("pt-BR")} milhas
                  </span>
                )}
                {opp.cabin_class && opp.cabin_class !== "any" && (
                  <Badge variant="outline" className="text-xs">
                    {CABIN_CLASS_LABELS[opp.cabin_class] ?? opp.cabin_class}
                  </Badge>
                )}
                {opp.available_dates && (opp.available_dates as string[]).length > 0 ? (
                  <div className="w-full mt-1">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-1">
                      <Calendar className="w-3 h-3" /> Datas disponíveis:
                    </p>
                    <div className="space-y-0.5">
                      {groupDatesByMonth(opp.available_dates as string[]).map(({ label, days }) => (
                        <p key={label} className="text-xs text-muted-foreground leading-relaxed">
                          <span className="text-white/70 font-semibold">{label}:</span>{" "}
                          {days.join(", ")}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (opp.available_from || opp.available_to) ? (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {opp.available_from ? formatDate(opp.available_from) : ""}
                    {opp.available_to && ` — ${formatDate(opp.available_to)}`}
                  </span>
                ) : null}
              </>
            )}

            {/* Transferência / Acúmulo / Clube */}
            {opp.type !== "passagem" && opp.type !== "cartao" && (
              <>
                {opp.min_transfer && (
                  <span className="text-sm text-muted-foreground">
                    mín. {opp.min_transfer.toLocaleString("pt-BR")} pts
                  </span>
                )}
                {opp.valid_until && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Válido até {formatDate(opp.valid_until)}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Descrição (com blur para PRO) */}
        {opp.description && (
          <p className={cn(
            "text-sm text-muted-foreground mb-3 line-clamp-2",
            isLocked && "blur-sm select-none"
          )}>
            {isLocked ? "Descrição exclusiva para membros PRO. Faça upgrade para desbloquear." : opp.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border/50">
          {opp.type !== "passagem" && (
            <span className="text-xs text-muted-foreground">{formatDate(opp.created_at)}</span>
          )}
          {opp.type === "passagem" && <span />}

          {isLocked ? (
            <Link href="/configuracoes?upgrade=true">
              <Button size="sm" variant="gold" className="gap-1.5 text-xs">
                <Lock className="w-3 h-3" />
                Desbloquear PRO
              </Button>
            </Link>
          ) : opp.external_url ? (
            <a href={opp.external_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs hover:border-brand-gold/50">
                <ExternalLink className="w-3 h-3" />
                Ver oportunidade
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
