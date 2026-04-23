import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { GoalForm } from "@/components/goals/GoalForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Goal } from "@/lib/supabase/types";

export default async function EditarMetaPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("goals").select("*").eq("id", params.id).eq("user_id", user.id).single();

  if (!data) notFound();
  const goal = data as Goal;

  return (
    <div>
      <div className="mb-8">
        <Link href="/metas" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para metas
        </Link>
        <h1 className="font-display text-3xl font-bold text-white">Editar Meta</h1>
        <p className="text-muted-foreground mt-1">{goal.title}</p>
      </div>
      <GoalForm userId={user.id} goal={goal} />
    </div>
  );
}
