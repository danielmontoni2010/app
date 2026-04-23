import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Target, Bell, Zap, Crown, ArrowRight, Radar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { formatRelativeTime } from "@/lib/utils";
import type { Profile, Opportunity } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { data: profileData },
    { count: activeGoals },
    { count: alertsToday },
    { count: totalAlerts },
    { count: oppCount },
    { data: recentAlerts },
    { data: matchedOpps },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("goals").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("status", "active"),
    supabase.from("alerts").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", todayStart.toISOString()),
    supabase.from("alerts").select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("opportunities").select("*", { count: "exact", head: true })
      .eq("active", true),
    // Últimos 5 alertas com dados da oportunidade
    supabase.from("alerts")
      .select("id, created_at, seen_at, opportunities(id, title, type, program, bonus_percentage, origin, destination, miles_amount, is_vip, active, external_url, description, cabin_class, available_from, available_to, valid_until, min_transfer, max_transfer, tax_amount, updated_at, created_by, created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // Até 4 oportunidades que batem com metas do usuário
    supabase.from("alerts")
      .select("opportunity_id, opportunities(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const profile = profileData as Profile | null;
  const firstName = profile?.name?.split(" ")[0] ?? "aluno";
  const plan = profile?.plan ?? "essencial";
  const maxGoals = plan === "pro" ? "∞" : "3";

  // Oportunidades com match (filtra duplicatas)
  const seenOppIds = new Set<string>();
  const matchedOpportunities: Opportunity[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (matchedOpps ?? []) as any[]) {
    const opp = row.opportunities as Opportunity | null;
    if (opp && !seenOppIds.has(opp.id)) {
      seenOppIds.add(opp.id);
      matchedOpportunities.push(opp);
    }
  }

  const stats = [
    {
      label: "Metas ativas",
      value: activeGoals ?? 0,
      sub: `de ${maxGoals} disponíveis`,
      icon: Target,
      color: "text-brand-gold",
      href: "/metas",
    },
    {
      label: "Alertas hoje",
      value: alertsToday ?? 0,
      sub: `${totalAlerts ?? 0} no total`,
      icon: Bell,
      color: "text-purple-400",
      href: "/alertas",
    },
    {
      label: "Oportunidades",
      value: oppCount ?? 0,
      sub: "ativas agora",
      icon: Zap,
      color: "text-green-400",
      href: "/oportunidades",
    },
    {
      label: "Matches",
      value: matchedOpportunities.length,
      sub: "batem com suas metas",
      icon: TrendingUp,
      color: "text-brand-gold",
      href: "/oportunidades",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full border border-brand-gold animate-radar-ping" />
              <Radar className="w-full h-full text-brand-gold" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white">
              Olá, {firstName} 👋
            </h1>
          </div>
          <p className="text-muted-foreground">
            Seu radar está ativo · acompanhando {activeGoals ?? 0} meta{(activeGoals ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        {plan === "pro" && (
          <Badge variant="gold" className="gap-1 shrink-0">
            <Crown className="w-3 h-3" /> PRO
          </Badge>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <div className="glass rounded-xl p-5 hover:border-brand-gold/30 transition-all group cursor-pointer h-full">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className={`w-5 h-5 ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
              </div>
              <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Upgrade CTA para Essencial */}
      {plan === "essencial" && (activeGoals ?? 0) >= 3 && (
        <div className="glass rounded-xl p-5 border-brand-gold/30 bg-brand-gold/5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white mb-0.5">Limite de metas atingido</p>
            <p className="text-sm text-muted-foreground">
              Upgrade para PRO e crie metas ilimitadas com alertas em tempo real
            </p>
          </div>
          <Link href="/configuracoes?upgrade=true" className="shrink-0">
            <Button variant="gold" size="sm" className="gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Fazer upgrade
            </Button>
          </Link>
        </div>
      )}

      {/* Oportunidades que batem com metas */}
      {matchedOpportunities.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🎯 Bate com suas metas
            </h2>
            <Link href="/oportunidades" className="text-sm text-brand-gold hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {matchedOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                matchesGoal={true}
                userPlan={plan as "essencial" | "pro"}
              />
            ))}
          </div>
        </section>
      )}

      {/* Últimos alertas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            Últimos alertas
          </h2>
          <Link href="/alertas" className="text-sm text-brand-gold hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!recentAlerts?.length ? (
          <div className="glass rounded-xl p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-white font-medium mb-1">Nenhum alerta ainda</p>
            <p className="text-muted-foreground text-sm mb-4">
              {(activeGoals ?? 0) === 0
                ? "Crie sua primeira meta para começar a receber alertas"
                : "O radar está ativo — você será notificado quando surgir uma oportunidade"}
            </p>
            {(activeGoals ?? 0) === 0 && (
              <Link href="/metas/nova">
                <Button variant="gold" size="sm">Criar minha primeira meta</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(recentAlerts as any[]).map((alert) => {
              const opp = alert.opportunities as Opportunity | null;
              if (!opp) return null;
              const unseen = !alert.seen_at;

              return (
                <Link key={alert.id} href="/alertas">
                  <div className={`glass rounded-xl p-4 flex items-center gap-3 hover:border-brand-gold/20 transition-all ${unseen ? "border-brand-gold/20" : ""}`}>
                    {/* Dot de status */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${unseen ? "bg-brand-gold animate-pulse-gold" : "bg-muted"}`} />

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${unseen ? "text-white" : "text-muted-foreground"}`}>
                        {opp.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opp.program} · {formatRelativeTime(alert.created_at)}
                      </p>
                    </div>

                    {opp.is_vip && (
                      <Badge variant="gold" className="text-xs shrink-0">PRO</Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Empty state geral */}
      {(activeGoals ?? 0) === 0 && !recentAlerts?.length && (
        <div className="glass rounded-xl p-8 text-center border-dashed">
          <Radar className="w-12 h-12 text-brand-gold/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Seu radar ainda não está configurado</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Crie suas metas para dizer ao radar o que você está procurando — passagens, transferências bônus, acúmulo turbinado.
          </p>
          <Link href="/metas/nova">
            <Button variant="gold">Criar primeira meta</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
