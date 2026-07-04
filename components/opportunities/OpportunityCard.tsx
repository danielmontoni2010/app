"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Plane, TrendingUp, CreditCard, Star,
  Gauge, ExternalLink, Lock, Clock, ChevronDown, ChevronUp, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatWeekdayDate, calculateMilesPrice, CABIN_CLASS_LABELS } from "@/lib/utils";
import Link from "next/link";
import type { Opportunity } from "@/lib/supabase/types";
import { IATA_CITIES } from "@/lib/iata-cities";
import { useCityImage } from "@/hooks/use-city-image";

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAN_TRAVEL_WHATSAPP_URL = "https://wa.me/message/YBBCRIQPF4W4N1";
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
    return { label: `${PT_MONTHS[m - 1]}/${String(y).slice(2)}`, days };
  });
}

function getFirstFlightDate(opp: Opportunity): string | null {
  const dates = opp.available_dates as { ida?: string[]; volta?: string[] } | null;
  if (dates?.ida?.length) return [...dates.ida].sort()[0];
  return opp.available_from ?? null;
}

function formatTax(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// ── Banner com foto do destino ────────────────────────────────────────────────
// Sempre a foto de ponto turístico da cidade — nunca o print do alerta
// (esse é exclusivo dos outros tipos de oportunidade).
function CityImageBanner({ iataCode }: { iataCode: string | null }) {
  const cityName = iataCode ? IATA_CITIES[iataCode.toUpperCase()] ?? null : null;
  const image = useCityImage(cityName);

  return (
    <div className="relative h-28 rounded-lg overflow-hidden bg-gradient-to-br from-brand-gold/20 to-white/5">
      {image ? (
        <img
          src={image}
          alt={cityName ?? iataCode ?? "Destino"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Plane className="w-8 h-8 text-brand-gold/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
        <p className="text-white font-bold text-sm leading-tight drop-shadow">
          {cityName ?? iataCode ?? "Destino"}
        </p>
        {iataCode && (
          <span className="text-[10px] text-white/80 font-medium drop-shadow shrink-0">{iataCode}</span>
        )}
      </div>
    </div>
  );
}

function useCountdown(validUntil: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    if (!validUntil) return;
    const calc = () => {
      // valid_until é "YYYY-MM-DD" (sem hora); trata como válido até o
      // fim do dia no horário local, não meia-noite UTC (que expiraria
      // horas antes do esperado no fuso do Brasil)
      const [y, m, d] = validUntil.split("-").map(Number);
      const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
      const diff = endOfDay - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0 }); return; }
      const days    = Math.floor(diff / 86400000);
      const hours   = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setTimeLeft({ days, hours, minutes });
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [validUntil]);

  return timeLeft;
}

// ── Tipo config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  "transferencia-bonus": { label: "Transferência Bônus", icon: TrendingUp, color: "text-blue-400",       bg: "bg-blue-400/10" },
  "acumulo-turbinado":   { label: "Acúmulo Turbinado",   icon: Zap,         color: "text-green-400",      bg: "bg-green-400/10" },
  "clube":               { label: "Clube",                icon: Star,        color: "text-purple-400",     bg: "bg-purple-400/10" },
  "cartao":              { label: "Cartão",               icon: CreditCard,  color: "text-orange-400",     bg: "bg-orange-400/10" },
  "passagem":            { label: "Passagem",             icon: Plane,       color: "text-brand-gold",     bg: "bg-brand-gold/10" },
};

