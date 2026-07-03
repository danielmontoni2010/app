"use client";

import { useState, useMemo, useRef } from "react";
import { OpportunityCard } from "./OpportunityCard";
import { Input } from "@/components/ui/input";
import { Search, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/lib/supabase/types";

const TYPE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "transferencia-bonus", label: "Transferência" },
  { value: "acumulo-turbinado", label: "Acúmulo" },
  { value: "clube", label: "Clube" },
  { value: "cartao", label: "Cartão" },
  { value: "passagem", label: "Passagem ✈" },
];

const PROGRAMS = ["LATAM Pass", "Smiles", "TudoAzul", "Livelo", "Azul Fidelidade"];

interface OpportunityFeedProps {
  opportunities: Opportunity[];
  matchedIds: Set<string>;
  userPlan: "essencial" | "pro";
}

export function OpportunityFeed({ opportunities, matchedIds, userPlan }: OpportunityFeedProps) {
  const [typeFilter, setTypeFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [originInput, setOriginInput] = useState("");
  const [originFilters, setOriginFilters] = useState<string[]>([]);
  const [destInput, setDestInput] = useState("");
  const [destFilters, setDestFilters] = useState<string[]>([]);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  function makeCityHandlers(
    input: string,
    setInput: (v: string) => void,
    filters: string[],
    setFilters: (fn: (prev: string[]) => string[]) => void
  ) {
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if ((e.key === "Enter" || e.key === ",") && input.trim()) {
        e.preventDefault();
        const val = input.trim().toUpperCase().replace(/,/g, "");
        if (val && !filters.includes(val)) {
          setFilters((prev) => [...prev, val]);
          setTypeFilter("passagem");
        }
        setInput("");
      }
      if (e.key === "Backspace" && !input && filters.length > 0) {
        setFilters((prev) => prev.slice(0, -1));
      }
    }
    function remove(city: string) {
      setFilters((prev) => prev.filter((c) => c !== city));
    }
    return { handleKeyDown, remove };
  }

  const originHandlers = makeCityHandlers(originInput, setOriginInput, originFilters, setOriginFilters);
  const destHandlers = makeCityHandlers(destInput, setDestInput, destFilters, setDestFilters);

  function handleTypeFilter(value: string) {
    setTypeFilter(value);
    if (value !== "passagem") {
      setOriginFilters([]);
      setOriginInput("");
      setDestFilters([]);
      setDestInput("");
    }
  }

  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (typeFilter && opp.type !== typeFilter) return false;
      if (programFilter && opp.program !== programFilter) return false;
      if (showOnlyMatches && !matchedIds.has(opp.id)) return false;

      // Filtro por origem (qualquer uma da lista bate)
      if (originFilters.length > 0) {
        if (opp.type !== "passagem") return false;
        const originLower = opp.origin?.toLowerCase() ?? "";
        const titleLower = opp.title?.toLowerCase() ?? "";
        const matches = originFilters.some((c) => {
          const q = c.toLowerCase();
          return originLower.includes(q) || titleLower.includes(q);
        });
        if (!matches) return false;
      }

      // Filtro por destino (qualquer um da lista bate)
      if (destFilters.length > 0) {
        if (opp.type !== "passagem") return false;
        const destLower = opp.destination?.toLowerCase() ?? "";
        const titleLower = opp.title?.toLowerCase() ?? "";
        const matches = destFilters.some((c) => {
          const q = c.toLowerCase();
          return destLower.includes(q) || titleLower.includes(q);
        });
        if (!matches) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        return (
          opp.title.toLowerCase().includes(q) ||
          (opp.program?.toLowerCase().includes(q) ?? false) ||
          (opp.description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [opportunities, typeFilter, programFilter, showOnlyMatches, search, matchedIds, originFilters, destFilters]);

  // Ordena: matches primeiro, depois mais recentes
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aMatch = matchedIds.has(a.id) ? 1 : 0;
      const bMatch = matchedIds.has(b.id) ? 1 : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filtered, matchedIds]);

  const matchCount = opportunities.filter((o) => matchedIds.has(o.id)).length;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar oportunidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtros de tipo */}
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTypeFilter(value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                typeFilter === value
                  ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                  : "border-border text-muted-foreground hover:border-brand-gold/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtro de origem/destino — aparece em Todos ou Passagem */}
        {(typeFilter === "" || typeFilter === "passagem") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              className={cn(
                "flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border bg-background/50 cursor-text transition-colors",
                originFilters.length > 0 || originInput ? "border-brand-gold/40" : "border-border"
              )}
              onClick={() => originInputRef.current?.focus()}
            >
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />

              {originFilters.map((city) => (
                <span
                  key={city}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-xs font-semibold"
                >
                  {city}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); originHandlers.remove(city); }}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                ref={originInputRef}
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                onKeyDown={originHandlers.handleKeyDown}
                placeholder={originFilters.length === 0 ? "Origem (cidade ou IATA)..." : "Adicionar..."}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-muted-foreground outline-none"
              />

              {(originFilters.length > 0 || originInput) && (
                <button
                  type="button"
                  onClick={() => { setOriginFilters([]); setOriginInput(""); }}
                  className="text-muted-foreground hover:text-white transition-colors ml-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div
              className={cn(
                "flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border bg-background/50 cursor-text transition-colors",
                destFilters.length > 0 || destInput ? "border-brand-gold/40" : "border-border"
              )}
              onClick={() => destInputRef.current?.focus()}
            >
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />

              {destFilters.map((city) => (
                <span
                  key={city}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-xs font-semibold"
                >
                  {city}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); destHandlers.remove(city); }}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                ref={destInputRef}
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                onKeyDown={destHandlers.handleKeyDown}
                placeholder={destFilters.length === 0 ? "Destino (cidade ou IATA)..." : "Adicionar..."}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-muted-foreground outline-none"
              />

              {(destFilters.length > 0 || destInput) && (
                <button
                  type="button"
                  onClick={() => { setDestFilters([]); setDestInput(""); }}
                  className="text-muted-foreground hover:text-white transition-colors ml-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtros de programa + match toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-gold/50"
          >
            <option value="">Todos os programas</option>
            {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          {matchCount > 0 && (
            <button
              onClick={() => setShowOnlyMatches(!showOnlyMatches)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                showOnlyMatches
                  ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                  : "border-border text-muted-foreground hover:border-brand-gold/40"
              )}
            >
              🎯 Minhas metas ({matchCount})
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {sorted.length} oportunidade{sorted.length !== 1 ? "s" : ""}
          {(originFilters.length > 0 || destFilters.length > 0) && (
            <span className="text-brand-gold ml-1">
              · rotas
              {originFilters.length > 0 && ` de ${originFilters.join(", ")}`}
              {destFilters.length > 0 && ` para ${destFilters.join(", ")}`}
            </span>
          )}
          {matchCount > 0 && !showOnlyMatches && (
            <span className="text-brand-gold ml-1">· {matchCount} bate{matchCount !== 1 ? "m" : ""} com suas metas 🎯</span>
          )}
        </p>

        {sorted.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-white font-medium mb-1">Nenhuma oportunidade encontrada</p>
            <p className="text-muted-foreground text-sm">
              {originFilters.length > 0 || destFilters.length > 0
                ? "Sem passagens para essa rota no momento"
                : "Tente mudar os filtros ou aguarde novas oportunidades"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sorted.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                matchesGoal={matchedIds.has(opp.id)}
                userPlan={userPlan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
