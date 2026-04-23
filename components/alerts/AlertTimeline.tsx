"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell, BellOff, Zap, Plane, TrendingUp, CreditCard, Star,
  MapPin, Gauge, Calendar, ExternalLink, CheckCheck, Filter
} from "lucide-react";
import { cn, formatRelativeTime, formatDate } from "@/lib/utils";
import type { Opportunity } from "@/lib/supabase/types";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "transferencia-bonus": { label: "Transferência Bônus", icon: TrendingUp, color: "text-blue-400" },
  "acumulo-turbinado":   { label: "Acúmulo Turbinado",   icon: Zap,        color: "text-green-400" },
  "clube":               { label: "Clube",                icon: Star,       color: "text-purple-400" },
  "cartao":              { label: "Cartão",               icon: CreditCard, color: "text-orange-400" },
  "passagem":            { label: "Passagem",             icon: Plane,      color: "text-brand-gold" },
};

interface AlertRow {
  id: string;
  created_at: string;
  seen_at: string | null;
  notified_push: boolean;
  notified_email: boolean;
  opportunity: Opportunity;
}

interface AlertTimelineProps {
  alerts: AlertRow[];
  userPlan: "essencial" | "pro";
}

export function AlertTimeline({ alerts: initialAlerts, userPlan }: AlertTimelineProps) {
  const [alerts, setAlerts] = useState<AlertRow[]>(initialAlerts);
  const [filter, setFilter] = useState<"all" | "unseen" | "seen">("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const supabase = createClient();

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === "unseen" && a.seen_at) return false;
      if (filter === "seen" && !a.seen_at) return false;
      if (typeFilter && a.opportunity.type !== typeFilter) return false;
      return true;
    });
  }, [alerts, filter, typeFilter]);

  const unseenCount = alerts.filter((a) => !a.seen_at).length;

  async function markAsSeen(alertId: string) {
    const seenAt = new Date().toISOString();
    await supabase.from("alerts").update({ seen_at: seenAt } as never).eq("id", alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, seen_at: seenAt } : a))
    );
  }

  async function markAllAsSeen() {
    setMarkingAll(true);
    const seenAt = new Date().toISOString();
    const unseenIds = alerts.filter((a) => !a.seen_at).map((a) => a.id);
    if (unseenIds.length) {
      await supabase.from("alerts").update({ seen_at: seenAt } as never).in("id", unseenIds);
      setAlerts((prev) => prev.map((a) => (!a.seen_at ? { ...a, seen_at: seenAt } : a)));
    }
    setMarkingAll(false);
  }

  const typeFilters = [
    { value: "", label: "Todos" },
    { value: "transferencia-bonus", label: "Transferência" },
    { value: "acumulo-turbinado", label: "Acúmulo" },
    { value: "clube", label: "Clube" },
    { value: "cartao", label: "Cartão" },
    { value: "passagem", label: "Passagem" },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          {(["all", "unseen", "seen"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                filter === f
                  ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                  : "border-border text-muted-foreground hover:border-brand-gold/40"
              )}
            >
              {f === "all" ? `Todos (${alerts.length})` : f === "unseen" ? `Não lidos (${unseenCount})` : "Lidos"}
            </button>
          ))}

          {/* Tipo filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-gold/50"
            >
              {typeFilters.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Marcar todos como lido */}
        {unseenCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsSeen}
            disabled={markingAll}
            className="gap-1.5 text-xs shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todos como lido
          </Button>
        )}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <BellOff className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-white font-medium mb-1">Nenhum alerta encontrado</p>
          <p className="text-muted-foreground text-sm">
            {filter === "unseen" ? "Todos os alertas já foram lidos!" : "Tente mudar os filtros"}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Linha vertical da timeline */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-3">
            {filtered.map((alert) => {
              const opp = alert.opportunity;
              const typeConfig = TYPE_CONFIG[opp.type] ?? TYPE_CONFIG["transferencia-bonus"];
              const TypeIcon = typeConfig.icon;
              const unseen = !alert.seen_at;
              const isLocked = opp.is_vip && userPlan === "essencial";

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "relative pl-14 group",
                    unseen && "cursor-pointer"
                  )}
                  onClick={() => unseen && markAsSeen(alert.id)}
                >
                  {/* Ícone na timeline */}
                  <div className={cn(
                    "absolute left-2 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    unseen
                      ? "border-brand-gold bg-brand-gold/20"
                      : "border-border bg-background"
                  )}>
                    {unseen
                      ? <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                      : <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                    }
                  </div>

                  {/* Card do alerta */}
                  <div className={cn(
                    "glass rounded-xl p-4 transition-all",
                    unseen ? "border-brand-gold/20 bg-brand-gold/[0.03]" : "",
                    "group-hover:border-brand-gold/20"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          unseen ? "bg-brand-gold/15" : "bg-white/5"
                        )}>
                          <TypeIcon className={cn("w-4 h-4", typeConfig.color)} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className={cn(
                              "text-sm font-semibold",
                              isLocked ? "blur-sm select-none" : "text-white"
                            )}>
                              {isLocked ? "Oportunidade PRO exclusiva" : opp.title}
                            </p>
                            {opp.is_vip && <Badge variant="gold" className="text-xs">PRO</Badge>}
                            {unseen && <Badge variant="warning" className="text-xs">Novo</Badge>}
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">
                            {opp.program} · {typeConfig.label}
                          </p>

                          {/* Detalhes */}
                          {!isLocked && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {opp.type === "passagem" && (
                                <>
                                  {(opp.origin || opp.destination) && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      {opp.origin ?? "?"} → {opp.destination ?? "?"}
                                    </span>
                                  )}
                                  {opp.miles_amount && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Gauge className="w-3 h-3" />
                                      {opp.miles_amount.toLocaleString("pt-BR")} milhas
                                    </span>
                                  )}
                                </>
                              )}
                              {opp.bonus_percentage && (
                                <span className="text-xs font-semibold text-green-400">
                                  +{opp.bonus_percentage}% bônus
                                </span>
                              )}
                              {opp.valid_until && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  Válido até {formatDate(opp.valid_until)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lado direito */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(alert.created_at)}
                        </span>
                        {!isLocked && opp.external_url && (
                          <a
                            href={opp.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="outline" className="gap-1 text-xs h-7 px-2 hover:border-brand-gold/50">
                              <ExternalLink className="w-3 h-3" />
                              Ver
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Notificações enviadas */}
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/40">
                      <span className={cn(
                        "text-xs flex items-center gap-1",
                        alert.notified_push ? "text-green-400" : "text-muted-foreground/50"
                      )}>
                        <Bell className="w-3 h-3" />
                        Push {alert.notified_push ? "enviado" : "pendente"}
                      </span>
                      <span className={cn(
                        "text-xs flex items-center gap-1",
                        alert.notified_email ? "text-green-400" : "text-muted-foreground/50"
                      )}>
                        ✉ Email {alert.notified_email ? "enviado" : "pendente"}
                      </span>
                      {alert.seen_at && (
                        <span className="text-xs text-muted-foreground/50 ml-auto">
                          Visto {formatRelativeTime(alert.seen_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
