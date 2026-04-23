import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoalForm } from "@/components/goals/GoalForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";

export default async function NovaMetaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as Profile | null;

  // Verifica limite
  const { count } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  const maxGoals = profile?.plan === "pro" ? Infinity : 3;
  if ((count ?? 0) >= maxGoals) redirect("/metas");

  return (
    <div>
      <div className="mb-8">
        <Link href="/metas" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para metas
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Nova Meta</h1>
        <p className="text-muted-foreground mt-1">
          Defina o que você quer e seremos notificados quando aparecer
        </p>
      </div>
      <GoalForm userId={user.id} />
    </div>
  );
}