// ── Seção com header dourado ──────────────────────────────────────────────────
function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/3 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/8 bg-brand-gold/5">
        <span className="text-sm">{emoji}</span>
        <p className="text-xs font-semibold text-brand-gold uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function CountdownTimer({ validUntil }: { validUntil: string }) {
  const t = useCountdown(validUntil);
  if (!t) return null;
  const expired = t.days === 0 && t.hours === 0 && t.minutes === 0;

  return (
    <div className={cn(
      "rounded-lg border px-3 py-2.5 flex items-center gap-3",
      expired ? "border-red-500/30 bg-red-500/5" : "border-brand-gold/30 bg-brand-gold/5"
    )}>
      <Clock className={cn("w-4 h-4 shrink-0", expired ? "text-red-400" : "text-brand-gold")} />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1.5">⏱️ Oferta termina em:</p>
        {expired ? (
          <p className="text-sm font-semibold text-red-400">Expirada</p>
        ) : (
          <div className="flex items-center gap-2">
            {[{ v: t.days, l: "Dias" }, { v: t.hours, l: "Horas" }, { v: t.minutes, l: "Min" }].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center">
                <span className="font-display text-xl font-bold text-white leading-none">
                  {String(v).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-right hidden sm:block">
        A promoção finaliza em<br />
        <span className="text-white/60">{formatDate(validUntil)}</span>
      </p>
    </div>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────
interface OpportunityCardProps {
  opportunity: Opportunity;
  matchesGoal: boolean;
  userPlan: "essencial" | "pro";
}

export function OpportunityCard({ opportunity: opp, matchesGoal, userPlan }: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = TYPE_CONFIG[opp.type] ?? TYPE_CONFIG["transferencia-bonus"];
  const TypeIcon   = typeConfig.icon;
  const isLocked   = opp.is_vip && userPlan === "essencial";
  const opp2 = opp as Opportunity & { how_it_works?: string | null; opinion?: string | null };
  const isPassagem = opp.type === "passagem";

  // Datas para passagens
  const dates = opp.available_dates as { ida?: string[]; volta?: string[] } | null;

  // Para passagens: só mostra datas e opinião (descrição é redundante com campos estruturados)
  const hasDetails = !isLocked && (
    isPassagem
      ? (opp2.opinion || (dates && (dates.ida?.length || dates.volta?.length)))
      : (opp2.how_it_works || opp2.opinion || opp.description)
  );

  return (
    <div className={cn(
      "glass rounded-xl overflow-hidden transition-all",
      matchesGoal && "border-brand-gold/50 shadow-[0_0_24px_rgba(245,183,49,0.1)]",
      isLocked && "opacity-90"
    )}>
      {/* ── Match banner ── */}
      {matchesGoal && (
        <div className="bg-brand-gold/10 border-b border-brand-gold/20 px-4 py-2 flex items-center gap-2">
          <span className="text-brand-gold text-xs font-bold tracking-wide">🎯 BATE COM SUA META</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── Header: programa + tipo ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeConfig.bg)}>
              <TypeIcon className={cn("w-5 h-5", typeConfig.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                {opp.program && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                    {opp.program}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {typeConfig.label}
                </Badge>
              </div>
              <h3 className={cn("font-bold text-white leading-snug text-sm", isLocked && "blur-sm select-none")}>
                {isLocked ? "Conteúdo exclusivo PRO" : opp.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {opp.is_vip && (
              <Badge variant="gold" className="text-[10px] gap-1">
                <Star className="w-2.5 h-2.5" />PRO
              </Badge>
            )}
            {opp.bonus_percentage && !isLocked && (
              <Badge variant="success" className="text-xs font-bold">
                +{opp.bonus_percentage}%
              </Badge>
            )}
          </div>
        </div>

        {/* ── Detalhes passagem ── */}
        {!isLocked && opp.type === "passagem" && (
          <div className="space-y-2.5">
            <CityImageBanner iataCode={opp.destination} />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">
                    {(opp.origin && IATA_CITIES[opp.origin.toUpperCase()]) || "Origem"}
                  </p>
                  <p className="text-white font-bold text-sm leading-none">{opp.origin || "?"}</p>
                </div>
                <Plane className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">
                    {(opp.destination && IATA_CITIES[opp.destination.toUpperCase()]) || "Destino"}
                  </p>
                  <p className="text-white font-bold text-sm leading-none">{opp.destination || "?"}</p>
                </div>
              </div>
              {(() => {
                const flightDate = getFirstFlightDate(opp);
                return flightDate ? (
                  <span className="text-xs text-muted-foreground text-right shrink-0">
                    {formatWeekdayDate(flightDate)}
                  </span>
                ) : null;
              })()}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {(() => {
                const estimatedPrice = calculateMilesPrice(opp.program, opp.miles_amount);
                return estimatedPrice != null ? (
                  <span className="text-sm">
                    <span className="text-white font-bold">{formatTax(estimatedPrice)}</span>
                    <span className="text-white/60"> + taxas</span>
                  </span>
                ) : opp.tax_amount != null ? (
                  <span className="text-sm text-white/70">+ {formatTax(opp.tax_amount)} taxas</span>
                ) : null;
              })()}
              {opp.miles_amount && (
                <span className="flex items-center gap-1 text-sm">
                  <Gauge className="w-3 h-3 text-brand-gold" />
                  <span className="text-brand-gold font-bold">{opp.miles_amount.toLocaleString("pt-BR")}</span>
                  <span className="text-muted-foreground">milhas</span>
                </span>
              )}
              {opp.cabin_class && opp.cabin_class !== "any" && (
                <Badge variant="outline" className="text-[10px]">
                  {CABIN_CLASS_LABELS[opp.cabin_class] ?? opp.cabin_class}
                </Badge>
              )}
            </div>

            <a href={DAN_TRAVEL_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="sm" className="gap-1.5 text-xs h-7">
                <MessageCircle className="w-3 h-3" />
                Emitir com a Dan Travel
              </Button>
            </a>
          </div>
        )}

        {/* ── Print do alerta — promos que não são passagem (passagem já mostra no banner) ── */}
        {!isLocked && !isPassagem && opp.image_url && (
          <img
            src={opp.image_url}
            alt={opp.title}
            className="w-full max-h-72 object-cover rounded-lg"
            loading="lazy"
          />
        )}

        {/* ── Countdown — apenas para promos, não para passagens ── */}
        {!isLocked && opp.valid_until && !isPassagem && (
          <CountdownTimer validUntil={opp.valid_until} />
        )}

        {/* ── Seções colapsáveis ── */}
        {!isLocked && hasDetails && (
          <>
            {/* Preview — só para não-passagens */}
            {!expanded && !isPassagem && opp.description && !opp2.how_it_works && (
              <p className="text-sm text-muted-foreground line-clamp-2">{opp.description}</p>
            )}

            {/* Conteúdo expandido */}
            {expanded && (
              <div className="space-y-2.5">
                {/* Promos: Como funciona */}
                {!isPassagem && opp2.how_it_works && (
                  <Section emoji="✨" title="Como funciona a promo">
                    <div className="space-y-1">
                      {opp2.how_it_works.split("\n").filter(Boolean).map((line, i) => (
                        <p key={i} className="text-sm text-white/80 leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Promos: Descrição */}
                {!isPassagem && opp.description && (
                  <Section emoji="📋" title="Descrição">
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                      {opp.description}
                    </p>
                  </Section>
                )}

                {/* Passagens: Datas (única vez, só expandido) */}
                {isPassagem && dates && (dates.ida?.length || dates.volta?.length) && (
                  <Section emoji="📅" title="Datas disponíveis">
                    <div className="space-y-2">
                      {dates.ida && dates.ida.length > 0 && (
                        <div>
                          <p className="text-xs text-brand-gold font-semibold mb-1">✈️ Ida</p>
                          <div className="space-y-0.5">
                            {groupDatesByMonth(dates.ida).map(({ label, days }) => (
                              <p key={label} className="text-xs text-white/80">
                                <span className="font-semibold">{label}:</span>{" "}{days.join(", ")}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {dates.volta && dates.volta.length > 0 && (
                        <div>
                          <p className="text-xs text-brand-gold font-semibold mb-1">🔙 Volta</p>
                          <div className="space-y-0.5">
                            {groupDatesByMonth(dates.volta).map(({ label, days }) => (
                              <p key={label} className="text-xs text-white/80">
                                <span className="font-semibold">{label}:</span>{" "}{days.join(", ")}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {/* Opinião do Daniel (todos os tipos) */}
                {opp2.opinion && (
                  <div className="rounded-lg border border-brand-gold/30 bg-brand-gold/5 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-brand-gold/20">
                      <span className="text-sm">💛</span>
                      <p className="text-xs font-semibold text-brand-gold uppercase tracking-wide">Opinião do Daniel</p>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-sm text-white/80 leading-relaxed">{opp2.opinion}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Toggle expandir */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-brand-gold transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Ver detalhes</>
              )}
            </button>
          </>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground">{formatDate(opp.created_at)}</span>

          {isLocked ? (
            <Link href="/configuracoes?upgrade=true">
              <Button size="sm" variant="gold" className="gap-1.5 text-xs h-7">
                <Lock className="w-3 h-3" />Desbloquear PRO
              </Button>
            </Link>
          ) : opp.external_url ? (
            <a href={opp.external_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 hover:border-brand-gold/50">
                <ExternalLink className="w-3 h-3" />Ver oportunidade
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
