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
  const [cityInput, setCityInput] = useState("");
  const [cityFilters, setCityFilters] = useState<string[]>([]);
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Adiciona cidade ao pressionar Enter ou vírgula
  function handleCityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && cityInput.trim()) {
      e.preventDefault();
      const val = cityInput.trim().toUpperCase().replace(/,/g, "");
      if (val && !cityFilters.includes(val)) {
        setCityFilters((prev) => [...prev, val]);
        // Auto-seleciona filtro passagem
        setTypeFilter("passagem");
      }
      setCityInput("");
    }
    if (e.key === "Backspace" && !cityInput && cityFilters.length > 0) {
      setCityFilters((prev) => prev.slice(0, -1));
    }
  }

  function removeCity(city: string) {
    setCityFilters((prev) => prev.filter((c) => c !== city));
  }

  function handleTypeFilter(value: string) {
    setTypeFilter(value);
    if (value !== "passagem") {
      setCityFilters([]);
      setCityInput("");
    }
  }

  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (typeFilter && opp.type !== typeFilter) return false;
      if (programFilter && opp.program !== programFilter) return false;
      if (showOnlyMatches && !matchedIds.has(opp.id)) return false;

      // Filtro por cidades (qualquer cidade na lista bate)
      if (cityFilters.length > 0) {
        if (opp.type !== "passagem") return false;
        const titleLower = opp.title?.toLowerCase() ?? "";
        const originLower = opp.origin?.toLowerCase() ?? "";
        const destLower = opp.destination?.toLowerCase() ?? "";
        const matches = cityFilters.some((c) => {
          const q = c.toLowerCase();
          return originLower.includes(q) || destLower.includes(q) || titleLower.includes(q);
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
  }, [opportunities, typeFilter, programFilter, showOnlyMatches, search, matchedIds, cityFilters]);

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

        {/* Filtro de cidade — aparece em Todos ou Passagem */}
        {(typeFilter === "" || typeFilter === "passagem") && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border bg-background/50 cursor-text transition-colors",
              cityFilters.length > 0 || cityInput
                ? "border-brand-gold/40"
                : "border-border"
            )}
            onClick={() => cityInputRef.current?.focus()}
          >
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Chips das cidades selecionadas */}
            {cityFilters.map((city) => (
              <span
                key={city}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-xs font-semibold"
              >
                {city}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeCity(city); }}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <input
              ref={cityInputRef}
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleCityKeyDown}
              placeholder={cityFilters.length === 0 ? "Filtrar passagens por cidade ou IATA (Enter para adicionar)..." : "Adicionar cidade..."}
              className="flex-1 min-w-[180px] bg-transparent text-sm text-white placeholder:text-muted-foreground outline-none"
            />

            {(cityFilters.length > 0 || cityInput) && (
              <button
                type="button"
                onClick={() => { setCityFilters([]); setCityInput(""); }}
                className="text-muted-foreground hover:text-white transition-colors ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
          {cityFilters.length > 0 && (
            <span className="text-brand-gold ml-1">· rotas com {cityFilters.join(", ")}</span>
          )}
          {matchCount > 0 && !showOnlyMatches && (
            <span className="text-brand-gold ml-1">· {matchCount} bate{matchCount !== 1 ? "m" : ""} com suas metas 🎯</span>
          )}
        </p>

        {sorted.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-white font-medium mb-1">Nenhuma oportunidade encontrada</p>
            <p className="text-muted-foreground text-sm">
              {cityFilters.length > 0
                ? `Sem passagens para ${cityFilters.join(" ou ")} no momento`
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
