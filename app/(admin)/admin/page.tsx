import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, Users, Target, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Opportunity } from "@/lib/supabase/types";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { count: totalUsers },
    { count: totalGoals },
    { count: totalOpp },
    { count: totalAlerts },
    { data: recentOpp },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("goals").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("alerts").select("*", { count: "exact", head: true }),
    supabase.from("opportunities").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Usuários", value: totalUsers ?? 0, icon: Users, color: "text-blue-400" },
    { label: "Metas Ativas", value: totalGoals ?? 0, icon: Target, color: "text-brand-gold" },
    { label: "Oportunidades Ativas", value: totalOpp ?? 0, icon: Zap, color: "text-green-400" },
    { label: "Alertas Enviados", value: totalAlerts ?? 0, icon: Bell, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da plataforma</p>
        </div>
        <Link href="/admin/oportunidades/nova">
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{value.toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Oportunidades Recentes</h2>
          <Link href="/admin/oportunidades" className="text-sm text-brand-gold hover:underline">
            Ver todas →
          </Link>
        </div>

        <div className="space-y-2">
          {recentOpp?.length === 0 && (
            <div className="glass rounded-xl p-8 text-center text-muted-foreground">
              Nenhuma oportunidade cadastrada ainda.
            </div>
          )}
          {recentOpp?.map((opp: Opportunity) => (
            <Link key={opp.id} href={`/admin/oportunidades/${opp.id}`}>
              <div className="glass rounded-xl p-4 hover:border-brand-gold/30 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-brand-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{opp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {opp.program} · {opp.type} · {formatDate(opp.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {opp.is_vip && <Badge variant="gold" className="text-xs">VIP</Badge>}
                  <Badge variant={opp.active ? "success" : "secondary"} className="text-xs">
                    {opp.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
