import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { AlertTimeline } from "@/components/alerts/AlertTimeline";
import type { Opportunity, Profile } from "@/lib/supabase/types";

export default async function AlertasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: rawAlerts }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    supabase
      .from("alerts")
      .select(`
        id,
        created_at,
        seen_at,
        notified_push,
        notified_email,
        opportunities (
          id, title, type, program,
          bonus_percentage, origin, destination,
          miles_amount, cabin_class,
          available_from, available_to,
          valid_until, min_transfer, max_transfer,
          tax_amount, external_url, description,
          is_vip, active, created_by, created_at, updated_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileData as Pick<Profile, "plan"> | null;
  const userPlan = (profile?.plan ?? "essencial") as "essencial" | "pro";

  // Normaliza os dados (Supabase retorna opportunities como objeto, não array)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alerts = (rawAlerts ?? []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      seen_at: row.seen_at,
      notified_push: row.notified_push,
      notified_email: row.notified_email,
      opportunity: row.opportunities as Opportunity,
    }))
    .filter((a) => a.opportunity !== null);

  const unseenCount = alerts.filter((a) => !a.seen_at).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-6 h-6 text-brand-gold" />
            <h1 className="font-display text-3xl font-bold text-white">Alertas</h1>
            {unseenCount > 0 && (
              <span className="w-6 h-6 rounded-full bg-brand-gold text-brand-dark text-xs font-bold flex items-center justify-center">
                {unseenCount > 9 ? "9+" : unseenCount}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {alerts.length === 0
              ? "Nenhum alerta ainda — cadastre metas para começar"
              : `${alerts.length} alerta${alerts.length !== 1 ? "s" : ""} · ${unseenCount} não lido${unseenCount !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <AlertTimeline alerts={alerts} userPlan={userPlan} />
    </div>
  );
}
