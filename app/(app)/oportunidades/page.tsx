import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OpportunityFeed } from "@/components/opportunities/OpportunityFeed";
import { Zap } from "lucide-react";
import type { Opportunity } from "@/lib/supabase/types";
import type { Profile } from "@/lib/supabase/types";

export default async function OportunidadesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profileData },
    { data: opportunities },
    { data: userAlerts },
  ] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    supabase.from("opportunities").select("*").eq("active", true).order("created_at", { ascending: false }),
    // Alertas do usuário = oportunidades que batem com as metas dele
    supabase.from("alerts").select("opportunity_id").eq("user_id", user.id),
  ]);

  const profile = profileData as Pick<Profile, "plan"> | null;
  const userPlan = profile?.plan ?? "essencial";

  // Set de IDs de oportunidades que batem com metas do usuário
  const matchedIds = new Set<string>(
    (userAlerts ?? []).map((a: { opportunity_id: string }) => a.opportunity_id)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-6 h-6 text-brand-gold" />
          <h1 className="font-display text-3xl font-bold text-white">Oportunidades</h1>
        </div>
        <p className="text-muted-foreground">
          Todas as oportunidades ativas · as que batem com suas metas aparecem em destaque
        </p>
      </div>

      <OpportunityFeed
        opportunities={(opportunities ?? []) as Opportunity[]}
        matchedIds={matchedIds}
        userPlan={userPlan as "essencial" | "pro"}
      />
    </div>
  );
}
