import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Zap, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Opportunity } from "@/lib/supabase/types";

export default async function AdminOportunidadesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Oportunidades</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as oportunidades da plataforma</p>
        </div>
        <Link href="/admin/oportunidades/nova">
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {opportunities?.length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-white font-medium mb-1">Nenhuma oportunidade ainda</p>
            <p className="text-muted-foreground text-sm mb-4">Crie a primeira oportunidade para os alunos</p>
            <Link href="/admin/oportunidades/nova">
              <Button variant="gold" size="sm">Criar agora</Button>
            </Link>
          </div>
        )}

        {opportunities?.map((opp: Opportunity) => (
          <div key={opp.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-brand-gold" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{opp.title}</p>
                <p className="text-xs text-muted-foreground">
                  {opp.program} · {opp.type} · {opp.bonus_percentage ? `+${opp.bonus_percentage}%` : ""} · {formatDate(opp.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {opp.is_vip && <Badge variant="gold" className="text-xs">VIP</Badge>}
              <Badge variant={opp.active ? "success" : "secondary"} className="text-xs">
                {opp.active ? "Ativa" : "Inativa"}
              </Badge>
              <Link href={`/admin/oportunidades/${opp.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
