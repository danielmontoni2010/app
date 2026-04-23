import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, Target, Plane, TrendingUp, AlertCircle, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Goal } from "@/lib/supabase/types";

// Conta frequência de valores num array
function countBy<T>(items: T[], key: (item: T) => string | null | undefined): { value: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const v = key(item);
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function AdminDemandaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Busca todas as metas ativas
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active");

  // Busca todos os alertas (para saber quais metas já foram servidas)
  const { data: alerts } = await supabase
    .from("alerts")
    .select("goal_id");

  // Busca oportunidades ativas
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("type, program")
    .eq("active", true);

  const allGoals = (goals ?? []) as Goal[];
  const servedGoalIds = new Set((alerts ?? []).map((a: { goal_id: string }) => a.goal_id));

  const flightGoals = allGoals.filter((g) => g.type === "flight");
  const accumGoals = allGoals.filter((g) => g.type === "accumulation");
  const cardGoals = allGoals.filter((g) => g.type === "card");
  const unservedGoals = allGoals.filter((g) => !servedGoalIds.has(g.id));

  // Rankings
  const topRoutes = countBy(flightGoals, (g) =>
    g.origin && g.destination ? `${g.origin} → ${g.destination}` : null
  ).slice(0, 10);

  const topDestinations = countBy(flightGoals, (g) => g.destination).slice(0, 8);
  const topPrograms = countBy(accumGoals, (g) => g.target_program).slice(0, 8);
  const topOppTypes = countBy(
    accumGoals.flatMap((g) => (g.opportunity_types ?? []).map((t) => ({ type: t }))),
    (x) => x.type
  ).slice(0, 6);
  const topCabins = countBy(flightGoals, (g) => g.cabin_class).slice(0, 4);

  // Stats
  const stats = [
    { label: "Metas ativas", value: allGoals.length, icon: Target, color: "text-brand-gold" },
    { label: "Já servidas", value: servedGoalIds.size, icon: Zap, color: "text-green-400" },
    { label: "Sem oportunidade", value: unservedGoals.length, icon: AlertCircle, color: "text-red-400" },
    { label: "Oportunidades ativas", value: (opportunities ?? []).length, icon: BarChart3, color: "text-blue-400" },
  ];

  const coverageRate = allGoals.length > 0
    ? Math.round((servedGoalIds.size / allGoals.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-brand-gold" />
          Dashboard de Demanda
        </h1>
        <p className="text-muted-foreground mt-1">
          Entenda o que os alunos estão buscando e onde focar as próximas oportunidades
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className={cn("text-3xl font-bold font-display", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Taxa de cobertura */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-white">Taxa de cobertura</p>
            <p className="text-sm text-muted-foreground">
              % de metas que receberam ao menos 1 alerta
            </p>
          </div>
          <span className={cn(
            "text-3xl font-bold font-display",
            coverageRate >= 70 ? "text-green-400" : coverageRate >= 40 ? "text-brand-gold" : "text-red-400"
          )}>
            {coverageRate}%
          </span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              coverageRate >= 70 ? "bg-green-400" : coverageRate >= 40 ? "bg-brand-gold" : "bg-red-400"
            )}
            style={{ width: `${coverageRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>0%</span>
          <span>{servedGoalIds.size} de {allGoals.length} metas servidas</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top rotas */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
            <Plane className="w-4 h-4 text-brand-gold" />
            Rotas mais buscadas
            <Badge variant="secondary" className="text-xs ml-auto">{flightGoals.length} metas de voo</Badge>
          </h2>
          {topRoutes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma rota específica cadastrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {topRoutes.map(({ value, count }, i) => (
                <div key={value} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium">{value}</span>
                      <span className="text-xs text-muted-foreground">{count} meta{count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-gold rounded-full"
                        style={{ width: `${Math.max(8, (count / (topRoutes[0]?.count ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top destinos */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-brand-gold" />
            Destinos mais desejados
          </h2>
          {topDestinations.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum destino específico ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topDestinations.map(({ value, count }) => (
                <div
                  key={value}
                  className="glass rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-white text-sm font-medium">{value}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Classes */}
          {topCabins.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Por classe</p>
              <div className="flex gap-3 flex-wrap">
                {topCabins.map(({ value, count }) => {
                  const label = value === "business" ? "Executiva" : value === "economy" ? "Econômica" : "Qualquer";
                  return (
                    <div key={value} className="flex items-center gap-1.5">
                      <span className="text-sm text-white">{label}</span>
                      <Badge variant={value === "business" ? "gold" : "secondary"} className="text-xs">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Programas mais buscados (acúmulo) */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-brand-gold" />
            Programas de acúmulo mais desejados
            <Badge variant="secondary" className="text-xs ml-auto">{accumGoals.length} metas</Badge>
          </h2>
          {topPrograms.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum programa alvo definido ainda.</p>
          ) : (
            <div className="space-y-2">
              {topPrograms.map(({ value, count }, i) => (
                <div key={value} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{value}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${Math.max(8, (count / (topPrograms[0]?.count ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tipos de oportunidade */}
          {topOppTypes.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Tipos de oportunidade buscados</p>
              <div className="flex flex-wrap gap-2">
                {topOppTypes.map(({ value, count }) => (
                  <div key={value} className="flex items-center gap-1.5 glass rounded-lg px-2.5 py-1.5">
                    <span className="text-xs text-white capitalize">{value.replace("-", " ")}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metas sem oportunidade */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Metas sem oportunidade ainda
            <Badge variant="secondary" className="text-xs ml-auto">{unservedGoals.length}</Badge>
          </h2>
          {unservedGoals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-green-400 font-medium">🎉 Todas as metas foram servidas!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {unservedGoals.slice(0, 15).map((goal) => (
                <div key={goal.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    goal.type === "flight" ? "bg-brand-gold" : goal.type === "accumulation" ? "bg-blue-400" : "bg-purple-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.type === "flight"
                        ? `${goal.origin ?? "?"} → ${goal.destination ?? "?"}`
                        : goal.type === "accumulation"
                          ? goal.target_program ?? "Qualquer programa"
                          : "Cartão"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0 capitalize">
                    {goal.type === "flight" ? "Voo" : goal.type === "accumulation" ? "Acúmulo" : "Cartão"}
                  </Badge>
                </div>
              ))}
              {unservedGoals.length > 15 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{unservedGoals.length - 15} metas adicionais
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Distribuição por tipo */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-brand-gold" />
          Distribuição de metas por tipo
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Passagem", count: flightGoals.length, icon: Plane, color: "bg-brand-gold" },
            { label: "Acúmulo", count: accumGoals.length, icon: TrendingUp, color: "bg-blue-400" },
            { label: "Cartão", count: cardGoals.length, icon: BarChart3, color: "bg-purple-400" },
          ].map(({ label, count, color }) => {
            const pct = allGoals.length > 0 ? Math.round((count / allGoals.length) * 100) : 0;
            return (
              <div key={label} className="text-center">
                <div className={cn("w-2 h-2 rounded-full mx-auto mb-2", color)} />
                <p className="text-2xl font-bold text-white font-display">{count}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{pct}%</p>
              </div>
            );
          })}
        </div>
        {allGoals.length > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden mt-4 gap-0.5">
            {[
              { count: flightGoals.length, color: "bg-brand-gold" },
              { count: accumGoals.length, color: "bg-blue-400" },
              { count: cardGoals.length, color: "bg-purple-400" },
            ].map(({ count, color }, i) => (
              <div
                key={i}
                className={cn("h-full transition-all", color)}
                style={{ width: `${(count / allGoals.length) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
