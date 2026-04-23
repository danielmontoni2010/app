import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/goals/GoalCard";
import { Plus, Target } from "lucide-react";
import type { Goal, Profile } from "@/lib/supabase/types";

export default async function MetasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: goalsData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const profile = profileData as Profile | null;
  const goals = (goalsData || []) as Goal[];
  const maxGoals = profile?.plan === "pro" ? Infinity : 3;
  const activeGoals = goals.filter((g) => g.status === "active");
  const canCreate = activeGoals.length < maxGoals;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Minhas Metas</h1>
          <p className="text-muted-foreground mt-1">
            {profile?.plan === "pro"
              ? `${activeGoals.length} metas ativas — ilimitadas no Pro`
              : `${activeGoals.length} de 3 metas ativas no Essencial`}
          </p>
        </div>
        {canCreate ? (
          <Link href="/metas/nova">
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </Link>
        ) : (
          <Link href="/conta#upgrade">
            <Button variant="gold-outline">
              <Plus className="w-4 h-4 mr-2" />
              Upgrade para mais metas
            </Button>
          </Link>
        )}
      </div>

      {/* Aviso limite */}
      {!canCreate && profile?.plan === "essencial" && (
        <div className="mb-6 p-4 rounded-xl border border-brand-amber/30 bg-brand-amber/10 flex items-center justify-between">
          <p className="text-brand-amber text-sm">
            ⚠️ Você atingiu o limite de 3 metas do plano Essencial.
          </p>
          <Link href="/conta#upgrade">
            <Button variant="gold" size="sm">Fazer upgrade → Pro</Button>
          </Link>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-white mb-2">Nenhuma meta ainda</h3>
          <p className="text-muted-foreground mb-6">
            Crie sua primeira meta e seja notificado quando uma oportunidade aparecer.
          </p>
          <Link href="/metas/nova">
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira meta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
